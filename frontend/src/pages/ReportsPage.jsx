import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft,
  FileText, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Calendar,
  CheckCircle,
  Tag
} from 'lucide-react';

const TAG_MAP = {
  feriado: { label: 'Feriado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  folga: { label: 'Folga', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)' },
  falta: { label: 'Falta', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  ferias: { label: 'Férias', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
  trabalho_externo: { label: 'Trab. Externo', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  ajuste_manual: { label: 'Ajuste Manual', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
  carga_diferente: { label: 'Carga Dif.', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' },
};

export function ReportsPage({ user, onBack }) {
  const hoje = new Date();
  const [periodoTipo, setPeriodoTipo] = useState('mensal'); // 'diario' | 'semanal' | 'mensal'
  const [targetAno, setTargetAno] = useState(hoje.getFullYear());
  const [targetMes, setTargetMes] = useState(hoje.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
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

  // ==========================================
  // EXPORTAÇÃO EM PDF PROFISSIONAL (ESPELHO KNUP)
  // ==========================================
  const handleExportPDF = () => {
    if (!reportData?.linhas) return;

    setGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const colabNome = reportData.colaborador?.nome_completo || user?.nome_completo || 'Colaborador';
      const empNome = reportData.colaborador?.empresa || user?.nome_empresa || 'Empresa';
      const periodoStr = `${MESES[targetMes - 1]} de ${targetAno}`;
      const dataEmissao = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      // Barra superior decorativa
      doc.setFillColor(37, 99, 235); // Azul Royal #2563eb
      doc.rect(0, 0, 210, 8, 'F');

      // Título Principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 41, 59);
      doc.text('ESPELHO DE PONTO ELETRÔNICO', 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Conferência com Relógio de Ponto Físico (Knup) • Gerado pelo PontoFlow', 14, 23);

      // Card de Informações da Empresa e Colaborador
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 26, 182, 22, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Empresa:', 18, 33);
      doc.setFont('helvetica', 'normal');
      doc.text(empNome, 36, 33);

      doc.setFont('helvetica', 'bold');
      doc.text('Colaborador:', 18, 39);
      doc.setFont('helvetica', 'normal');
      doc.text(colabNome, 41, 39);

      doc.setFont('helvetica', 'bold');
      doc.text('Período:', 18, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(periodoStr, 34, 45);

      doc.setFont('helvetica', 'bold');
      doc.text('Emissão:', 124, 33);
      doc.setFont('helvetica', 'normal');
      doc.text(dataEmissao, 140, 33);

      doc.setFont('helvetica', 'bold');
      doc.text('Login/ID:', 124, 39);
      doc.setFont('helvetica', 'normal');
      doc.text(reportData.colaborador?.login || '-', 140, 39);

      // Resumo de Horas (KPIs)
      const res = reportData.resumo || {};
      const trab = res.total_horas_trabalhadas || '00:00';
      const prev = res.total_horas_previstas || '00:00';
      const saldo = res.saldo_total || '00:00';
      const diasTrab = res.dias_trabalhados || 0;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 51, 182, 12, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);

      doc.text('Trabalhado: ', 18, 58.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`${trab}h`, 38, 58.5);

      doc.setTextColor(71, 85, 105);
      doc.text('Previsto: ', 64, 58.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${prev}h`, 79, 58.5);

      doc.setTextColor(71, 85, 105);
      doc.text('Saldo Geral: ', 105, 58.5);
      if (res.saldo_positivo) {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(`${saldo}h`, 126, 58.5);

      doc.setTextColor(71, 85, 105);
      doc.text('Dias Trabalhados: ', 150, 58.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${diasTrab}d`, 177, 58.5);

      // Tabela de Batidas Diárias
      const tableHeaders = [
        ['Data', 'Dia', '1. Entrada', '2. Almoço', '3. Retorno', '4. Saída', 'Líquido', 'Saldo', 'Ocorrência']
      ];

      const tableRows = reportData.linhas.map((l) => {
        let tagStr = '';
        if (l.tag && TAG_MAP[l.tag]) {
          tagStr = TAG_MAP[l.tag].label;
        } else if (l.tag) {
          tagStr = l.tag;
        } else if (l.observacao) {
          tagStr = l.observacao;
        } else if (l.eh_fim_semana && l.minutos_trabalhados === 0) {
          tagStr = 'Fim de semana';
        }

        return [
          `${l.dia_mes}/${String(targetMes).padStart(2, '0')}`,
          l.dia_semana_abrev,
          l.batida_1_entrada || '-',
          l.batida_2_saida_almoco || '-',
          l.batida_3_volta_almoco || '-',
          l.batida_4_saida_fim || '-',
          l.horas_trabalhadas,
          l.saldo_formatado,
          tagStr
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 66,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 1.8
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          halign: 'center',
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 15, fontStyle: 'bold' },
          1: { cellWidth: 11 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 18, fontStyle: 'bold' },
          7: { cellWidth: 18, fontStyle: 'bold' },
          8: { cellWidth: 40, halign: 'left' }
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const linhaOriginal = reportData.linhas[data.row.index];
            if (linhaOriginal?.eh_fim_semana) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [148, 163, 184];
            }
            // Coluna de saldo (índice 7)
            if (data.column.index === 7) {
              if (linhaOriginal?.saldo_minutos > 0) {
                data.cell.styles.textColor = [16, 185, 129];
              } else if (linhaOriginal?.saldo_minutos < 0) {
                data.cell.styles.textColor = [239, 68, 68];
              }
            }
            // Coluna de ocorrência/tag (índice 8)
            if (data.column.index === 8 && linhaOriginal?.tag) {
              data.cell.styles.fontStyle = 'bold';
              if (['feriado', 'folga', 'ferias'].includes(linhaOriginal.tag)) {
                data.cell.styles.textColor = [16, 185, 129];
              } else if (linhaOriginal.tag === 'falta') {
                data.cell.styles.textColor = [239, 68, 68];
              } else {
                data.cell.styles.textColor = [59, 130, 246];
              }
            }
          }
        }
      });

      // Linhas de Assinaturas (ao final da tabela ou em nova página)
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 16 : 240;
      if (finalY > 262) {
        doc.addPage();
        finalY = 35;
      }

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);

      // Assinatura Colaborador
      doc.line(20, finalY, 92, finalY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(colabNome, 56, finalY + 4, { align: 'center' });
      doc.text('Assinatura do Colaborador', 56, finalY + 8, { align: 'center' });

      // Assinatura Empregador
      doc.line(118, finalY, 190, finalY);
      doc.text(empNome, 154, finalY + 4, { align: 'center' });
      doc.text('Assinatura do Responsável', 154, finalY + 8, { align: 'center' });

      // Rodapé em todas as páginas
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `PontoFlow • Espelho Knup • Documento gerado eletronicamente em ${dataEmissao}`,
          14,
          290
        );
        doc.text(
          `Página ${i} de ${totalPages}`,
          196,
          290,
          { align: 'right' }
        );
      }

      const safeColab = colabNome.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Espelho_Knup_${safeColab}_${targetAno}_${String(targetMes).padStart(2, '0')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar arquivo PDF. Tente novamente.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ==========================================
  // EXPORTAÇÃO CSV PARA EXCEL
  // ==========================================
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
      'Status',
      'Tag / Ocorrencia'
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
      l.status,
      l.tag ? (TAG_MAP[l.tag]?.label || l.tag) : (l.observacao || '')
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-page-container">
      <header className="pf-header no-print">
        <div className="pf-header-left">
          <button className="pf-icon-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="pf-header-center">
          <h1 className="pf-header-title">Espelho de Ponto Knup</h1>
          <span className="pf-header-subtitle">{user?.nome_empresa || 'PontoFlow'}</span>
        </div>
        <div className="pf-header-right" style={{ display: 'flex', gap: '4px' }}>
          {/* Botão Baixar PDF */}
          <button 
            className="pf-icon-btn" 
            onClick={handleExportPDF} 
            title="Exportar PDF Oficial"
            disabled={generatingPdf || loading}
            style={{ color: '#38bdf8' }}
          >
            {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={20} />}
          </button>

          {/* Botão Baixar CSV */}
          <button 
            className="pf-icon-btn" 
            onClick={handleExportCSV} 
            title="Exportar CSV (Excel)"
            disabled={loading}
          >
            <Download size={20} />
          </button>

          {/* Botão Imprimir */}
          <button 
            className="pf-icon-btn" 
            onClick={handlePrint} 
            title="Imprimir"
            disabled={loading}
          >
            <Printer size={20} />
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
          <button className="pf-icon-btn no-print" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', display: 'block' }}>
              {MESES[targetMes - 1]} de {targetAno}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {reportData?.colaborador?.nome_completo || user?.nome_completo}
            </span>
          </div>
          <button className="pf-icon-btn no-print" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Barra de Ações Rápidas de Exportação (Mobile-friendly) */}
        <div className="no-print" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '8px'
        }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportPDF}
            disabled={generatingPdf || loading}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none'
            }}
          >
            {generatingPdf ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            <span style={{ fontWeight: 700 }}>Exportar PDF</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={loading}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Download size={18} />
            <span style={{ fontWeight: 600 }}>Planilha CSV</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrint}
            disabled={loading}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Printer size={18} />
            <span style={{ fontWeight: 600 }}>Imprimir</span>
          </button>
        </div>

        {/* Resumo de Horas */}
        {reportData?.resumo && (
          <div className="day-metrics-grid" style={{ 
            background: 'var(--bg-card)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px', 
            border: '1px solid var(--border-subtle)',
            marginTop: '8px'
          }}>
            <div className="metric-column">
              <span className="metric-label">Trabalhado</span>
              <span className="metric-value" style={{ color: 'var(--emerald)' }}>{reportData.resumo.total_horas_trabalhadas}h</span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Previsto</span>
              <span className="metric-value">{reportData.resumo.total_horas_previstas}h</span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Saldo do Mês</span>
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

        {/* Tabela de Conferência Knup */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '8px' }}>
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
                    <th>Ocorrência / Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.linhas?.map((linha) => {
                    const tagInfo = linha.tag ? TAG_MAP[linha.tag] : null;

                    return (
                      <tr key={linha.data} className={linha.eh_fim_semana ? 'weekend' : ''}>
                        <td style={{ textAlign: 'left', fontWeight: 600 }}>
                          {linha.dia_mes}/{String(targetMes).padStart(2, '0')}{' '}
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                            {linha.dia_semana_abrev}
                          </span>
                        </td>
                        <td>{linha.batida_1_entrada}</td>
                        <td>{linha.batida_2_saida_almoco}</td>
                        <td>{linha.batida_3_volta_almoco}</td>
                        <td>{linha.batida_4_saida_fim}</td>
                        <td style={{ fontWeight: 700, color: linha.minutos_trabalhados > 0 ? 'var(--emerald)' : 'var(--text-dim)' }}>
                          {linha.horas_trabalhadas}
                        </td>
                        <td style={{ 
                          fontWeight: 700,
                          color: linha.saldo_minutos > 0 ? 'var(--emerald)' : linha.saldo_minutos < 0 ? 'var(--rose)' : 'var(--text-dim)' 
                        }}>
                          {linha.saldo_formatado}
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          {tagInfo ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: tagInfo.color,
                              background: tagInfo.bg,
                              border: `1px solid ${tagInfo.color}33`
                            }}>
                              {tagInfo.label}
                            </span>
                          ) : linha.tag ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{linha.tag}</span>
                          ) : linha.observacao ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                              {linha.observacao}
                            </span>
                          ) : linha.eh_fim_semana ? (
                            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Fim de semana</span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>-</span>
                          )}
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
    </div>
  );
}
