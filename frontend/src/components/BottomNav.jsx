import React from 'react';
import { Menu, Calendar, Settings } from 'lucide-react';

export function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="bottom-nav-pf" aria-label="Navegação inferior">
      <button 
        type="button"
        className={`nav-item-pf ${activeTab === 'menu' ? 'active' : ''}`}
        onClick={() => onSelectTab('menu')}
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>

      <button 
        type="button"
        className={`nav-item-pf ${activeTab === 'dia' ? 'active' : ''}`}
        onClick={() => onSelectTab('dia')}
      >
        <Calendar size={20} />
        <span>Dia</span>
      </button>

      <button 
        type="button"
        className={`nav-item-pf ${activeTab === 'configuracoes' ? 'active' : ''}`}
        onClick={() => onSelectTab('configuracoes')}
      >
        <Settings size={20} />
        <span>Configurações</span>
      </button>
    </nav>
  );
}
