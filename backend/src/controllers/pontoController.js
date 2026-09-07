import { pool } from '../config/db.js';

export async function getTodayStatus(request, reply) {
  try {
    const userId = request.user.id;

    // Buscar horário atual e dia da semana diretamente do PostgreSQL
    const serverTimeRes = await pool.query(`
      SELECT 
        CURRENT_DATE as server_date,
        TO_CHAR(CURRENT_TIME, 'HH24:MI:SS') as server_time,
        EXTRACT(DOW FROM CURRENT_DATE) as day_of_week,
        CURRENT_TIMESTAMP as full_timestamp
    `);

    const serverInfo = serverTimeRes.rows[0];
    const serverDate = serverInfo.server_date;

    // Buscar dados do usuário (jornada)
    const userRes = await pool.query(
      `SELECT entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos
       FROM usuarios WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' });
    }

    const jornada = userRes.rows[0];

    // Buscar registro de ponto de hoje
    const pontoRes = await pool.query(
      `SELECT id, usuario_id, data_registro,
              TO_CHAR(entrada_expediente, 'HH24:MI:SS') as entrada_expediente,
              TO_CHAR(saida_almoco, 'HH24:MI:SS') as saida_almoco,
              TO_CHAR(volta_almoco, 'HH24:MI:SS') as volta_almoco,
              TO_CHAR(saida_expediente, 'HH24:MI:SS') as saida_expediente,
              tag, observacao
       FROM registros_ponto
       WHERE usuario_id = $1 AND data_registro = $2`,
      [userId, serverDate]
    );

    const ponto = pontoRes.rows[0] || {
      id: null,
      usuario_id: userId,
      data_registro: serverDate,
      entrada_expediente: null,
      saida_almoco: null,
      volta_almoco: null,
      saida_expediente: null,
      tag: null,
      observacao: null
    };

    // Determinar próximo botão permitido segundo as regras de trava:
    // 1 -> entrada_expediente
    // 2 -> saida_almoco (só se 1 batido)
    // 3 -> volta_almoco (só se 2 batido)
    // 4 -> saida_expediente (só se 3 batido)
    let proximoPonto = null;
    let statusGeral = 'NAO_INICIADO'; // NAO_INICIADO | EM_EXPEDIENTE | EM_ALMOCO | RETORNO_ALMOCO | FINALIZADO

    if (!ponto.entrada_expediente) {
      proximoPonto = 'entrada_expediente';
      statusGeral = 'NAO_INICIADO';
    } else if (!ponto.saida_almoco) {
      proximoPonto = 'saida_almoco';
      statusGeral = 'EM_EXPEDIENTE';
    } else if (!ponto.volta_almoco) {
      proximoPonto = 'volta_almoco';
      statusGeral = 'EM_ALMOCO';
    } else if (!ponto.saida_expediente) {
      proximoPonto = 'saida_expediente';
      statusGeral = 'RETORNO_ALMOCO';
    } else {
      proximoPonto = null;
      statusGeral = 'FINALIZADO';
    }

    // Calcular horário de retorno previsto do almoço se saída de almoço estiver batida
    let horarioRetornoAlmocoPrevisto = null;
    if (ponto.saida_almoco && !ponto.volta_almoco) {
      const [h, m, s] = ponto.saida_almoco.split(':').map(Number);
      const totalMin = h * 60 + m + (jornada.tempo_intervalo_minutos || 60);
      const retH = Math.floor(totalMin / 60) % 24;
      const retM = totalMin % 60;
      horarioRetornoAlmocoPrevisto = `${String(retH).padStart(2, '0')}:${String(retM).padStart(2, '0')}:00`;
    }

    // Determinar horário de saída previsto do dia
    // DOW: 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sab
    const isSexta = Number(serverInfo.day_of_week) === 5;
    const horarioSaidaPrevisto = isSexta ? jornada.saida_sexta : jornada.saida_seg_qui;

    return reply.send({
      server: {
        server_date: serverInfo.server_date,
        server_time: serverInfo.server_time,
        day_of_week: Number(serverInfo.day_of_week),
        full_timestamp: serverInfo.full_timestamp
      },
      jornada,
      ponto,
      regras: {
        proximoPonto,
        statusGeral,
        horarioRetornoAlmocoPrevisto,
        horarioSaidaPrevisto,
        intervaloMinutos: jornada.tempo_intervalo_minutos
      }
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao buscar status do ponto de hoje.', details: err.message });
  }
}

export async function baterPonto(request, reply) {
  const userId = request.user.id;
  const { tipo, observacao } = request.body || {};

  const TIPOS_VALIDOS = ['entrada_expediente', 'saida_almoco', 'volta_almoco', 'saida_expediente'];
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return reply.status(400).send({
      error: `Tipo de batida inválido. Tipos permitidos: ${TIPOS_VALIDOS.join(', ')}`
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Buscar data e hora atual do servidor
    const timeRes = await client.query(`
      SELECT 
        CURRENT_DATE as data_hoje,
        TO_CHAR(CURRENT_TIME, 'HH24:MI:SS') as hora_agora,
        CURRENT_TIME as hora_completa
    `);
    const { data_hoje, hora_agora } = timeRes.rows[0];

    // Buscar registro de hoje bloqueando a linha para concorrência segura (FOR UPDATE)
    let pontoRes = await client.query(
      `SELECT * FROM registros_ponto 
       WHERE usuario_id = $1 AND data_registro = $2 
       FOR UPDATE`,
      [userId, data_hoje]
    );

    let registro = pontoRes.rows[0];

    // Validações das regras de trava sequencial
    if (tipo === 'entrada_expediente') {
      if (registro && registro.entrada_expediente) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'A Entrada do Expediente já foi registrada hoje.' });
      }
    } else if (tipo === 'saida_almoco') {
      if (!registro || !registro.entrada_expediente) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'Não é possível bater Saída para Almoço sem antes registrar a Entrada.' });
      }
      if (registro.saida_almoco) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'A Saída para Almoço já foi registrada hoje.' });
      }
    } else if (tipo === 'volta_almoco') {
      if (!registro || !registro.saida_almoco) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'Não é possível bater Volta do Almoço sem antes registrar a Saída do Almoço.' });
      }
      if (registro.volta_almoco) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'A Volta do Almoço já foi registrada hoje.' });
      }
    } else if (tipo === 'saida_expediente') {
      if (!registro || !registro.volta_almoco) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'Não é possível bater Fim de Expediente sem antes registrar a Volta do Almoço.' });
      }
      if (registro.saida_expediente) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'O Fim de Expediente já foi registrado hoje.' });
      }
    }

    // Executar Insert ou Update com o horário do servidor
    const upsertRes = await client.query(
      `INSERT INTO registros_ponto (
         usuario_id, data_registro, ${tipo}, observacao, updated_at
       ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, data_registro)
       DO UPDATE SET 
         ${tipo} = EXCLUDED.${tipo},
         observacao = COALESCE(EXCLUDED.observacao, registros_ponto.observacao),
         updated_at = CURRENT_TIMESTAMP
       RETURNING 
         id, usuario_id, data_registro,
         TO_CHAR(entrada_expediente, 'HH24:MI:SS') as entrada_expediente,
         TO_CHAR(saida_almoco, 'HH24:MI:SS') as saida_almoco,
         TO_CHAR(volta_almoco, 'HH24:MI:SS') as volta_almoco,
         TO_CHAR(saida_expediente, 'HH24:MI:SS') as saida_expediente,
         observacao`,
      [userId, data_hoje, hora_agora, observacao || null]
    );

    await client.query('COMMIT');

    const updatedPonto = upsertRes.rows[0];

    const TITULOS_BATIDA = {
      entrada_expediente: 'Entrada Expediente',
      saida_almoco: 'Saída Almoço',
      volta_almoco: 'Volta Almoço',
      saida_expediente: 'Fim do Expediente'
    };

    return reply.send({
      message: `Ponto (${TITULOS_BATIDA[tipo]}) registrado com sucesso às ${hora_agora}!`,
      horario_registrado: hora_agora,
      data_registro: data_hoje,
      tipo_registrado: tipo,
      ponto: updatedPonto
    });
  } catch (err) {
    await client.query('ROLLBACK');
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao registrar batida de ponto.', details: err.message });
  } finally {
    client.release();
  }
}

export async function registrarTagOuAjuste(request, reply) {
  const userId = request.user.id;
  const { 
    data_registro, 
    tag, 
    observacao, 
    entrada_expediente, 
    saida_almoco, 
    volta_almoco, 
    saida_expediente 
  } = request.body || {};

  if (!tag) {
    return reply.status(400).send({ error: 'A tag é obrigatória (ex: feriado, folga, falta, ajuste_manual).' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Usar data fornecida ou data atual do servidor
    let dateToUse = data_registro;
    if (!dateToUse) {
      const timeRes = await client.query('SELECT CURRENT_DATE as data_hoje');
      dateToUse = timeRes.rows[0].data_hoje;
    }

    const upsertRes = await client.query(`
      INSERT INTO registros_ponto (
        usuario_id, data_registro, tag, observacao,
        entrada_expediente, saida_almoco, volta_almoco, saida_expediente,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (usuario_id, data_registro)
      DO UPDATE SET
        tag = EXCLUDED.tag,
        observacao = COALESCE(EXCLUDED.observacao, registros_ponto.observacao),
        entrada_expediente = COALESCE(EXCLUDED.entrada_expediente, registros_ponto.entrada_expediente),
        saida_almoco = COALESCE(EXCLUDED.saida_almoco, registros_ponto.saida_almoco),
        volta_almoco = COALESCE(EXCLUDED.volta_almoco, registros_ponto.volta_almoco),
        saida_expediente = COALESCE(EXCLUDED.saida_expediente, registros_ponto.saida_expediente),
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        id, usuario_id, data_registro,
        TO_CHAR(entrada_expediente, 'HH24:MI:SS') as entrada_expediente,
        TO_CHAR(saida_almoco, 'HH24:MI:SS') as saida_almoco,
        TO_CHAR(volta_almoco, 'HH24:MI:SS') as volta_almoco,
        TO_CHAR(saida_expediente, 'HH24:MI:SS') as saida_expediente,
        tag, observacao
    `, [
      userId, 
      dateToUse, 
      tag, 
      observacao || null, 
      entrada_expediente || null, 
      saida_almoco || null, 
      volta_almoco || null, 
      saida_expediente || null
    ]);

    await client.query('COMMIT');

    const LABELS = {
      feriado: 'Feriado',
      folga: 'Folga',
      falta: 'Falta',
      trabalho_externo: 'Trabalho Externo',
      ferias: 'Férias',
      ajuste_manual: 'Ajuste Manual'
    };

    return reply.send({
      message: `${LABELS[tag] || tag} registrado com sucesso para o dia ${dateToUse}!`,
      ponto: upsertRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao registrar evento no ponto.', details: err.message });
  } finally {
    client.release();
  }
}
