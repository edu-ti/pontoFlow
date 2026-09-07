import React, { useState, useEffect } from 'react';
import { api, setStoredUser, getStoredUser } from '../services/api';
import { SlidersHorizontal, Clock, Check, Loader2, Save, ArrowLeft } from 'lucide-react';
import { playSuccessChime } from '../services/soundEffects';

export function ShiftConfigPage({ onSaveComplete, isInitialSetup = false }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [entradaSegQui, setEntradaSegQui] = useState('08:00');
  const [saidaSegQui, setSaidaSegQui] = useState('18:00');
  const [saidaSexta, setSaidaSexta] = useState('17:00');
  const [intervaloMinutos, setIntervaloMinutos] = useState(60);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.auth.getMe();
        if (res?.user) {
          if (res.user.entrada_seg_qui) setEntradaSegQui(res.user.entrada_seg_qui.slice(0, 5));
          if (res.user.saida_seg_qui) setSaidaSegQui(res.user.saida_seg_qui.slice(0, 5));
          if (res.user.saida_sexta) setSaidaSexta(res.user.saida_sexta.slice(0, 5));
          if (res.user.tempo_intervalo_minutos) setIntervaloMinutos(res.user.tempo_intervalo_minutos);
        }
      } catch (err) {
        console.error('Erro ao carregar turno:', err);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const schedule = {
        entrada_seg_qui: `${entradaSegQui}:00`,
        saida_seg_qui: `${saidaSegQui}:00`,
        saida_sexta: `${saidaSexta}:00`,
        tempo_intervalo_minutos: parseInt(intervaloMinutos, 10)
      };

      const res = await api.auth.updateSchedule(schedule);
      if (res?.user) {
        const current = getStoredUser() || {};
        setStoredUser({ ...current, ...res.user });
      }

      playSuccessChime();
      setSavedSuccess(true);
      setTimeout(() => {
        onSaveComplete();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar configurações de jornada.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="mobile-wrapper" style={{ justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="mobile-wrapper">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid var(--border-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
              {isInitialSetup ? 'Configurar Seu Turno' : 'Jornada de Trabalho'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Defina seus horários para disparo automático dos alertas de saída e almoço
            </p>
          </div>
        </div>

        {isInitialSetup && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            color: '#c7d2fe'
          }}>
            👋 Bem-vindo! Configure sua jornada abaixo para calibrar o assistente de ponto.
          </div>
        )}

        {savedSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>Turno salvo com sucesso! Redirecionando...</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            color: '#fca5a5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Horário de Entrada (Segunda a Sexta)</label>
            <input 
              type="time" 
              className="form-input" 
              value={entradaSegQui}
              onChange={(e) => setEntradaSegQui(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Horário de Saída (Segunda a Quinta)</label>
            <input 
              type="time" 
              className="form-input" 
              value={saidaSegQui}
              onChange={(e) => setSaidaSegQui(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              O sistema disparará alerta 5 minutos antes deste horário (de Seg a Qui).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Horário de Saída (Sexta-feira)</label>
            <input 
              type="time" 
              className="form-input" 
              value={saidaSexta}
              onChange={(e) => setSaidaSexta(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Na sexta-feira, o alarme tocará 5 minutos antes deste horário.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Intervalo de Almoço (Minutos)</label>
            <div className="interval-chips">
              {[60, 90, 120].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  className={`interval-chip ${parseInt(intervaloMinutos, 10) === mins ? 'active' : ''}`}
                  onClick={() => setIntervaloMinutos(mins)}
                >
                  {mins} min ({mins / 60}h)
                </button>
              ))}
            </div>

            <div style={{ marginTop: '8px' }}>
              <input 
                type="number" 
                className="form-input" 
                min="15" 
                max="240"
                value={intervaloMinutos}
                onChange={(e) => setIntervaloMinutos(e.target.value)}
                placeholder="Ou digite outro valor em minutos"
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Ao bater a saída de almoço, o alarme tocará 5min antes de expirar este tempo.
            </span>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Salvar e Aplicar Turno</span>
          </button>
        </form>
      </div>
    </div>
  );
}
