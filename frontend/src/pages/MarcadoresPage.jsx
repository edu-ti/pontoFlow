import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  Tag 
} from 'lucide-react';
import { api } from '../services/api';
import { playSuccessChime } from '../services/soundEffects';

const CORES_PALETA = [
  '#3b82f6', // azul
  '#10b981', // verde
  '#f59e0b', // laranja
  '#8b5cf6', // roxo
  '#ef4444', // vermelho
  '#06b6d4', // ciano
  '#ec4899', // rosa
  '#64748b'  // cinza
];

export function MarcadoresPage({ user, onBack }) {
  const companyName = user?.nome_empresa || 'Empresa';
  const [marcadores, setMarcadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal para Criar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMarcador, setEditingMarcador] = useState(null); // null = criar novo
  const [formNome, setFormNome] = useState('');
  const [formCor, setFormCor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchMarcadores = async () => {
    try {
      const res = await api.marcadores.list();
      setMarcadores(res.marcadores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcadores();
  }, []);

  const handleOpenCreate = () => {
    setEditingMarcador(null);
    setFormNome('');
    setFormCor('#3b82f6');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMarcador(m);
    setFormNome(m.nome);
    setFormCor(m.cor || '#3b82f6');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setErrorMsg('Informe o nome do marcador.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (editingMarcador) {
        // Atualizar
        const res = await api.marcadores.update(editingMarcador.id, {
          nome: formNome.trim(),
          cor: formCor
        });
        setMarcadores((prev) =>
          prev.map((item) => (item.id === editingMarcador.id ? res.marcador : item))
        );
      } else {
        // Criar
        const res = await api.marcadores.create({
          nome: formNome.trim(),
          cor: formCor
        });
        setMarcadores((prev) => [...prev, res.marcador]);
      }

      playSuccessChime();
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar marcador.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingMarcador) return;
    if (!confirm(`Deseja realmente excluir o marcador "${editingMarcador.nome}"?`)) return;

    setSaving(true);
    try {
      await api.marcadores.delete(editingMarcador.id);
      setMarcadores((prev) => prev.filter((item) => item.id !== editingMarcador.id));
      playSuccessChime();
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao excluir marcador.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header Estilo Ponto Fácil */}
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Marcadores</h1>
          <span className="pf-header-subtitle">{companyName}</span>
        </div>
        <div className="pf-header-right">
          {/* Botão + agora funcional para cadastrar novo marcador */}
          <button 
            className="pf-icon-btn" 
            onClick={handleOpenCreate}
            title="Novo Marcador"
            aria-label="Criar Marcador"
          >
            <Plus size={22} style={{ color: '#fff' }} />
          </button>
        </div>
      </header>

      <div className="mobile-wrapper">
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '4px' }}>
          Toque em qualquer marcador para <strong>editar ou excluir</strong>:
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} />
          </div>
        ) : (
          <div className="pf-list-group">
            {marcadores.map((m) => (
              <div 
                key={m.id} 
                className="pf-list-item"
                onClick={() => handleOpenEdit(m)}
              >
                <div className="pf-list-left">
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: m.cor || '#3b82f6',
                    boxShadow: `0 0 8px ${m.cor}66`
                  }}></div>
                  <span className="pf-list-title">{m.nome}</span>
                </div>
                <Edit3 size={16} className="pf-arrow-right" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição do Marcador */}
      {modalOpen && (
        <div className="pf-sheet-backdrop" onClick={() => setModalOpen(false)}>
          <div className="pf-sheet-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
            <div className="pf-sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="pf-sheet-title">
                {editingMarcador ? 'Editar Marcador' : 'Novo Marcador'}
              </h2>
              <button className="pf-icon-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--rose)', color: '#fca5a5', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Marcador</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Trabalho presencial, Home Office..."
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Selecione uma Cor</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '6px 0' }}>
                  {CORES_PALETA.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormCor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: formCor === c ? '3px solid #fff' : '2px solid transparent',
                        transform: formCor === c ? 'scale(1.15)' : 'scale(1)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {editingMarcador && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ color: 'var(--rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    <Trash2 size={16} />
                    <span>Excluir</span>
                  </button>
                )}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{editingMarcador ? 'Salvar Alterações' : 'Criar Marcador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
