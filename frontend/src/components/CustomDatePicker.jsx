import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  Clock
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDateComponents(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return {
      year: Number(parts[0]),
      month: Number(parts[1]),
      day: Number(parts[2])
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  };
}

function formatYMD(year, month, day) {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function CustomDatePicker({ 
  value, 
  onChange, 
  onClose,
  label, 
  placeholder = 'Selecione uma data',
  modalTitle = 'Selecione a Data',
  inline = false
}) {
  const [isOpen, setIsOpen] = useState(inline);
  
  // Data atual da máquina / local
  const today = new Date();
  const todayYMD = formatYMD(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Mês e Ano em visualização no calendário
  const selectedParsed = parseDateComponents(value || todayYMD);
  const [viewYear, setViewYear] = useState(selectedParsed.year);
  const [viewMonth, setViewMonth] = useState(selectedParsed.month);

  const containerRef = useRef(null);

  // Sincroniza visualização com a data selecionada ao abrir
  useEffect(() => {
    if (isOpen) {
      const parsed = parseDateComponents(value || todayYMD);
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [isOpen, value]);

  // Fecha o popup ao clicar fora ou apertar Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navegação de mês
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Cálculo da grade do calendário (células de 1 a 31 + preenchimentos)
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1, 12, 0, 0).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  const daysGrid = [];

  // Dias do mês anterior para completar o início da semana
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
    daysGrid.push({
      day: d,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      ymd: formatYMD(prevYear, prevMonth, d)
    });
  }

  // Dias do mês corrente
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    daysGrid.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      ymd: formatYMD(viewYear, viewMonth, d)
    });
  }

  // Dias do próximo mês para completar a grade em múltiplo de 7
  const remainingCells = (7 - (daysGrid.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    daysGrid.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      ymd: formatYMD(nextYear, nextMonth, d)
    });
  }

  // Selecionar dia
  const handleSelectDay = (ymd) => {
    if (onChange) {
      onChange(ymd);
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Botões de atalho rápido
  const handleSelectToday = (e) => {
    e.stopPropagation();
    handleSelectDay(todayYMD);
  };

  const handleSelectYesterday = (e) => {
    e.stopPropagation();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestYMD = formatYMD(yest.getFullYear(), yest.getMonth() + 1, yest.getDate());
    handleSelectDay(yestYMD);
  };

  // Texto formatado para exibição amigável: "07/09/2026 (Segunda-feira)"
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return placeholder;
    const { year, month, day } = parseDateComponents(dateStr);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    const dayNames = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    const dayName = dayNames[dateObj.getDay()];
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    return `${dStr}/${mStr}/${year} (${dayName})`;
  };

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      {/* Botão de Disparo Estilizado (oculto quando inline) */}
      {!inline && (
        <button
          type="button"
          className={`custom-datepicker-trigger ${isOpen ? 'focused' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="datepicker-icon-box">
              <CalendarIcon size={18} />
            </div>
            <span className="datepicker-display-value">
              {formatFriendlyDate(value)}
            </span>
          </div>
          <span className="datepicker-chevron">{isOpen ? '▲' : '▼'}</span>
        </button>
      )}

      {/* Popover do Calendário Dark Moderno */}
      {(isOpen || inline) && (
        <div 
          className="custom-calendar-popover" 
          role="dialog" 
          aria-modal="true"
          style={inline ? { position: 'relative', top: 0, left: 0, right: 0, width: '100%', boxSizing: 'border-box' } : {}}
        >
          {/* Cabeçalho do Mês e Navegação */}
          <div className="custom-calendar-header">
            <button 
              type="button" 
              className="cal-nav-btn" 
              onClick={handlePrevMonth}
              title="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="cal-header-title">
              <strong>{MONTH_NAMES[viewMonth - 1]}</strong>
              <span>{viewYear}</span>
            </div>
            <button 
              type="button" 
              className="cal-nav-btn" 
              onClick={handleNextMonth}
              title="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="custom-calendar-weekdays">
            {WEEKDAYS.map((wd, index) => (
              <div 
                key={wd} 
                className={`cal-weekday-cell ${index === 0 || index === 6 ? 'weekend' : ''}`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Grade dos Dias */}
          <div className="custom-calendar-grid">
            {daysGrid.map((item, idx) => {
              const isSelected = item.ymd === value;
              const isToday = item.ymd === todayYMD;

              let cellClass = 'cal-day-cell';
              if (!item.isCurrentMonth) cellClass += ' other-month';
              if (isSelected) cellClass += ' selected';
              if (isToday) cellClass += ' today';

              return (
                <button
                  type="button"
                  key={`${item.ymd}-${idx}`}
                  className={cellClass}
                  onClick={() => handleSelectDay(item.ymd)}
                >
                  <span className="day-number">{item.day}</span>
                  {isToday && !isSelected && <span className="today-dot"></span>}
                </button>
              );
            })}
          </div>

          {/* Rodapé com Atalhos Rápidos */}
          <div className="custom-calendar-footer">
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                type="button" 
                className="cal-quick-btn" 
                onClick={handleSelectToday}
              >
                Hoje
              </button>
              <button 
                type="button" 
                className="cal-quick-btn" 
                onClick={handleSelectYesterday}
              >
                Ontem
              </button>
            </div>
            <button 
              type="button" 
              className="cal-close-btn" 
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
