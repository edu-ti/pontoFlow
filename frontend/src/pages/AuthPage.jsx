import React, { useState } from 'react';
import { api, setToken, setStoredUser } from '../services/api';
import { Clock, UserPlus, LogIn, Building2, User, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { playSuccessChime } from '../services/soundEffects';

export function AuthPage({ onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [loginField, setLoginField] = useState('');
  const [senhaField, setSenhaField] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginField || !senhaField) {
      setError('Preencha login e senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.login(loginField, senhaField);
      setToken(data.token);
      setStoredUser(data.user);
      playSuccessChime();
      onAuthSuccess(data.user, false);
    } catch (err) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nomeCompleto || !nomeEmpresa || !loginField || !senhaField) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.register({
        nome_completo: nomeCompleto,
        nome_empresa: nomeEmpresa,
        login: loginField,
        senha: senhaField
      });

      setToken(data.token);
      setStoredUser(data.user);
      playSuccessChime();
      // Redireciona para configurar turno
      onAuthSuccess(data.user, true);
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '24px 16px',
      background: 'radial-gradient(circle at 50% 10%, #1e293b 0%, #0f172a 100%)'
    }}>
      {/* Logotipo e Apresentação */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #2563eb, #0284c7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          margin: '0 auto 12px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)'
        }}>
          <Clock size={34} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          PontoFlow
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Assistente Ativo de Jornada e Pontualidade
        </p>
      </div>

      {/* Card Moderno de Autenticação */}
      <div className="auth-card">
        {/* Toggle Entrar / Auto-Cadastro */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); }}
          >
            <LogIn size={16} />
            <span>Entrar</span>
          </button>
          <button 
            type="button"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); }}
          >
            <UserPlus size={16} />
            <span>Auto-Cadastro</span>
          </button>
        </div>

        {/* Mensagem de Erro com Destaque */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fca5a5',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} />
                <span>Login do Colaborador</span>
              </label>
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Digite seu usuário ou login" 
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  autoCapitalize="none"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <KeyRound size={14} />
                <span>Senha de Acesso</span>
              </label>
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <KeyRound size={18} />
                </div>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Digite sua senha" 
                  value={senhaField}
                  onChange={(e) => setSenhaField(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', height: '48px', marginTop: '6px', fontSize: '14px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              <span>{loading ? 'Acessando...' : 'Entrar no PontoFlow'}</span>
            </button>
          </form>
        ) : (
          /* FORMULÁRIO DE AUTO-CADASTRO */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} />
                <span>Nome Completo</span>
              </label>
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: João da Silva" 
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Building2 size={14} />
                <span>Nome da Empresa</span>
              </label>
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <Building2 size={18} />
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: FR Produtos Medicos" 
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  required
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', paddingLeft: '4px' }}>
                Se a empresa ainda não existir, será criada automaticamente.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <UserPlus size={14} />
                <span>Login Desejado</span>
              </label>
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <UserPlus size={18} />
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: joao.silva" 
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  autoCapitalize="none"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <KeyRound size={14} />
                <span>Senha</span>
              </label>
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <KeyRound size={18} />
                </div>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Crie uma senha de acesso" 
                  value={senhaField}
                  onChange={(e) => setSenhaField(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', height: '48px', marginTop: '6px', fontSize: '14px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              <span>{loading ? 'Criando Conta...' : 'Cadastrar e Configurar Turno'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
