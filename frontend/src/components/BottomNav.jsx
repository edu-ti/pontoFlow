import React from 'react';
import { Clock, FileText, SlidersHorizontal } from 'lucide-react';

export function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onSelectTab('dashboard')}
      >
        <Clock size={22} />
        <span>Bater Ponto</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
        onClick={() => onSelectTab('reports')}
      >
        <FileText size={22} />
        <span>Relatórios Knup</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'shift' ? 'active' : ''}`}
        onClick={() => onSelectTab('shift')}
      >
        <SlidersHorizontal size={22} />
        <span>Meu Turno</span>
      </button>
    </nav>
  );
}
