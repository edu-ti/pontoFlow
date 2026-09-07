import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useServerTime } from '../hooks/useServerTime';
import { useAlarmSystem } from '../hooks/useAlarmSystem';
import { ClockDisplay } from '../components/ClockDisplay';
import { PunchButtons } from '../components/PunchButtons';
import { AlarmOverlay } from '../components/AlarmOverlay';
import { PermissionBanner } from '../components/PermissionBanner';
import { playSuccessChime } from '../services/soundEffects';
import { Coffee, AlertCircle, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

export function DashboardPage({ user }) {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Carregar status do dia e sincronização do servidor
  const fetchTodayStatus = useCallback(async () => {
    try {
      const data = await api.ponto.getToday();
      setTodayData(data);
      setErrorMsg(null);
    } catch (err) {
      console.error('Erro ao buscar status do dia:', err);
      setErrorMsg('Não foi possível carregar os dados de hoje.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();

    // Sincronização periódica a cada 60 segundos
    const syncTimer = setInterval(fetchTodayStatus, 60000);
    return () => clearInterval(syncTimer);
  }, [fetchTodayStatus]);

  // Hook de Relógio sincronizado com o servidor
  const { currentTime, currentDate } = useServerTime(
    todayData?.server?.server_time,
    todayData?.server?.server_date
  );

  // Motor Inteligente de Notificações e Alarmes Sonoros/Visuais
  const { activeAlarm, dismissAlarm, triggerTestAlarm } = useAlarmSystem(todayData, currentTime);

  // Executar batida de ponto com o horário oficial do servidor
  const handlePunch = async (tipo) => {
    setPunchLoading(tipo);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const res = await api.ponto.bater(tipo);
      playSuccessChime();

      setFeedbackMsg(res.message || 'Ponto registrado com sucesso!');

      // Atualizar dados locais imediatamente
      if (res?.ponto) {
        setTodayData((prev) => ({
          ...prev,
          ponto: res.ponto
        }));
      }

      // Re-sincronizar status geral do dia
      await fetchTodayStatus();

      setTimeout(() => {
        setFeedbackMsg(null);
      }, 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao registrar batida de ponto.');
    } finally {
      setPunchLoading(null);
    }
  };

  // Cálculo de contagem regressiva do almoço
  const renderLunchCountdown = () => {
    if (!todayData?.ponto?.saida_almoco || todayData?.ponto?.volta_almoco) return null;

    const [curH, curM, curS] = (currentTime || '00:00:00').split(':').map(Number);
    const curSec = curH * 3600 + curM * 60 + curS;

    const [saidaH, saidaM] = todayData.ponto.saida_almoco.split(':').map(Number);
    const intervalM = todayData.jornada?.tempo_intervalo_minutos || 60;
    const returnSec = (saidaH * 3600 + saidaM * 60 + intervalM * 60) % 86400;

    const diffSec = returnSec - curSec;
    const diffMin = Math.ceil(diffSec / 60);

    const retHStr = String(Math.floor((returnSec % 86400) / 3600)).padStart(2, '0');
    const retMStr = String(Math.floor((returnSec % 3600) / 60)).padStart(2, '0');

    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.85))',
        border: '1px solid var(--amber-glow)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--amber)'
          }}>
            <Coffee size={20} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--amber)' }}>
              Almoço em Andamento ({intervalM} min)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Volta prevista para as <strong>{retHStr}:{retMStr}</strong> (Alarme 5m antes)
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 800,
            color: diffMin <= 5 ? 'var(--rose)' : 'var(--amber)'
          }}>
            {diffMin > 0 ? `${diffMin} min` : 'Horário esgotado!'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            restantes
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-wrapper">
      {/* Alerta Visual de Emergência em Tela Cheia */}
      <AlarmOverlay alarm={activeAlarm} onDismiss={dismissAlarm} />

      {/* Relógio Digital Central e Status */}
      <ClockDisplay 
        time={currentTime} 
        date={currentDate || todayData?.server?.server_date}
        statusGeral={todayData?.regras?.statusGeral}
        serverConnected={!loading}
      />

      {/* Banner de Áudio e Notificações com Botão de Teste */}
      <PermissionBanner onTestAlarm={triggerTestAlarm} />

      {/* Mensagens de Feedback e Sucesso */}
      {feedbackMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#6ee7b7',
          fontSize: '13px',
          animation: 'popIn 0.2s ease'
        }}>
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Mensagens de Erro */}
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fca5a5',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Card de Almoço em Andamento */}
      {renderLunchCountdown()}

      {/* Card dos 4 Botões Sequenciais com Trava Rígida */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Registros do Dia
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Travas automáticas de sequência (1 → 2 → 3 → 4)
            </p>
          </div>

          <button 
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={fetchTodayStatus}
            title="Atualizar horários"
          >
            <RefreshCw size={12} />
            <span>Atualizar</span>
          </button>
        </div>

        <PunchButtons 
          ponto={todayData?.ponto}
          onPunch={handlePunch}
          loadingPunch={punchLoading}
        />
      </div>

      {/* Informações Auxiliares da Jornada */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <span>Jornada Cadastrada:</span>
        <span>
          Seg-Qui: <strong>{todayData?.jornada?.entrada_seg_qui?.slice(0, 5)} às {todayData?.jornada?.saida_seg_qui?.slice(0, 5)}</strong> | Sex até <strong>{todayData?.jornada?.saida_sexta?.slice(0, 5)}</strong>
        </span>
      </div>
    </div>
  );
}
