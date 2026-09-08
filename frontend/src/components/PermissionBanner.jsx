import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, CheckCircle, Play } from 'lucide-react';
import { 
  initAudioContext, 
  requestNotificationPermission, 
  playSuccessChime,
  isSoundEnabled,
  setSoundEnabled
} from '../services/soundEffects';

export function PermissionBanner({ onTestAlarm }) {
  // Inicializa o estado lendo diretamente a preferência persistida
  const [audioActive, setAudioActive] = useState(() => isSoundEnabled());
  const [notifGranted, setNotifGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifGranted(true);
      }
    }
    // Se o som já estava salvo como ativo, inicializa silenciosamente o contexto de áudio
    if (audioActive) {
      initAudioContext();
    }
  }, [audioActive]);

  const handleActivate = async () => {
    // 1. Salva a preferência como ativa no localStorage para nunca mais sumir no F5
    setSoundEnabled(true);
    setAudioActive(true);

    // 2. Desbloqueia o AudioContext e reproduz o chime de confirmação
    initAudioContext();
    playSuccessChime();

    // 3. Solicita permissão nativa de notificações no navegador
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
    }
  };

  const handleMute = () => {
    // Permite ao usuário silenciar se desejar
    setSoundEnabled(false);
    setAudioActive(false);
  };

  return (
    <div className={`sound-banner ${audioActive ? 'active' : ''}`}>
      <div className="sound-banner-text">
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: audioActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: audioActive ? '0 0 12px rgba(16, 185, 129, 0.3)' : '0 0 12px rgba(245, 158, 11, 0.3)'
        }}>
          {audioActive ? (
            <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />
          ) : (
            <Bell size={18} style={{ color: 'var(--amber)' }} />
          )}
        </div>
        <div>
          {audioActive ? (
            <div>
              <strong style={{ color: '#fff', fontSize: '13px' }}>
                Alertas Sonoros Ativos
              </strong>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--emerald)' }}>
                {notifGranted ? 'Som, vibração e notificações liberados' : 'Som e vibração liberados no celular'}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {!audioActive ? (
          <button type="button" className="btn-sound-activate" onClick={handleActivate}>
            <Volume2 size={16} />
            <span>Ativar Som</span>
          </button>
        ) : (
          <>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={onTestAlarm}
              title="Disparar teste de alerta sonoro e visual"
            >
              <Play size={13} style={{ color: '#38bdf8' }} />
              <span>Testar</span>
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ fontSize: '11px', padding: '6px 9px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}
              onClick={handleMute}
              title="Silenciar alertas sonoros"
            >
              <VolumeX size={13} />
              <span>Silenciar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
