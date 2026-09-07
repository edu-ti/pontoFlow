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
    <div className={`sound-banner ${audioUnlocked && notifGranted ? 'active' : ''}`}>
      <div className="sound-banner-text">
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: audioUnlocked && notifGranted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: audioUnlocked && notifGranted ? '0 0 12px rgba(16, 185, 129, 0.3)' : '0 0 12px rgba(245, 158, 11, 0.3)'
        }}>
          {audioUnlocked && notifGranted ? (
            <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />
          ) : (
            <Bell size={18} style={{ color: 'var(--amber)' }} />
          )}
        </div>
        <div>
          {audioUnlocked && notifGranted ? (
            <div>
              <strong style={{ color: '#fff', fontSize: '13px' }}>
                Alertas Sonoros Ativos
              </strong>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--emerald)' }}>
                Som e vibração liberados no celular
              </span>
            </div>
          ) : (
            <div>
              <strong style={{ color: '#fff', fontSize: '13px' }}>
                Ativar Alertas no Celular
              </strong>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                Necessário para o som tocar com a tela bloqueada
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        {!audioUnlocked ? (
          <button type="button" className="btn-sound-activate" onClick={handleActivate}>
            <Volume2 size={16} />
            <span>Ativar Som</span>
          </button>
        ) : (
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '7px 12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={onTestAlarm}
            title="Disparar teste de alerta sonoro e visual"
          >
            <Play size={13} style={{ color: 'var(--primary)' }} />
            <span>Testar Som</span>
          </button>
        )}
      </div>
    </div>
  );
}
