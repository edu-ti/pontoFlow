import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  User, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export function MenuDrawerPage({ user, onNavigate, onLogout }) {
  const companyName = user?.nome_empresa || 'Empresa';

  return (
    <div>
      <header className="pf-header">
        <div className="pf-header-left"></div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Menu</h1>
          <span className="pf-header-subtitle">{companyName}</span>
        </div>
        <div className="pf-header-right"></div>
      </header>

      <div className="mobile-wrapper">
        {/* Card do Usuário */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '18px'
          }}>
            {user?.nome_completo?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              {user?.nome_completo}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {companyName} • Login: {user?.login}
            </div>
          </div>
        </div>

        {/* Grupo de Ações de Relatórios Knup */}
        <div className="pf-list-group">
          {/* Relatório e Espelho Knup */}
          <div className="pf-list-item" onClick={() => onNavigate('relatorios')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-gear">
                <FileText size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Espelho de Ponto (Knup)</span>
                <span className="pf-list-sub">Visualizar registros mensais lado a lado</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>

          {/* Exportar CSV */}
          <div className="pf-list-item" onClick={() => onNavigate('relatorios')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-tag">
                <Download size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Exportar para CSV</span>
                <span className="pf-list-sub">Formato Excel para conferência rápida</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>
        </div>

        {/* Grupo de Configurações e Logout */}
        <div className="pf-list-group">
          <div className="pf-list-item" onClick={onLogout}>
            <div className="pf-list-left">
              <div className="pf-badge-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--rose)' }}>
                <LogOut size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title" style={{ color: 'var(--rose)' }}>Sair da Conta</span>
                <span className="pf-list-sub">Encerrar sessão no celular</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
