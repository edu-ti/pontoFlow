import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  KeyRound, 
  LogOut, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle,
  Shield,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { api, setStoredUser } from '../services/api';
import { playSuccessChime } from '../services/soundEffects';

export function UserProfilePage({ user, onBack, onLogout }) {
  const [nomeCompleto, setNomeCompleto] = useState(user?.nome_completo || '');
  const [nomeEmpresa, setNomeEmpresa] = useState(user?.nome_empresa || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.auth.updateProfile({
        nome_completo: nomeCompleto,
        nome_empresa: nomeEmpresa,
        senha_atual: senhaAtual || undefined,
        nova_senha: novaSenha || undefined
      });

      if (res?.user) {
        setStoredUser(res.user);
      }

      playSuccessChime();
      setSuccessMsg(res.message || 'Dados atualizados com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack} title="Voltar">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Colaborador & Empresa</h1>
          <span className="pf-header-subtitle">Configurações de Conta</span>
        </div>
        <div className="pf-header-right"></div>
      </header>

      <div className="mobile-wrapper" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <Check size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          {/* Nome do Colaborador */}
          <div className="form-group">
            <label className="form-label">
              <User size={15} style={{ color: '#3b82f6' }} />
              <span>Nome do Colaborador</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <User size={18} />
              </span>
              <input 
                type="text" 
                className="form-input" 
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Ex: Seu Nome Completo"
                required
              />
            </div>
          </div>

          {/* Nome da Empresa */}
          <div className="form-group">
            <label className="form-label">
              <Building2 size={15} style={{ color: '#38bdf8' }} />
              <span>Nome da Empresa</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <Building2 size={18} />
              </span>
              <input 
                type="text" 
                className="form-input" 
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Nome da sua Empresa"
                required
              />
            </div>
          </div>

          {/* Login do Sistema (Imutável) */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <label className="form-label">
                <Shield size={15} style={{ color: '#94a3b8' }} />
                <span>Login do Sistema</span>
              </label>
              <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '6px' }}>
                Somente Leitura
              </span>
            </div>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <Lock size={18} style={{ color: '#64748b' }} />
              </span>
              <input 
                type="text" 
                className="form-input" 
                value={user?.login || ''} 
                disabled 
              />
            </div>
          </div>

          {/* Seção Alterar Senha */}
          <div style={{
            marginTop: '4px',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} style={{ color: 'var(--amber)' }} />
                <span>Alterar Senha</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Opcional</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Senha Atual</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon-left">
                  <KeyRound size={18} />
                </span>
                <input 
                  type={showSenhaAtual ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder="Informe sua senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  tabIndex={-1}
                >
                  {showSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Nova Senha</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon-left">
                  <KeyRound size={18} />
                </span>
                <input 
                  type={showNovaSenha ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder="Digite a nova senha desejada"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  tabIndex={-1}
                >
                  {showNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '4px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Salvar Alterações</span>
          </button>
        </form>

        {/* Botão Oficial de Sair do Sistema */}
        <div 
          className="card" 
          style={{ 
            marginTop: '4px', 
            padding: '16px',
            border: '1px solid rgba(239, 68, 68, 0.25)', 
            background: 'rgba(239, 68, 68, 0.04)',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            if (confirm('Deseja realmente sair do sistema PontoFlow?')) {
              onLogout();
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <LogOut size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px' }}>Sair do Sistema</span>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Desconectar sua conta neste aparelho</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
