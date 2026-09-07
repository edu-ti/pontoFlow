import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  Check, 
  X, 
  Download, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstalled }) {
  if (!isOpen) return null;

  // Detectar plataforma
  const checkIsIos = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const checkIsStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  };

  const isIosDevice = checkIsIos();
  const isStandalone = checkIsStandalone();

  // Aba ativa: 'ios' ou 'android'
  const [activeTab, setActiveTab] = useState(isIosDevice ? 'ios' : 'android');
  const [installing, setInstalling] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setSuccessMsg('Aplicativo instalado com sucesso!');
          if (onInstalled) onInstalled();
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error('Erro no prompt de instalação:', err);
      } finally {
        setInstalling(false);
      }
    } else {
      // Se não há prompt nativo disponível, mostra guia passo a passo
      setActiveTab('android');
    }
  };

  return (
    <div className="pf-sheet-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="pf-sheet-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="pf-sheet-handle"></div>

        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Smartphone size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 className="pf-sheet-title" style={{ fontSize: '17px', margin: 0 }}>
                Instalar PontoFlow
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Versão Web App (PWA) para celular
              </span>
            </div>
          </div>
          <button type="button" className="pf-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Mensagem se já estiver rodando em standalone */}
        {isStandalone ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--emerald)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={32} style={{ color: 'var(--emerald)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Aplicativo Já Instalado!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Você já está utilizando o PontoFlow em modo tela cheia na sua tela de início.
            </div>
          </div>
        ) : (
          <>
            {/* Card com Vantagens */}
            <div style={{
              background: 'var(--bg-card-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '14px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                <Sparkles size={14} style={{ color: 'var(--amber)' }} />
                <span>Por que instalar na tela de início?</span>
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Abre instantaneamente em tela cheia sem barra de endereços</li>
                <li>Recebe alertas sonoros e visuais de horário sem atraso</li>
                <li>Acesso com apenas 1 toque como qualquer app da Play Store ou App Store</li>
              </ul>
            </div>

            {/* Seletor de Plataforma (Android vs iOS) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTab === 'android' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: activeTab === 'android' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                  color: activeTab === 'android' ? '#fff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🤖 Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTab === 'ios' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: activeTab === 'ios' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                  color: activeTab === 'ios' ? '#fff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🍏 iPhone (iOS)</span>
              </button>
            </div>

            {/* Conteúdo da Aba Android */}
            {activeTab === 'android' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deferredPrompt ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Seu navegador suporta a instalação direta em 1 clique:
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleNativeInstall}
                      disabled={installing}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #2563eb, #10b981)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Download size={20} />
                      <span>{installing ? 'Instalando...' : 'Instalar Agora no Android'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Siga o passo a passo no Google Chrome ou Samsung Internet:
                    </div>

                    <div className="install-step-card">
                      <div className="install-step-badge">1</div>
                      <div className="install-step-text">
                        <strong>Toque nos 3 pontinhos (⋮)</strong> no canto superior direito do seu navegador.
                      </div>
                    </div>

                    <div className="install-step-card">
                      <div className="install-step-badge">2</div>
                      <div className="install-step-text">
                        Procure e toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </div>
                    </div>

                    <div className="install-step-card">
                      <div className="install-step-badge">3</div>
                      <div className="install-step-text">
                        Confirme clicando em <strong>"Instalar"</strong>. O ícone do PontoFlow será adicionado ao seu celular!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba iOS (iPhone / iPad) */}
            {activeTab === 'ios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  No iPhone, a Apple requer a instalação através do navegador <strong>Safari</strong>:
                </div>

                <div className="install-step-card">
                  <div className="install-step-badge">
                    <Share size={16} />
                  </div>
                  <div className="install-step-text">
                    No rodapé do Safari, toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta apontando para cima).
                  </div>
                </div>

                <div className="install-step-card">
                  <div className="install-step-badge">
                    <PlusSquare size={16} />
                  </div>
                  <div className="install-step-text">
                    Role as opções para cima e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </div>
                </div>

                <div className="install-step-card">
                  <div className="install-step-badge">3</div>
                  <div className="install-step-text">
                    No canto superior direito da tela, toque em <strong>"Adicionar"</strong>.
                  </div>
                </div>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  marginTop: '4px'
                }}>
                  💡 <strong>Dica:</strong> Após adicionar, abra o PontoFlow diretamente pelo ícone na tela inicial para ter a experiência completa em tela cheia!
                </div>
              </div>
            )}
          </>
        )}

        {/* Botão Fechar */}
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '14px' }}
        >
          Entendido / Fechar
        </button>
      </div>
    </div>
  );
}
