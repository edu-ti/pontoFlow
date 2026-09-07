import { pool } from '../config/db.js';

// Utilitário para converter string HH:MI:SS para minutos
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Utilitário para converter minutos para formato HH:MM
function minutesToTime(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '00:00';
  const isNegative = totalMinutes < 0;
  const abs = Math.abs(totalMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${isNegative ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getRelatorios(request, reply) {
  try {
    const userId = request.user.id;
    const { tipo = 'mensal', ano, mes, data_inicio, data_fim } = request.query || {};

    // Buscar configurações de jornada do usuário
    const userRes = await pool.query(
      `SELECT u.nome_completo, u.login, u.entrada_seg_qui, u.saida_seg_qui, u.saida_sexta, 
              u.tempo_intervalo_minutos, e.nome_empresa
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' });
    }

    const userData = userRes.rows[0];

    // Determinar intervalo de datas
    let dtInicio;
    let dtFim;

    const hoje = new Date();
    const targetAno = ano ? parseInt(ano, 10) : hoje.getFullYear();
    const targetMes = mes ? parseInt(mes, 10) : (hoje.getMonth() + 1);

    if (tipo === 'diario') {
      const d = data_inicio || hoje.toISOString().split('T')[0];
      dtInicio = d;
      dtFim = d;
    } else if (tipo === 'semanal') {
      if (data_inicio && data_fim) {
        dtInicio = data_inicio;
        dtFim = data_fim;
      } else {
        // Início da semana atual (segunda-feira) até domingo
        const curr = new Date();
        const firstDay = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
        const mon = new Date(curr.setDate(firstDay));
        const sun = new Date(curr.setDate(firstDay + 6));
        dtInicio = mon.toISOString().split('T')[0];
        dtFim = sun.toISOString().split('T')[0];
      }
    } else {
      // Mensal (Padrão para conferência com o relógio Knup)
      const daysInMonth = new Date(targetAno, targetMes, 0).getDate();
      dtInicio = `${targetAno}-${String(targetMes).padStart(2, '0')}-01`;
      dtFim = `${targetAno}-${String(targetMes).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    }

    // Buscar registros existentes no banco dentro do período
    const registrosRes = await pool.query(
      `SELECT id, data_registro,
              TO_CHAR(entrada_expediente, 'HH24:MI:SS') as entrada_expediente,
              TO_CHAR(saida_almoco, 'HH24:MI:SS') as saida_almoco,
              TO_CHAR(volta_almoco, 'HH24:MI:SS') as volta_almoco,
              TO_CHAR(saida_expediente, 'HH24:MI:SS') as saida_expediente,
              tag, observacao
       FROM registros_ponto
       WHERE usuario_id = $1 AND data_registro >= $2 AND data_registro <= $3
       ORDER BY data_registro ASC`,
      [userId, dtInicio, dtFim]
    );

    const mapRegistros = new Map();
    registrosRes.rows.forEach(r => {
      // Normalizar data_registro para formato YYYY-MM-DD
      const dateStr = typeof r.data_registro === 'string' 
        ? r.data_registro.split('T')[0] 
        : r.data_registro.toISOString().split('T')[0];
      mapRegistros.set(dateStr, r);
    });

    // Gerar todos os dias do período para a conferência diária completa (inclusive dias sem batida)
    const dias = [];
    let current = new Date(dtInicio + 'T00:00:00');
    const end = new Date(dtFim + 'T00:00:00');

    const DIAS_SEMANA_NOMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    let totalMinutosTrabalhados = 0;
    let diasTrabalhados = 0;
    let totalMinutosPrevistos = 0;

    // Calcular jornada esperada padrão
    const minEntradaSegQui = timeToMinutes(userData.entrada_seg_qui);
    const minSaidaSegQui = timeToMinutes(userData.saida_seg_qui);
    const minSaidaSexta = timeToMinutes(userData.saida_sexta);
    const intervaloMin = userData.tempo_intervalo_minutos || 60;

    const jornadaPrevistaSegQui = (minSaidaSegQui - minEntradaSegQui) - intervaloMin;
    const jornadaPrevistaSexta = (minSaidaSexta - minEntradaSegQui) - intervaloMin;

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const dow = current.getDay(); // 0=Dom, 6=Sab

      const reg = mapRegistros.get(dateKey) || null;

      const entrada1 = reg ? reg.entrada_expediente : null;
      const saida1 = reg ? reg.saida_almoco : null;
      const entrada2 = reg ? reg.volta_almoco : null; // Volta Almoço
      const saida2 = reg ? reg.saida_expediente : null; // Fim Expediente

      // Cálculo de horas trabalhadas no dia
      let minTrabalhados = 0;
      let horasCalculadas = false;

      if (entrada1 && saida1) {
        const p1 = timeToMinutes(saida1) - timeToMinutes(entrada1);
        if (p1 > 0) minTrabalhados += p1;
      }
      if (entrada2 && saida2) {
        const p2 = timeToMinutes(saida2) - timeToMinutes(entrada2);
        if (p2 > 0) minTrabalhados += p2;
      }

      if (minTrabalhados > 0) {
        horasCalculadas = true;
        totalMinutosTrabalhados += minTrabalhados;
        diasTrabalhados++;
      }

      // Horas previstas no dia
      let minPrevistoDia = 0;
      if (dow >= 1 && dow <= 4) {
        minPrevistoDia = Math.max(0, jornadaPrevistaSegQui);
        totalMinutosPrevistos += minPrevistoDia;
      } else if (dow === 5) {
        minPrevistoDia = Math.max(0, jornadaPrevistaSexta);
        totalMinutosPrevistos += minPrevistoDia;
      }

      // Status do dia para conferência
      let statusDia = 'NORMAL';
      if (dow === 0 || dow === 6) {
        statusDia = minTrabalhados > 0 ? 'FIM_SEMANA_TRABALHADO' : 'FIM_SEMANA';
      } else if (reg && entrada1 && saida1 && entrada2 && saida2) {
        statusDia = 'COMPLETO';
      } else if (reg && (entrada1 || saida1 || entrada2 || saida2)) {
        statusDia = 'INCOMPLETO';
      } else {
        const isPast = current < new Date(hoje.toISOString().split('T')[0] + 'T00:00:00');
        statusDia = isPast ? 'FALTA' : 'PENDENTE';
      }

      dias.push({
        data: dateKey,
        dia_mes: day,
        dia_semana: DIAS_SEMANA_NOMES[dow],
        dia_semana_abrev: DIAS_SEMANA_ABREV[dow],
        eh_fim_semana: dow === 0 || dow === 6,
        // As 4 batidas correspondentes ao relógio Knup:
        batida_1_entrada: entrada1 || '-',
        batida_2_saida_almoco: saida1 || '-',
        batida_3_volta_almoco: entrada2 || '-',
        batida_4_saida_fim: saida2 || '-',
        horas_trabalhadas: minutesToTime(minTrabalhados),
        minutos_trabalhados: minTrabalhados,
        horas_previstas: minutesToTime(minPrevistoDia),
        saldo_minutos: horasCalculadas ? (minTrabalhados - minPrevistoDia) : 0,
        saldo_formatado: horasCalculadas ? minutesToTime(minTrabalhados - minPrevistoDia) : '-',
        status: statusDia,
        tag: reg ? (reg.tag || null) : null,
        observacao: reg ? (reg.observacao || '') : ''
      });

      // Avançar 1 dia
      current.setDate(current.getDate() + 1);
    }

    const saldoGeralMinutos = totalMinutosTrabalhados - totalMinutosPrevistos;

    return reply.send({
      periodo: {
        tipo,
        ano: targetAno,
        mes: targetMes,
        data_inicio: dtInicio,
        data_fim: dtFim
      },
      colaborador: {
        nome_completo: userData.nome_completo,
        login: userData.login,
        empresa: userData.nome_empresa,
        jornada: {
          entrada_seg_qui: userData.entrada_seg_qui,
          saida_seg_qui: userData.saida_seg_qui,
          saida_sexta: userData.saida_sexta,
          tempo_intervalo_minutos: userData.tempo_intervalo_minutos
        }
      },
      resumo: {
        dias_trabalhados: diasTrabalhados,
        total_horas_trabalhadas: minutesToTime(totalMinutosTrabalhados),
        total_horas_previstas: minutesToTime(totalMinutosPrevistos),
        saldo_total: minutesToTime(saldoGeralMinutos),
        saldo_positivo: saldoGeralMinutos >= 0,
        media_horas_diaria: diasTrabalhados > 0 
          ? minutesToTime(Math.round(totalMinutosTrabalhados / diasTrabalhados))
          : '00:00'
      },
      linhas: dias
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao gerar relatório.', details: err.message });
  }
}
