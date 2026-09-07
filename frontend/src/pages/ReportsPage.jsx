import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ArrowLeft,
  FileText, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';

export function ReportsPage({ user, onBack }) {
  const hoje = new Date();
  const [periodoTipo, setPeriodoTipo] = useState('mensal'); // 'diario' | 'semanal' | 'mensal'
  const [targetAno, setTargetAno] = useState(hoje.getFullYear());
  const [targetMes, setTargetMes] = useState(hoje.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.relatorios.get({
        tipo: periodoTipo,
        ano: targetAno,
        mes: targetMes
      });
      setReportData(res);
    } catch (err) {
      console.error('Erro ao buscar relatório:', err);
      setError('Erro ao carregar os dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [periodoTipo, targetAno, targetMes]);

  const handlePrevMonth = () => {
    if (targetMes === 1) {
      setTargetMes(12);
      setTargetAno((prev) => prev - 1);
    } else {
      setTargetMes((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (targetMes === 12) {
      setTargetMes(1);
      setTargetAno((prev) => prev + 1);
    } else {
      setTargetMes((prev) => prev + 1);
    }
  };

  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleExportCSV = () => {
    if (!reportData?.linhas) return;

    const headers = [
      'Data',
      'Dia Semana',
      'Batida 1 (Entrada)',
      'Batida 2 (Saida Almoco)',
      'Batida 3 (Volta Almoco)',
      'Batida 4 (Saida Fim)',
      'Horas Trabalhadas',
      'Horas Previstas',
      'Saldo',
      'Status'
    ];

    const rows = reportData.linhas.map((l) => [
      l.data,
      l.dia_semana,
      l.batida_1_entrada,
      l.batida_2_saida_almoco,
      l.batida_3_volta_almoco,
      l.batida_4_saida_fim,
      l.horas_trabalhadas,
      l.horas_previstas,
      l.saldo_formatado,
      l.status
    ]);

    let csvContent = '\uFEFF';
    csvContent += `Espelho de Ponto - PontoFlow / Knup\n`;
    csvContent += `Colaborador: ${reportData.colaborador?.nome_completo} | Empresa: ${reportData.colaborador?.empresa}\n`;
    csvContent += `Período: ${MESES[targetMes - 1]} de ${targetAno}\n\n`;
    csvContent += headers.join(';') + '\n';

    rows.forEach((r) => {
      csvContent += r.join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Espelho_Knup_${targetAno}_${String(targetMes).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1 className="pf-header-title">Espelho de Ponto Knup</h1>
          <span className="pf-header-subtitle">{user?.nome_empresa || 'PontoFlow'}</span>
        </div>
        <div className="pf-header-right">
          <button className="pf-icon-btn" onClick={handleExportCSV} title="Exportar CSV">
            <Download size={20} />
          </button>
        </div>
      </header>

      <div className="mobile-wrapper wide-layout">
        {/* Seletor de Mês */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button className="pf-icon-btn" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
            {MESES[targetMes - 1]} / {targetAno}
          </span>
          <button className="pf-icon-btn" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Resumo */}
        {reportData?.resumo && (
          <div className="day-metrics-grid" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border-subtle)' }}>
            <div className="metric-column">
              <span className="metric-label">Trabalhado</span>
              <span className="metric-value" style={{ color: 'var(--emerald)' }}>{reportData.resumo.total_horas_trabalhadas}h</span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Saldo Geral</span>
              <span className={`metric-value ${reportData.resumo.saldo_positivo ? 'positive' : 'negative'}`}>
                {reportData.resumo.saldo_total}h
              </span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Dias</span>
              <span className="metric-value">{reportData.resumo.dias_trabalhados}d</span>
            </div>
          </div>
        )}

        {/* Tabela de Conferência */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 6px', color: 'var(--primary)' }} />
              <span>Carregando dados do espelho...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#fca5a5' }}>
              {error}
            </div>
          ) : (
            <div className="report-table-wrapper">
              <table className="knup-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>1. Entrada</th>
                    <th>2. Almoço</th>
                    <th>3. Retorno</th>
                    <th>4. Saída</th>
                    <th>Líquido</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.linhas?.map((linha) => (
                    <tr key={linha.data} className={linha.eh_fim_semana ? 'weekend' : ''}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>
                        {linha.dia_mes}/{String(targetMes).padStart(2, '0')} <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{linha.dia_semana_abrev}</span>
                      </td>
                      <td>{linha.batida_1_entrada}</td>
                      <td>{linha.batida_2_saida_almoco}</td>
                      <td>{linha.batida_3_volta_almoco}</td>
                      <td>{linha.batida_4_saida_fim}</td>
                      <td style={{ fontWeight: 700, color: linha.minutos_trabalhados > 0 ? 'var(--emerald)' : 'var(--text-dim)' }}>
                        {linha.horas_trabalhadas}
                      </td>
                      <td style={{ color: linha.saldo_minutos >= 0 ? 'var(--emerald)' : 'var(--amber)' }}>
                        {linha.saldo_formatado}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
