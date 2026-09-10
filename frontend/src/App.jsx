import React, { useState, useEffect } from 'react';
import { getToken, getStoredUser, setToken, setStoredUser } from './services/api';
import { BottomNav } from './components/BottomNav';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConfigMenuPage } from './pages/ConfigMenuPage';
import { ShiftDaysPage } from './pages/ShiftDaysPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';
import { MarcadoresPage } from './pages/MarcadoresPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { GuiaPage } from './pages/GuiaPage';
import { ReportsPage } from './pages/ReportsPage';
import { MenuDrawerPage } from './pages/MenuDrawerPage';
import { InstallAppModal } from './components/InstallAppModal';
import { enableBackgroundNotifications } from './services/pushNotifications';

export function App() {
  const [token, setCurrentToken] = useState(getToken());
  const [user, setCurrentUser] = useState(getStoredUser());

  // Aba ativa na barra inferior: 'menu' | 'dia' | 'configuracoes'
  const [activeTab, setActiveTab] = useState('dia');

  // Sub-rotas internas
  // null | 'config_trabalho' | 'config_notificacoes' | 'config_marcadores' | 'config_usuario' | 'guia_instrucoes' | 'relatorios'
  const [subView, setSubView] = useState(null);

  // Controle de Instalação PWA (Android / iOS)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  useEffect(() => {
    if (token) enableBackgroundNotifications();
  }, [token]);

  useEffect(() => {
    // Captura o evento nativo de instalação do Android / Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('Evento beforeinstallprompt capturado no PontoFlow.');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      console.log('PontoFlow instalado com sucesso no dispositivo.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setCurrentToken(null);
      setCurrentUser(null);
      setActiveTab('dia');
      setSubView(null);
    };

    window.addEventListener('pontoflow_logout', handleLogout);
    return () => window.removeEventListener('pontoflow_logout', handleLogout);
  }, []);

  const handleAuthSuccess = (loggedUser, isNewUser) => {
    setCurrentToken(getToken());
    setCurrentUser(loggedUser);
    if (isNewUser) {
      setActiveTab('configuracoes');
      setSubView('config_trabalho');
    } else {
      setActiveTab('dia');
      setSubView(null);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setCurrentToken(null);
    setCurrentUser(null);
    setActiveTab('dia');
    setSubView(null);
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setSubView(null);
  };

  // Se não estiver autenticado, exibe a tela de login / auto-cadastro
  if (!token || !user) {
    return (
      <div className="app-container">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Renderizar o conteúdo principal conforme a navegação
  const renderContent = () => {
    // 1. Sub-visões de configurações ou relatórios
    if (subView === 'config_trabalho') {
      return <ShiftDaysPage user={user} onBack={() => setSubView(null)} />;
    }
    if (subView === 'config_notificacoes') {
      return <NotificationSettingsPage user={user} onBack={() => setSubView(null)} />;
    }
    if (subView === 'config_marcadores') {
      return <MarcadoresPage user={user} onBack={() => setSubView(null)} />;
    }
    if (subView === 'config_usuario') {
      return <UserProfilePage user={user} onBack={() => setSubView(null)} onLogout={handleLogout} />;
    }
    if (subView === 'guia_instrucoes') {
      return <GuiaPage user={user} onBack={() => setSubView(null)} />;
    }
    if (subView === 'relatorios') {
      return <ReportsPage user={user} onBack={() => setSubView(null)} />;
    }

    // 2. Abas principais da barra inferior (Menu, Dia, Configurações)
    switch (activeTab) {
      case 'menu':
        return (
          <MenuDrawerPage 
            user={user} 
            onNavigate={(dest) => {
              if (dest === 'relatorios') setSubView('relatorios');
              else if (dest === 'config_usuario') setSubView('config_usuario');
              else setSubView(dest);
            }} 
            onLogout={handleLogout}
            onOpenInstall={() => setInstallModalOpen(true)}
          />
        );
      case 'configuracoes':
        return (
          <ConfigMenuPage 
            user={user} 
            onNavigate={(dest) => {
              if (dest === 'dia') setActiveTab('dia');
              else if (dest === 'logout') handleLogout();
              else setSubView(dest);
            }}
            onOpenInstall={() => setInstallModalOpen(true)}
          />
        );
      case 'dia':
      default:
        return <DashboardPage user={user} />;
    }
  };

  return (
    <div className="app-container">
      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>

      {/* Barra de Navegação Inferior Ponto Fácil */}
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Modal de Instalação no Celular (Android / iOS) */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setDeferredPrompt(null)}
      />
    </div>
  );
}

export default App;
