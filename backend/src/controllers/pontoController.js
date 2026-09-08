import { pool } from '../config/db.js';

export async function getTodayStatus(request, reply) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Usuário não autenticado.' });
    }

    // 1. Obter data e hora do servidor no fuso horário de Brasília / Pernambuco (America/Sao_Paulo / UTC-3)
    let serverInfo;
    try {
      const serverTimeRes = await pool.query(`
        SELECT 
          TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as server_date,
          TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI:SS') as server_time,
          EXTRACT(DOW FROM (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'))::INT as day_of_week,
          TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS') as full_timestamp
      `);
      serverInfo = serverTimeRes.rows[0];
    } catch (clockErr) {
      console.warn('[PONTO CONTROLLER] Falha na consulta de horário SQL, usando fallback local:', clockErr.message);
      const now = new Date();
      const options = { timeZone: 'America/Sao_Paulo', hour12: false };
      const dParts = new Intl.DateTimeFormat('pt-BR', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('/');
      const server_date = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
      const server_time = new Intl.DateTimeFormat('pt-BR', { ...options, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
      serverInfo = {
        server_date,
        server_time,
        day_of_week: now.getDay(),
        full_timestamp: `${server_date}T${server_time}`
      };
    }

    const serverDate = serverInfo.server_date;

    // 2. Buscar dados da jornada do usuário com valores padrão defensivos
    let jornada = {
      entrada_seg_qui: '08:00:00',
      saida_seg_qui: '18:00:00',
      saida_sexta: '17:00:00',
      tempo_intervalo_minutos: 60
    };

    try {
      const userRes = await pool.query(
        `SELECT entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos
         FROM usuarios WHERE id = $1`,
        [userId]
      );
      if (userRes.rows.length > 0) {
        jornada = { ...jornada, ...userRes.rows[0] };
      }
    } catch (userQueryErr) {
      console.warn('[PONTO CONTROLLER] Colunas de jornada não encontradas, mantendo padrões:', userQueryErr.message);
    }

    // 3. Buscar registro de ponto de hoje com fallback para compatibilidade de schema
    let ponto = {
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

    try {
      const pontoRes = await pool.query(
        `SELECT id, usuario_id,
                TO_CHAR(data_registro, 'YYYY-MM-DD') as data_registro,
                TO_CHAR(entrada_expediente, 'HH24:MI:SS') as entrada_expediente,
                TO_CHAR(saida_almoco, 'HH24:MI:SS') as saida_almoco,
                TO_CHAR(volta_almoco, 'HH24:MI:SS') as volta_almoco,
                TO_CHAR(saida_expediente, 'HH24:MI:SS') as saida_expediente,
                tag, observacao
         FROM registros_ponto
         WHERE usuario_id = $1 AND data_registro = $2::DATE`,
        [userId, serverDate]
      );
      if (pontoRes.rows.length > 0) {
        ponto = { ...ponto, ...pontoRes.rows[0] };
      }
    } catch (queryErr) {
      console.warn('[PONTO CONTROLLER] Query padrão de registros_ponto falhou, tentando básica:', queryErr.message);
      try {
        const pontoFallback = await pool.query(
          `SELECT id, usuario_id,
                  TO_CHAR(data_registro, 'YYYY-MM-DD') as data_registro,
                  TO_CHAR(entrada_expediente, 'HH24:MI:SS') as entrada_expediente,
                  TO_CHAR(saida_almoco, 'HH24:MI:SS') as saida_almoco,
                  TO_CHAR(volta_almoco, 'HH24:MI:SS') as volta_almoco,
                  TO_CHAR(saida_expediente, 'HH24:MI:SS') as saida_expediente
           FROM registros_ponto
           WHERE usuario_id = $1 AND data_registro = $2::DATE`,
          [userId, serverDate]
        );
        if (pontoFallback.rows.length > 0) {
          ponto = { ...ponto, ...pontoFallback.rows[0] };
        }
      } catch (fbErr) {
        console.warn('[PONTO CONTROLLER] Query compatível de ponto também falhou:', fbErr.message);
      }
    }

    // 4. Regras de trava sequencial (1 -> 2 -> 3 -> 4)
    let proximoPonto = null;
    let statusGeral = 'NAO_INICIADO';

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

    // 5. Calcular horário previsto de retorno do almoço
    let horarioRetornoAlmocoPrevisto = null;
    if (ponto.saida_almoco && !ponto.volta_almoco) {
      try {
        const parts = ponto.saida_almoco.split(':').map(Number);
        const h = parts[0] || 0;
        const m = parts[1] || 0;
        const totalMin = h * 60 + m + (jornada.tempo_intervalo_minutos || 60);
        const retH = Math.floor(totalMin / 60) % 24;
        const retM = totalMin % 60;
        horarioRetornoAlmocoPrevisto = `${String(retH).padStart(2, '0')}:${String(retM).padStart(2, '0')}:00`;
      } catch (calcErr) {
        console.warn('Erro ao calcular retorno previsto de almoço:', calcErr);
      }
    }

    // 6. Determinar horário de saída previsto do dia
    const isSexta = Number(serverInfo.day_of_week) === 5;
    const horarioSaidaPrevisto = isSexta ? (jornada.saida_sexta || '17:00:00') : (jornada.saida_seg_qui || '18:00:00');

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
        intervaloMinutos: jornada.tempo_intervalo_minutos || 60
      }
    });
  } catch (err) {
    console.error('[ERRO CRÍTICO getTodayStatus]:', err);
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao buscar status do ponto de hoje.', details: err.message });
  }
}

export async function baterPonto(request, reply) {
  const userId = request.user?.id;
  if (!userId) {
    return reply.status(401).send({ error: 'Usuário não autenticado.' });
  }

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

    // Buscar data e hora atual do servidor formatados no fuso de Brasília / Pernambuco
    const timeRes = await client.query(`
      SELECT 
        TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_hoje,
        TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI:SS') as hora_agora
    `);
    const { data_hoje, hora_agora } = timeRes.rows[0];

    // Buscar registro de hoje bloqueando a linha para concorrência segura (FOR UPDATE)
    let pontoRes = await client.query(
      `SELECT * FROM registros_ponto 
       WHERE usuario_id = $1 AND data_registro = $2::DATE 
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
       ) VALUES ($1, $2::DATE, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, data_registro)
       DO UPDATE SET 
         ${tipo} = EXCLUDED.${tipo},
         observacao = COALESCE(EXCLUDED.observacao, registros_ponto.observacao),
         updated_at = CURRENT_TIMESTAMP
       RETURNING 
         id, usuario_id,
         TO_CHAR(data_registro, 'YYYY-MM-DD') as data_registro,
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
  const userId = request.user?.id;
  if (!userId) {
    return reply.status(401).send({ error: 'Usuário não autenticado.' });
  }

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

    // Usar data fornecida ou data atual do servidor no fuso de Brasília / Pernambuco
    let dateToUse = data_registro;
    if (!dateToUse) {
      const timeRes = await client.query("SELECT TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_hoje");
      dateToUse = timeRes.rows[0].data_hoje;
    }

    const upsertRes = await client.query(`
      INSERT INTO registros_ponto (
        usuario_id, data_registro, tag, observacao,
        entrada_expediente, saida_almoco, volta_almoco, saida_expediente,
        updated_at
      ) VALUES ($1, $2::DATE, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
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
        id, usuario_id,
        TO_CHAR(data_registro, 'YYYY-MM-DD') as data_registro,
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
