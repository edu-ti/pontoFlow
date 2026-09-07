import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  Moon, 
  Check, 
  Copy, 
  Plus, 
  Loader2, 
  Save 
} from 'lucide-react';
import { api, getStoredUser, setStoredUser } from '../services/api';
import { playSuccessChime } from '../services/soundEffects';

export function ShiftDaysPage({ user, onBack }) {
  const companyName = user?.nome_empresa || 'Empresa';
  const [selectedDay, setSelectedDay] = useState(null); // null = lista de dias; string = dia selecionado
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Estados de horários
  const [entradaSegQui, setEntradaSegQui] = useState('08:00');
  const [saidaSegQui, setSaidaSegQui] = useState('18:00');
  const [saidaSexta, setSaidaSexta] = useState('17:00');
  const [intervaloMinutos, setIntervaloMinutos] = useState(60);

  // Modal para configurar dia
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [editEntrada, setEditEntrada] = useState('08:00');
  const [editSaida, setEditSaida] = useState('18:00');
  const [editIntervalo, setEditIntervalo] = useState(60);
  const [editTrabalha, setEditTrabalha] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.auth.getMe();
        if (res?.user) {
          if (res.user.entrada_seg_qui) setEntradaSegQui(res.user.entrada_seg_qui.slice(0, 5));
          if (res.user.saida_seg_qui) setSaidaSegQui(res.user.saida_seg_qui.slice(0, 5));
          if (res.user.saida_sexta) setSaidaSexta(res.user.saida_sexta.slice(0, 5));
          if (res.user.tempo_intervalo_minutos) setIntervaloMinutos(res.user.tempo_intervalo_minutos);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const daysList = [
    { id: 'domingo', nome: 'Domingo', trabalha: false, label: 'Você não trabalha neste dia!' },
    { id: 'segunda', nome: 'Segunda-feira', trabalha: true, label: `${entradaSegQui} às ${saidaSegQui} (${intervaloMinutos}m almoço)` },
    { id: 'terca', nome: 'Terça-feira', trabalha: true, label: `${entradaSegQui} às ${saidaSegQui} (${intervaloMinutos}m almoço)` },
    { id: 'quarta', nome: 'Quarta-feira', trabalha: true, label: `${entradaSegQui} às ${saidaSegQui} (${intervaloMinutos}m almoço)` },
    { id: 'quinta', nome: 'Quinta-feira', trabalha: true, label: `${entradaSegQui} às ${saidaSegQui} (${intervaloMinutos}m almoço)` },
    { id: 'sexta', nome: 'Sexta-feira', trabalha: true, label: `${entradaSegQui} às ${saidaSexta} (${intervaloMinutos}m almoço)` },
    { id: 'sabado', nome: 'Sábado', trabalha: false, label: 'Você não trabalha neste dia!' }
  ];

  const handleOpenDay = (day) => {
    setSelectedDay(day);
    setIsEditingDay(false);
    setEditTrabalha(day.trabalha);
    setEditEntrada(entradaSegQui);
    setEditSaida(day.id === 'sexta' ? saidaSexta : saidaSegQui);
    setEditIntervalo(intervaloMinutos);
  };

  const handleSaveDay = async () => {
    setLoading(true);
    try {
      let newEntrada = entradaSegQui;
      let newSaidaSegQui = saidaSegQui;
      let newSaidaSexta = saidaSexta;
      let newIntervalo = editIntervalo;

      if (selectedDay.id === 'sexta') {
        newSaidaSexta = editSaida;
      } else if (['segunda', 'terca', 'quarta', 'quinta'].includes(selectedDay.id)) {
        newEntrada = editEntrada;
        newSaidaSegQui = editSaida;
      }

      await api.auth.updateSchedule({
        entrada_seg_qui: `${newEntrada}:00`,
        saida_seg_qui: `${newSaidaSegQui}:00`,
        saida_sexta: `${newSaidaSexta}:00`,
        tempo_intervalo_minutos: parseInt(newIntervalo, 10)
      });

      setEntradaSegQui(newEntrada);
      setSaidaSegQui(newSaidaSegQui);
      setSaidaSexta(newSaidaSexta);
      setIntervaloMinutos(newIntervalo);

      playSuccessChime();
      setSaveMessage('Horário salvo com sucesso!');
      setTimeout(() => {
        setSaveMessage(null);
        setSelectedDay(null);
      }, 1000);
    } catch (err) {
      alert(err.message || 'Erro ao salvar horário');
    } finally {
      setLoading(false);
    }
  };

  const handleReplicate = async () => {
    setLoading(true);
    try {
      await api.auth.updateSchedule({
        entrada_seg_qui: `${editEntrada}:00`,
        saida_seg_qui: `${editSaida}:00`,
        saida_sexta: `${editSaida}:00`,
        tempo_intervalo_minutos: parseInt(editIntervalo, 10)
      });

      setEntradaSegQui(editEntrada);
      setSaidaSegQui(editSaida);
      setSaidaSexta(editSaida);
      setIntervaloMinutos(editIntervalo);

      playSuccessChime();
      setSaveMessage('Horário replicado para Segunda a Sexta com sucesso!');
      setTimeout(() => {
        setSaveMessage(null);
        setSelectedDay(null);
      }, 1200);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TELA 3: CONFIGURANDO UM DIA ESPECÍFICO (Ex: Segunda-feira)
  // -------------------------------------------------------------
  if (selectedDay) {
    return (
      <div>
        <header className="pf-header">
          <div className="pf-header-left">
            <button className="pf-icon-btn" onClick={() => setSelectedDay(null)}>
              <ArrowLeft size={20} />
            </button>
          </div>
          <div className="pf-header-center">
            <h1 className="pf-header-title">{selectedDay.nome}</h1>
            <span className="pf-header-subtitle">{companyName}</span>
          </div>
          <div className="pf-header-right"></div>
        </header>

        <div className="mobile-wrapper">
          {saveMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid var(--emerald)',
              padding: '10px',
              borderRadius: '8px',
              color: '#6ee7b7',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {saveMessage}
            </div>
          )}

          {/* Botão: Replicar para outros dias da semana (Captura 3) */}
          <button type="button" className="pf-btn-pill" onClick={handleReplicate} disabled={loading}>
            <Copy size={16} />
            <span>Replicar para outros dias da semana</span>
          </button>

          {!isEditingDay ? (
            <>
              <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {selectedDay.trabalha ? `Jornada configurada: ${selectedDay.label}` : 'Você não trabalha neste dia! Como deseja configurar?'}
              </div>

              {/* Opção 1: Horários de trabalho */}
              <div className="pf-option-card" onClick={() => setIsEditingDay(true)}>
                <div className="pf-option-header">
                  <div className="pf-option-title">
                    <Clock size={20} style={{ color: '#38bdf8' }} />
                    <span>Horários de trabalho</span>
                  </div>
                  <ChevronRight size={18} className="pf-arrow-right" />
                </div>
                <p className="pf-option-desc">
                  Defina um ou mais turnos com os horários de entrada e saída. No dia a dia, você pode registrar os pontos a qualquer hora, esses horários servem como referência para os alertas de pontualidade.
                </p>
              </div>

              {/* Opção 2: Apenas carga horária */}
              <div className="pf-option-card" onClick={() => setIsEditingDay(true)}>
                <div className="pf-option-header">
                  <div className="pf-option-title">
                    <Moon size={20} style={{ color: '#818cf8' }} />
                    <span>Apenas carga horária</span>
                  </div>
                  <ChevronRight size={18} className="pf-arrow-right" />
                </div>
                <p className="pf-option-desc">
                  Defina apenas a quantidade de horas trabalhadas por dia, sem especificar horários de entrada e saída.
                </p>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  marginTop: '4px'
                }}>
                  🔔 O app utilizará a carga horária para avisar quando completar o expediente.
                </div>
              </div>
            </>
          ) : (
            /* Formulário de Edição do Dia */
            <div className="pf-list-group" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                Horários de {selectedDay.nome}
              </h3>

              <div className="form-group">
                <label className="form-label">Entrada Expediente</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={editEntrada}
                  onChange={(e) => setEditEntrada(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Saída Expediente</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={editSaida}
                  onChange={(e) => setEditSaida(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tempo de Almoço (minutos)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="15" 
                  max="180"
                  value={editIntervalo}
                  onChange={(e) => setEditIntervalo(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setIsEditingDay(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ flex: 2 }}
                  onClick={handleSaveDay}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Salvar {selectedDay.nome}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA 2: LISTA DE DIAS DA SEMANA (Captura 2)
  // -------------------------------------------------------------
  return (
    <div>
      <header className="pf-header">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Configurações de trabalho...</h1>
          <span className="pf-header-subtitle">{companyName}</span>
        </div>
        <div className="pf-header-right">
          <button className="pf-icon-btn" onClick={() => handleOpenDay(daysList[1])}>
            <Plus size={20} />
          </button>
        </div>
      </header>

      <div className="mobile-wrapper">
        {/* Lista de Domingo a Sábado */}
        <div className="pf-list-group">
          {daysList.map((day) => (
            <div 
              key={day.id} 
              className="pf-list-item"
              onClick={() => handleOpenDay(day)}
            >
              <div className="pf-list-text">
                <span className="pf-list-title">{day.nome}</span>
                <span className="pf-list-sub" style={{ color: day.trabalha ? '#38bdf8' : 'var(--text-dim)' }}>
                  {day.label}
                </span>
              </div>
              <ChevronRight size={18} className="pf-arrow-right" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
