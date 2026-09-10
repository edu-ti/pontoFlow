import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Volume2, Check } from 'lucide-react';
import { 
  initAudioContext, 
  requestNotificationPermission, 
  playSuccessChime,
  setSoundEnabled
} from '../services/soundEffects';
import { enableBackgroundNotifications } from '../services/pushNotifications';
import { api } from '../services/api';

export function NotificationSettingsPage({ user, onBack }) {
  const companyName = user?.nome_empresa || 'Empresa';

  // Estados dos Toggles (Idênticos à Captura 4)
  const [horaComecar, setHoraComecar] = useState(true);
  const [antecedenciaInicio, setAntecedenciaInicio] = useState('5min');

  const [horaIntervalo, setHoraIntervalo] = useState(true);
  const [antecedenciaIntervalo, setAntecedenciaIntervalo] = useState('5min');

  const [horaRetornar, setHoraRetornar] = useState(true);
  const [antecedenciaRetorno, setAntecedenciaRetorno] = useState('5min');

  const [horaIrParaCasa, setHoraIrParaCasa] = useState(true);
  const [antecedenciaFim, setAntecedenciaFim] = useState('5min');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pontoflow_notif_prefs');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.horaComecar !== undefined) setHoraComecar(p.horaComecar);
        if (p.horaIntervalo !== undefined) setHoraIntervalo(p.horaIntervalo);
        if (p.horaRetornar !== undefined) setHoraRetornar(p.horaRetornar);
        if (p.horaIrParaCasa !== undefined) setHoraIrParaCasa(p.horaIrParaCasa);
      } catch (e) {}
    }
  }, []);

  const handleToggle = (setter, currVal, key) => {
    const newVal = !currVal;
    setter(newVal);

    // Salvar preferência
    const currentPrefs = JSON.parse(localStorage.getItem('pontoflow_notif_prefs') || '{}');
    currentPrefs[key] = newVal;
    localStorage.setItem('pontoflow_notif_prefs', JSON.stringify(currentPrefs));
    api.notifications.updatePreferences({ [key]: newVal }).catch(() => {});

    // Se estiver ativando, garante permissão de áudio, push e salva som como ativado
    if (newVal) {
      setSoundEnabled(true);
      initAudioContext();
      requestNotificationPermission().then((permission) => {
        if (permission === 'granted') enableBackgroundNotifications();
      });
    }
  };

  return (
    <div>
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Notificações</h1>
          <span className="pf-header-subtitle">{companyName}</span>
        </div>
        <div className="pf-header-right"></div>
      </header>

      <div className="mobile-wrapper">
        <div className="pf-list-group">
          {/* 1. Hora de começar */}
          <div className="pf-toggle-item">
            <div className="pf-list-text" style={{ paddingRight: '12px' }}>
              <span className="pf-list-title">Hora de começar</span>
              <span className="pf-list-sub">Avise-me quando chegar a hora de começar o trabalho</span>
            </div>
            <label className="pf-switch">
              <input 
                type="checkbox" 
                checked={horaComecar} 
                onChange={() => handleToggle(setHoraComecar, horaComecar, 'horaComecar')} 
              />
              <span className="pf-slider"></span>
            </label>
          </div>
          <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Notificar antes sobre o início: </span>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>5 minutos antes</span>
          </div>

          {/* 2. Hora do intervalo */}
          <div className="pf-toggle-item">
            <div className="pf-list-text" style={{ paddingRight: '12px' }}>
              <span className="pf-list-title">Hora do intervalo</span>
              <span className="pf-list-sub">Avise-me quando chegar a hora do intervalo</span>
            </div>
            <label className="pf-switch">
              <input 
                type="checkbox" 
                checked={horaIntervalo} 
                onChange={() => handleToggle(setHoraIntervalo, horaIntervalo, 'horaIntervalo')} 
              />
              <span className="pf-slider"></span>
            </label>
          </div>
          <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Notificar antes sobre o intervalo: </span>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>5 minutos antes</span>
          </div>

          {/* 3. Hora de retornar */}
          <div className="pf-toggle-item">
            <div className="pf-list-text" style={{ paddingRight: '12px' }}>
              <span className="pf-list-title">Hora de retornar</span>
              <span className="pf-list-sub">Avise-me quando o tempo de intervalo estiver completo</span>
            </div>
            <label className="pf-switch">
              <input 
                type="checkbox" 
                checked={horaRetornar} 
                onChange={() => handleToggle(setHoraRetornar, horaRetornar, 'horaRetornar')} 
              />
              <span className="pf-slider"></span>
            </label>
          </div>
          <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Notificar antes sobre o retorno: </span>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>Exatamente 5 minutos antes</span>
          </div>

          {/* 4. Hora de ir para casa */}
          <div className="pf-toggle-item">
            <div className="pf-list-text" style={{ paddingRight: '12px' }}>
              <span className="pf-list-title">Hora de ir para casa</span>
              <span className="pf-list-sub">Avise-me quando a carga horária estiver completa</span>
            </div>
            <label className="pf-switch">
              <input 
                type="checkbox" 
                checked={horaIrParaCasa} 
                onChange={() => handleToggle(setHoraIrParaCasa, horaIrParaCasa, 'horaIrParaCasa')} 
              />
              <span className="pf-slider"></span>
            </label>
          </div>
          <div style={{ padding: '0 16px 12px 16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Notificar antes sobre o encerramento: </span>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>Exatamente 5 minutos antes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
