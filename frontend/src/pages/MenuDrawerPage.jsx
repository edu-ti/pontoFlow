import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  User, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Clock,
  Smartphone,
  Sparkles
} from 'lucide-react';

export function MenuDrawerPage({ user, onNavigate, onLogout, onOpenInstall }) {
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

        {/* Grupo de Ações de Relatórios e Instalação */}
        <div className="pf-list-group">
          {/* Instalar Aplicativo no Celular (Android / iOS) */}
          <div 
            className="pf-list-item" 
            onClick={onOpenInstall}
            style={{ 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08))' 
            }}
          >
            <div className="pf-list-left">
              <div className="pf-badge-icon" style={{ background: 'linear-gradient(135deg, #2563eb, #10b981)', color: '#fff' }}>
                <Smartphone size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Instalar como App
                  <span style={{ fontSize: '10px', background: 'var(--emerald)', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Android & iOS
                  </span>
                </span>
                <span className="pf-list-sub">Adicionar à tela de início do seu celular</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>

          {/* Relatório e Espelho */}
          <div className="pf-list-item" onClick={() => onNavigate('relatorios')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-gear">
                <FileText size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Espelho de Ponto </span>
                <span className="pf-list-sub">Visualizar registros mensais lado a lado</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>

          {/* Exportar PDF & CSV */}
          <div className="pf-list-item" onClick={() => onNavigate('relatorios')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-tag">
                <Download size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Exportar Relatório (PDF / CSV)</span>
                <span className="pf-list-sub">Baixar espelho oficial em PDF ou planilha Excel</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>
          {/* Configurações de Usuário e Empresa */}
          <div className="pf-list-item" onClick={() => onNavigate('config_usuario')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                <User size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Meus Dados & Empresa</span>
                <span className="pf-list-sub">Editar nome, empresa e alterar senha</span>
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
