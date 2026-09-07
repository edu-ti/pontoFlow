import React, { useState, useEffect } from 'react';
import { Bell, Volume2, CheckCircle, Play } from 'lucide-react';
import { 
  initAudioContext, 
  requestNotificationPermission, 
  playSuccessChime 
} from '../services/soundEffects';

export function PermissionBanner({ onTestAlarm }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifGranted(true);
      }
    }
  }, []);

  const handleActivate = async () => {
    // Desbloquear AudioContext do celular
    initAudioContext();
    playSuccessChime();
    setAudioUnlocked(true);

    // Solicitar permissão de notificação
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
    }
  };

  return (
    <div className="sound-banner">
      <div className="sound-banner-text">
        <Bell size={18} style={{ color: audioUnlocked ? 'var(--emerald)' : 'var(--amber)', flexShrink: 0 }} />
        <span>
          {audioUnlocked && notifGranted ? (
            <strong style={{ color: 'var(--emerald)' }}>
              Sons & Alertas Ativos no Celular
            </strong>
          ) : (
            <>
              <strong>Ativar Alertas no Celular</strong>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)' }}>
                Necessário para o som tocar mesmo em segundo plano
              </span>
            </>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {!audioUnlocked ? (
          <button className="btn-sound-activate" onClick={handleActivate}>
            <Volume2 size={15} />
            <span>Ativar</span>
          </button>
        ) : (
          <button 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '6px 10px' }}
            onClick={onTestAlarm}
            title="Disparar teste de alerta sonoro e visual"
          >
            <Play size={13} />
            <span>Testar Alarme</span>
          </button>
        )}
      </div>
    </div>
  );
}
