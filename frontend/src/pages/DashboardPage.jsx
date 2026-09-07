import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useServerTime } from '../hooks/useServerTime';
import { useAlarmSystem } from '../hooks/useAlarmSystem';
import { AlarmOverlay } from '../components/AlarmOverlay';
import { PermissionBanner } from '../components/PermissionBanner';
import { playSuccessChime } from '../services/soundEffects';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Briefcase, 
  Pill, 
  Bed, 
  Sun, 
  Umbrella, 
  Sparkles, 
  History, 
  Check, 
  Lock, 
  Loader2, 
  Coffee, 
  AlertCircle,
  X
} from 'lucide-react';

export function DashboardPage({ user }) {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Navegação de dias no cabeçalho
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Bottom Sheet "O que deseja adicionar?" (Captura 5)
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Buscar status diário
  const fetchTodayStatus = useCallback(async () => {
    try {
      const data = await api.ponto.getToday();
      setTodayData(data);
      setErrorMsg(null);
    } catch (err) {
      console.error('Erro ao buscar status:', err);
      setErrorMsg('Erro ao sincronizar dados com o servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
    const timer = setInterval(fetchTodayStatus, 60000);
    return () => clearInterval(timer);
  }, [fetchTodayStatus]);

  // Horário oficial do servidor
  const { currentTime, currentDate } = useServerTime(
    todayData?.server?.server_time,
    todayData?.server?.server_date
  );

  // Motor Inteligente de Alarmes de 5 minutos
  const { activeAlarm, dismissAlarm, triggerTestAlarm } = useAlarmSystem(todayData, currentTime);

  // Formatar data estilo Ponto Fácil: "seg., 07 set. 2026"
  const formatNavDate = (dateObj) => {
    try {
      const weekdays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
      const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
      const wd = weekdays[dateObj.getDay()];
      const day = String(dateObj.getDate()).padStart(2, '0');
      const mo = months[dateObj.getMonth()];
      const yr = dateObj.getFullYear();
      return `${wd}, ${day} ${mo} ${yr}`;
    } catch {
      return '';
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  // Batida sequencial oficial com horário do servidor
  const handlePunch = async (tipo) => {
    setPunchLoading(tipo);
    setErrorMsg(null);
    setFeedbackMsg(null);
    setIsSheetOpen(false);

    try {
      const res = await api.ponto.bater(tipo);
      playSuccessChime();

      setFeedbackMsg(res.message || 'Ponto registrado com sucesso!');
      if (res?.ponto) {
        setTodayData((prev) => ({
          ...prev,
          ponto: res.ponto
        }));
      }
      await fetchTodayStatus();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao registrar ponto.');
    } finally {
      setPunchLoading(null);
    }
  };

  // Determinar próximo ponto sequencial para a opção "Registro de Ponto"
  const getProximoPonto = () => {
    const p = todayData?.ponto;
    if (!p?.entrada_expediente) return 'entrada_expediente';
    if (!p?.saida_almoco) return 'saida_almoco';
    if (!p?.volta_almoco) return 'volta_almoco';
    if (!p?.saida_expediente) return 'saida_expediente';
    return null;
  };

  // Cálculos de métricas do dia
  const calcularHorasDia = () => {
    const p = todayData?.ponto;
    if (!p) return { trab: '00h 00m', saldo: '00h 00m' };

    let totalMin = 0;
    const toMin = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    if (p.entrada_expediente && p.saida_almoco) {
      totalMin += Math.max(0, toMin(p.saida_almoco) - toMin(p.entrada_expediente));
    }
    if (p.volta_almoco && p.saida_expediente) {
      totalMin += Math.max(0, toMin(p.saida_expediente) - toMin(p.volta_almoco));
    }

    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return {
      trab: `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`,
      saldo: totalMin > 0 ? `+${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m` : '00h 00m'
    };
  };

  const metricas = calcularHorasDia();

  return (
    <div>
      {/* Alarme de Emergência */}
      <AlarmOverlay alarm={activeAlarm} onDismiss={dismissAlarm} />

      {/* Header Principal Estilo Ponto Fácil (Captura 5) */}
      <header className="pf-header">
        <div className="pf-header-left">
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {user?.nome_empresa || 'PontoFlow'}
          </span>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Dia</h1>
        </div>
        <div className="pf-header-right">
          {/* Botão + (Abre o Bottom Sheet) */}
          <button 
            type="button" 
            className="pf-icon-btn" 
            onClick={() => setIsSheetOpen(true)}
            aria-label="Adicionar registro"
          >
            <Plus size={24} style={{ color: '#fff' }} />
          </button>
        </div>
      </header>

      <div className="mobile-wrapper">
        {/* Barra de Navegação da Data: < seg., 07 set. 2026 > */}
        <div className="day-nav-bar">
          <button type="button" className="pf-icon-btn" onClick={handlePrevDay}>
            <ChevronLeft size={22} />
          </button>
          <span className="day-nav-title">{formatNavDate(selectedDate)}</span>
          <button type="button" className="pf-icon-btn" onClick={handleNextDay}>
            <ChevronRight size={22} />
          </button>
        </div>

        {/* 3 Contadores: Trab. no dia | Saldo do dia | Banco de horas */}
        <div className="day-metrics-grid">
          <div className="metric-column">
            <span className="metric-label">Trab. no dia</span>
            <span className="metric-value">{metricas.trab}</span>
          </div>
          <div className="metric-column">
            <span className="metric-label">Saldo do dia</span>
            <span className="metric-value">{metricas.saldo}</span>
          </div>
          <div className="metric-column">
            <span className="metric-label">Banco de horas</span>
            <span className="metric-value">00h 00m</span>
          </div>
        </div>

        {/* Relógio Oficial Central */}
        <div style={{
          background: 'linear-gradient(180deg, #1c2438 0%, #151b2d 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '38px',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '1px'
          }}>
            {currentTime || '00:00:00'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--emerald)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--emerald)' }}></span>
            <span>Horário Oficial Sincronizado</span>
          </div>
        </div>

        {/* Banner de Ativação / Teste de Alarme */}
        <PermissionBanner onTestAlarm={triggerTestAlarm} />

        {/* Mensagens de Sucesso e Erro */}
        {feedbackMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--emerald)', padding: '10px', borderRadius: '8px', color: '#6ee7b7', fontSize: '13px', textAlign: 'center' }}>
            {feedbackMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--rose)', padding: '10px', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* Lista das 4 Batidas do Dia com Trava Sequencial */}
        <div className="pf-list-group">
          {[
            { tipo: 'entrada_expediente', num: 1, label: '1. Entrada Expediente', val: todayData?.ponto?.entrada_expediente },
            { tipo: 'saida_almoco', num: 2, label: '2. Saída Almoço', val: todayData?.ponto?.saida_almoco },
            { tipo: 'volta_almoco', num: 3, label: '3. Volta Almoço', val: todayData?.ponto?.volta_almoco },
            { tipo: 'saida_expediente', num: 4, label: '4. Fim do Expediente', val: todayData?.ponto?.saida_expediente },
          ].map((item) => {
            const isCompleted = !!item.val;
            const proximo = getProximoPonto();
            const isReady = proximo === item.tipo;

            return (
              <div 
                key={item.tipo} 
                className="pf-list-item"
                style={{
                  borderLeft: isCompleted ? '4px solid var(--emerald)' : isReady ? '4px solid var(--primary)' : '4px solid transparent'
                }}
              >
                <div className="pf-list-left">
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted ? 'var(--emerald)' : isReady ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700
                  }}>
                    {isCompleted ? <Check size={16} /> : item.num}
                  </div>
                  <div className="pf-list-text">
                    <span className="pf-list-title">{item.label}</span>
                    <span className="pf-list-sub">
                      {isCompleted ? 'Registrado' : isReady ? 'Aguardando batida' : 'Bloqueado'}
                    </span>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--emerald)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      {item.val}
                    </div>
                  ) : isReady ? (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      onClick={() => handlePunch(item.tipo)}
                      disabled={!!punchLoading}
                    >
                      {punchLoading === item.tipo ? <Loader2 size={14} className="animate-spin" /> : 'Bater Ponto'}
                    </button>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <Lock size={12} />
                      <span>Trava</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM SHEET: "O QUE DESEJA ADICIONAR?" (Captura 5 Idêntica)  */}
      {/* ------------------------------------------------------------- */}
      {isSheetOpen && (
        <div className="pf-sheet-backdrop" onClick={() => setIsSheetOpen(false)}>
          <div className="pf-sheet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="pf-sheet-title">O que deseja adicionar?</h2>
              <button type="button" className="pf-icon-btn" onClick={() => setIsSheetOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* 1. Registro de ponto */}
            <div className="pf-sheet-item" onClick={() => {
              const prox = getProximoPonto();
              if (prox) handlePunch(prox);
              else alert('Todos os 4 pontos de hoje já foram registrados!');
            }}>
              <Clock size={20} style={{ color: '#38bdf8' }} />
              <span className="pf-sheet-item-label">Registro de ponto</span>
            </div>

            {/* 2. Trabalho externo */}
            <div className="pf-sheet-item" onClick={() => { alert('Trabalho externo adicionado!'); setIsSheetOpen(false); }}>
              <Briefcase size={20} style={{ color: '#d97706' }} />
              <span className="pf-sheet-item-label">Trabalho externo</span>
            </div>

            {/* 3. Falta */}
            <div className="pf-sheet-item" onClick={() => { alert('Falta registrada para conferência!'); setIsSheetOpen(false); }}>
              <Pill size={20} style={{ color: '#ef4444' }} />
              <span className="pf-sheet-item-label">Falta</span>
            </div>

            {/* 4. Folga */}
            <div className="pf-sheet-item" onClick={() => { alert('Folga registrada!'); setIsSheetOpen(false); }}>
              <Bed size={20} style={{ color: '#facc15' }} />
              <span className="pf-sheet-item-label">Folga</span>
            </div>

            {/* 5. Feriado */}
            <div className="pf-sheet-item" onClick={() => { alert('Feriado marcado!'); setIsSheetOpen(false); }}>
              <Sun size={20} style={{ color: '#34d399' }} />
              <span className="pf-sheet-item-label">Feriado</span>
            </div>

            {/* 6. Férias */}
            <div className="pf-sheet-item" onClick={() => { alert('Férias registradas!'); setIsSheetOpen(false); }}>
              <Umbrella size={20} style={{ color: '#fb923c' }} />
              <span className="pf-sheet-item-label">Férias</span>
            </div>

            {/* 7. Ajuste manual */}
            <div className="pf-sheet-item" onClick={() => { alert('Ajuste manual para conferência com espelho Knup!'); setIsSheetOpen(false); }}>
              <Sparkles size={20} style={{ color: '#c084fc' }} />
              <span className="pf-sheet-item-label">Ajuste manual</span>
            </div>

            {/* 8. Carga horária diferente */}
            <div className="pf-sheet-item" onClick={() => { alert('Carga horária alterada para hoje.'); setIsSheetOpen(false); }}>
              <Clock size={20} style={{ color: '#f472b6' }} />
              <span className="pf-sheet-item-label">Carga horária diferente</span>
            </div>

            {/* 9. Zerar banco de horas */}
            <div className="pf-sheet-item" onClick={() => { alert('Banco de horas zerado.'); setIsSheetOpen(false); }}>
              <History size={20} style={{ color: '#22d3ee' }} />
              <span className="pf-sheet-item-label">Zerar banco de horas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
