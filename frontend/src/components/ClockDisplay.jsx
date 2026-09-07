import React from 'react';
import { ShieldCheck, Coffee, Briefcase, CheckCircle2 } from 'lucide-react';

export function ClockDisplay({ time, date, statusGeral, serverConnected = true }) {
  const formatBrazilianDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = () => {
    switch (statusGeral) {
      case 'EM_EXPEDIENTE':
        return (
          <span className="status-pill em-expediente">
            <Briefcase size={14} /> Em Expediente
          </span>
        );
      case 'EM_ALMOCO':
        return (
          <span className="status-pill em-almoco">
            <Coffee size={14} /> Em Intervalo de Almoço
          </span>
        );
      case 'RETORNO_ALMOCO':
        return (
          <span className="status-pill em-expediente">
            <Briefcase size={14} /> Retorno do Almoço / Tarde
          </span>
        );
      case 'FINALIZADO':
        return (
          <span className="status-pill finalizado">
            <CheckCircle2 size={14} /> Jornada Concluída com Sucesso!
          </span>
        );
      default:
        return (
          <span className="status-pill" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            Expediente Não Iniciado
          </span>
        );
    }
  };

  return (
    <div className="clock-card">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        {renderStatusBadge()}
      </div>

      <div className="clock-time" aria-label={`Horário atual: ${time}`}>
        {time || '00:00:00'}
      </div>

      <div className="clock-date">
        {formatBrazilianDate(date)}
      </div>

      <div className="server-badge">
        <span className="server-dot"></span>
        <span>{serverConnected ? 'Horário Oficial do Servidor' : 'Sincronizando...'}</span>
      </div>
    </div>
  );
}
