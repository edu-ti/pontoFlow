import React from 'react';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';

export function Navbar({ user, onLogout }) {
  return (
    <header className="top-bar">
      <div className="brand">
        <div className="brand-icon">
          <Clock size={20} />
        </div>
        <div>
          <h1 className="brand-title">PontoFlow</h1>
        </div>
      </div>

      {user && (
        <div className="top-bar-user">
          <div className="user-badge">
            <span className="user-name">{user.nome_completo}</span>
            <span className="company-name">{user.nome_empresa || 'Empresa'}</span>
          </div>

          <button 
            className="btn-secondary" 
            style={{ padding: '8px 10px', borderRadius: '8px' }} 
            onClick={onLogout}
            title="Sair do PontoFlow"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
