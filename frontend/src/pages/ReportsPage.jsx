import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Loader2, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function ReportsPage({ user }) {
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

  // Navegação de Mês
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

  // Exportar para CSV formatado para conferência com Knup
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

    let csvContent = '\uFEFF'; // BOM UTF-8 para Excel
    csvContent += `Relatório de Espelho de Ponto - PontoFlow\n`;
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
    link.setAttribute('download', `PontoFlow_Espelho_${targetAno}_${String(targetMes).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mobile-wrapper wide-layout">
      {/* Header do Relatório */}
      <div className="card">
        <div className="report-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              <span>Conferência de Espelho (Relógio Knup)</span>
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Compare os 4 horários da plataforma com o relatório físico extraído via pen drive
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn-secondary" 
              onClick={handleExportCSV}
              style={{ fontSize: '12px', padding: '8px 12px' }}
              disabled={loading || !reportData}
            >
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>

            <button 
              className="btn-secondary" 
              onClick={() => window.print()}
              style={{ fontSize: '12px', padding: '8px 12px' }}
              disabled={loading || !reportData}
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Filtros de Período */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
          <div className="auth-tabs" style={{ width: 'auto', minWidth: '220px' }}>
            {['mensal', 'semanal', 'diario'].map((t) => (
              <button
                key={t}
                className={`auth-tab ${periodoTipo === t ? 'active' : ''}`}
                onClick={() => setPeriodoTipo(t)}
                style={{ textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>

          {periodoTipo === 'mensal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '130px', textAlign: 'center' }}>
                {MESES[targetMes - 1]} / {targetAno}
              </span>
              <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={handleNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Cards de Resumo Métrico */}
        {reportData?.resumo && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginTop: '8px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Dias Trabalhados</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {reportData.resumo.dias_trabalhados} dias
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Trabalhado</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--emerald)', marginTop: '2px' }}>
                {reportData.resumo.total_horas_trabalhadas}h
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Saldo Geral</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 800, 
                color: reportData.resumo.saldo_positivo ? 'var(--emerald)' : 'var(--amber)',
                marginTop: '2px' 
              }}>
                {reportData.resumo.saldo_total}h
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Média Diária</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                {reportData.resumo.media_horas_diaria}h
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Conferência Knup */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
            <span>Carregando espelho de conferência...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#fca5a5' }}>
            {error}
          </div>
        ) : (
          <div className="report-table-wrapper">
            <table className="knup-table">
              <thead>
                <tr>
                  <th>Data / Dia</th>
                  <th>1. Entrada</th>
                  <th>2. Saída Almoço</th>
                  <th>3. Volta Almoço</th>
                  <th>4. Fim Expediente</th>
                  <th>Horas Líquidas</th>
                  <th>Saldo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.linhas?.map((linha) => {
                  const isWeekend = linha.eh_fim_semana;
                  return (
                    <tr key={linha.data} className={isWeekend ? 'weekend' : ''}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>
                        <span>{linha.dia_mes}/{String(targetMes).padStart(2, '0')}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '6px' }}>
                          ({linha.dia_semana_abrev})
                        </span>
                      </td>
                      <td style={{ color: linha.batida_1_entrada !== '-' ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {linha.batida_1_entrada}
                      </td>
                      <td style={{ color: linha.batida_2_saida_almoco !== '-' ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {linha.batida_2_saida_almoco}
                      </td>
                      <td style={{ color: linha.batida_3_volta_almoco !== '-' ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {linha.batida_3_volta_almoco}
                      </td>
                      <td style={{ color: linha.batida_4_saida_fim !== '-' ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {linha.batida_4_saida_fim}
                      </td>
                      <td style={{ fontWeight: 700, color: linha.minutos_trabalhados > 0 ? 'var(--emerald)' : 'var(--text-dim)' }}>
                        {linha.horas_trabalhadas}
                      </td>
                      <td style={{ 
                        fontWeight: 600, 
                        color: linha.saldo_minutos >= 0 ? 'var(--emerald)' : 'var(--amber)' 
                      }}>
                        {linha.saldo_formatado}
                      </td>
                      <td>
                        <span className={`badge-status-table ${linha.status.toLowerCase()}`}>
                          {linha.status === 'COMPLETO' ? 'Completo' :
                           linha.status === 'INCOMPLETO' ? 'Incompleto' :
                           linha.status === 'FALTA' ? 'Falta' :
                           linha.status === 'FIM_SEMANA_TRABALHADO' ? 'Fim de Semana (Extra)' :
                           linha.status === 'FIM_SEMANA' ? 'Folga' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
