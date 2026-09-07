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
    <div className="mobile-wrapper" style={{ justifyContent: 'center', minHeight: '90vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--primary), #818cf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          margin: '0 auto 12px',
          boxShadow: '0 8px 24px var(--primary-glow)'
        }}>
          <Clock size={32} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>PontoFlow</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Assistente Ativo de Jornada e Pontualidade
        </p>
      </div>

      <div className="card">
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); }}
          >
            Entrar
          </button>
          <button 
            type="button"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); }}
          >
            Auto-Cadastro
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Login do Colaborador</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Seu usuário ou login" 
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  autoCapitalize="none"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Sua senha de acesso" 
                value={senhaField}
                onChange={(e) => setSenhaField(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              <span>{loading ? 'Entrando...' : 'Entrar no PontoFlow'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: João da Silva" 
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nome da Empresa</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Minha Empresa Ltda" 
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Se a empresa não existir, será criada automaticamente.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Login Desejado</label>
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

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Crie uma senha segura" 
                value={senhaField}
                onChange={(e) => setSenhaField(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              <span>{loading ? 'Cadastrando...' : 'Criar Cadastro e Configurar Turno'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
