import React, { useState, useEffect } from 'react';
import { getToken, getStoredUser, setToken, setStoredUser } from './services/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShiftConfigPage } from './pages/ShiftConfigPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const [token, setCurrentToken] = useState(getToken());
  const [user, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'reports' | 'shift'
  const [needsInitialShift, setNeedsInitialShift] = useState(false);

  useEffect(() => {
    const handleLogout = () => {
      setCurrentToken(null);
      setCurrentUser(null);
      setActiveTab('dashboard');
    };

    window.addEventListener('pontoflow_logout', handleLogout);
    return () => window.removeEventListener('pontoflow_logout', handleLogout);
  }, []);

  const handleAuthSuccess = (loggedUser, isNewUser) => {
    setCurrentToken(getToken());
    setCurrentUser(loggedUser);
    if (isNewUser) {
      setNeedsInitialShift(true);
      setActiveTab('shift');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setCurrentToken(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleShiftSaveComplete = () => {
    setNeedsInitialShift(false);
    setActiveTab('dashboard');
  };

  // Se não estiver logado, exibe a tela de login / auto-cadastro
  if (!token || !user) {
    return (
      <div className="app-container">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Barra de Topo com dados do colaborador e logout */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Conteúdo Principal conforme a aba ativa */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardPage user={user} />
        )}

        {activeTab === 'reports' && (
          <ReportsPage user={user} />
        )}

        {activeTab === 'shift' && (
          <ShiftConfigPage 
            onSaveComplete={handleShiftSaveComplete} 
            isInitialSetup={needsInitialShift}
          />
        )}
      </main>

      {/* Barra de Navegação Inferior Estilo App Mobile */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

export default App;
