import React from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';

export function GuiaPage({ user, onBack }) {
  const companyName = user?.nome_empresa || 'Empresa';

  return (
    <div>
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Guia de Configuração</h1>
          <span className="pf-header-subtitle">{companyName}</span>
        </div>
        <div className="pf-header-right"></div>
      </header>

      <div className="mobile-wrapper">
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            Como funciona o PontoFlow:
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            O PontoFlow é o seu assistente inteligente no celular para garantir que você nunca esqueça de bater o ponto físico no relógio.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <Clock size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>Alerta de Retorno do Almoço:</strong>
                <div style={{ color: 'var(--text-muted)' }}>
                  5 minutos antes de expirar seu intervalo, o celular emite bipes sonoros repetitivos e uma tela piscante para você se dirigir ao relógio.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <Clock size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>Alerta de Encerramento do Expediente:</strong>
                <div style={{ color: 'var(--text-muted)' }}>
                  5 minutos antes do horário de saída (Seg-Qui ou Sexta), o alarme toca para você não esquecer a saída.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <CheckCircle size={18} style={{ color: '#34d399', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>Espelho Mensal:</strong>
                <div style={{ color: 'var(--text-muted)' }}>
                  No final do mês, vá na aba Menu e exporte o espelho para CSV para comparar diretamente com o relatório extraído via pen drive.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
