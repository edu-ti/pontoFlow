import React from 'react';
import { BellRing, VolumeX, AlertTriangle } from 'lucide-react';

export function AlarmOverlay({ alarm, onDismiss }) {
  if (!alarm) return null;

  return (
    <div className="alarm-overlay" role="alertdialog" aria-modal="true">
      <div className="alarm-box">
        <div className="alarm-icon-ring">
          <BellRing size={38} />
        </div>

        <div>
          <h2 className="alarm-title">{alarm.title}</h2>
          <p className="alarm-desc" style={{ marginTop: '8px' }}>
            {alarm.message}
          </p>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          color: '#fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, color: '#f87171' }} />
          <span><strong>Atenção:</strong> Dirija-se imediatamente ao relógio de ponto físico!</span>
        </div>

        <button 
          className="btn-dismiss-alarm"
          onClick={onDismiss}
          autoFocus
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <VolumeX size={20} />
            <span>Entendi / Silenciar Alarme</span>
          </span>
        </button>
      </div>
    </div>
  );
}
