import React from 'react';
import { ArrowLeft, Tag, Plus } from 'lucide-react';

export function MarcadoresPage({ user, onBack }) {
  const companyName = user?.nome_empresa || 'Empresa';

  const marcadoresPadrao = [
    { id: 1, nome: 'Trabalho presencial', cor: '#3b82f6' },
    { id: 2, nome: 'Home Office', cor: '#10b981' },
    { id: 3, nome: 'Visita a cliente', cor: '#f59e0b' },
    { id: 4, nome: 'Hora extra autorizada', cor: '#8b5cf6' }
  ];

  return (
    <div>
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Marcadores</h1>
          <span className="pf-header-subtitle">{companyName}</span>
        </div>
        <div className="pf-header-right">
          <button className="pf-icon-btn">
            <Plus size={20} />
          </button>
        </div>
      </header>

      <div className="mobile-wrapper">
        <div className="pf-list-group">
          {marcadoresPadrao.map((m) => (
            <div key={m.id} className="pf-list-item">
              <div className="pf-list-left">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: m.cor }}></div>
                <span className="pf-list-title">{m.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
