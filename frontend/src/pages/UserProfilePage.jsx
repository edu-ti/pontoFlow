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
  AlertCircle 
} from 'lucide-react';
import { api, setStoredUser } from '../services/api';
import { playSuccessChime } from '../services/soundEffects';

export function UserProfilePage({ user, onBack, onLogout }) {
  const [nomeCompleto, setNomeCompleto] = useState(user?.nome_completo || '');
  const [nomeEmpresa, setNomeEmpresa] = useState(user?.nome_empresa || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

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
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Colaborador & Empresa</h1>
          <span className="pf-header-subtitle">Configurações de Conta</span>
        </div>
        <div className="pf-header-right"></div>
      </header>

      <div className="mobile-wrapper">
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid var(--emerald)',
            color: '#6ee7b7',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid var(--rose)',
            color: '#fca5a5',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="pf-list-group" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} style={{ color: 'var(--primary)' }} />
              <span>Nome do Colaborador</span>
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} style={{ color: '#38bdf8' }} />
              <span>Nome da Empresa</span>
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Login do Sistema (Imutável)</label>
            <input 
              type="text" 
              className="form-input" 
              value={user?.login || ''} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed' }} 
            />
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <KeyRound size={15} style={{ color: 'var(--amber)' }} />
              <span>Alterar Senha (Opcional)</span>
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Senha Atual</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Informe sua senha atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Digite a nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Salvar Alterações</span>
          </button>
        </form>

        {/* Botão Oficial de Sair do Sistema */}
        <div className="pf-list-group" style={{ marginTop: '8px' }}>
          <div 
            className="pf-list-item" 
            onClick={() => {
              if (confirm('Deseja realmente sair do sistema PontoFlow?')) {
                onLogout();
              }
            }}
          >
            <div className="pf-list-left">
              <div className="pf-badge-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--rose)' }}>
                <LogOut size={20} />
              </div>
              <div className="pf-list-text">
                <span className="pf-list-title" style={{ color: 'var(--rose)' }}>Sair do Sistema</span>
                <span className="pf-list-sub">Desconectar sua conta no aparelho</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
