import React from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  Tag, 
  BookOpen, 
  ChevronRight, 
  ExternalLink 
} from 'lucide-react';

export function ConfigMenuPage({ user, onNavigate }) {
  const companyName = user?.nome_empresa || 'Empresa';

  return (
    <div>
      {/* Header Estilo Ponto Fácil */}
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={() => onNavigate('dia')}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">{companyName}</h1>
        </div>
        <div className="pf-header-right"></div>
      </header>

      <div className="mobile-wrapper">
        {/* Campo de Nome do Emprego */}
        <div style={{ padding: '4px 0 10px 4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nome</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', marginTop: '2px' }}>
            {companyName}
          </div>
        </div>

        {/* Grupo de Configurações Principais */}
        <div className="pf-list-group">
          {/* 1. Configurações de trabalho */}
          <div className="pf-list-item" onClick={() => onNavigate('config_trabalho')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-gear">
                <Settings size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Configurações de trabalho</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>

          {/* 2. Notificações */}
          <div className="pf-list-item" onClick={() => onNavigate('config_notificacoes')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-bell">
                <Bell size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Notificações</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>

          {/* 3. Marcadores */}
          <div className="pf-list-item" onClick={() => onNavigate('config_marcadores')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-tag">
                <Tag size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Marcadores</span>
              </div>
            </div>
            <ChevronRight size={18} className="pf-arrow-right" />
          </div>
        </div>

        {/* Guia de Configuração do Emprego */}
        <div className="pf-list-group" style={{ marginTop: '8px' }}>
          <div className="pf-list-item" onClick={() => onNavigate('guia_instrucoes')}>
            <div className="pf-list-left">
              <div className="pf-badge-icon pf-badge-book">
                <BookOpen size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title">Guia de configuração do emprego</span>
                <span className="pf-list-sub">Aprenda a configurar jornada, conferência Knup e mais</span>
              </div>
            </div>
            <ExternalLink size={16} className="pf-arrow-right" />
          </div>
        </div>
      </div>
    </div>
  );
}
