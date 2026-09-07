import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  startEmergencyAlarm, 
  stopEmergencyAlarm, 
  sendNotification, 
  playWarningBeep 
} from '../services/soundEffects';

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function useAlarmSystem(todayData, serverTime) {
  const [activeAlarm, setActiveAlarm] = useState(null); // null | { type: 'almoco' | 'expediente', title: string, message: string, targetTime: string }
  const [dismissedAlarms, setDismissedAlarms] = useState({});

  const lastCheckedSecond = useRef(-1);

  // Função para dispensar/silenciar o alarme ativo
  const dismissAlarm = useCallback(() => {
    stopEmergencyAlarm();
    if (activeAlarm) {
      setDismissedAlarms((prev) => ({
        ...prev,
        [activeAlarm.type]: true
      }));
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  // Função para simular/testar o alarme manualmente
  const triggerTestAlarm = useCallback(() => {
    const testAlarm = {
      type: 'teste',
      title: '🚨 TESTE DE ALERTA PONTOFLOW',
      message: 'Este é um teste de alerta visual e sonoro para conferência com o relógio físico Knup.',
      targetTime: 'Agora'
    };
    setActiveAlarm(testAlarm);
    startEmergencyAlarm();
    sendNotification(testAlarm.title, testAlarm.message, 'test-alarm');
  }, []);

  useEffect(() => {
    if (!todayData || !serverTime) return;

    const [currentHour, currentMin, currentSec] = serverTime.split(':').map(Number);
    const currentTotalSec = currentHour * 3600 + currentMin * 60 + currentSec;
    const currentTotalMin = currentHour * 60 + currentMin;

    // Evitar checagens duplicadas no mesmo segundo
    if (lastCheckedSecond.current === currentTotalSec) return;
    lastCheckedSecond.current = currentTotalSec;

    const { ponto, jornada, regras, server } = todayData;
    const dayOfWeek = server?.day_of_week ?? new Date().getDay();

    // -------------------------------------------------------------
    // 1. GATILHO: VOLTA DO ALMOÇO
    // Ativa quando Saída Almoço foi batida, mas Volta Almoço AINDA NÃO.
    // -------------------------------------------------------------
    if (ponto?.saida_almoco && !ponto?.volta_almoco && !dismissedAlarms['almoco']) {
      const saidaAlmocoMin = parseTimeToMinutes(ponto.saida_almoco);
      const intervalo = jornada?.tempo_intervalo_minutos || 60;
      const voltaPrevistaMin = (saidaAlmocoMin + intervalo) % 1440;

      // Exatamente 5 minutos antes da volta
      const alertaAlmocoMin = (voltaPrevistaMin - 5 + 1440) % 1440;

      // Se o horário atual estiver entre o horário de alerta e até 10 minutos após o retorno previsto
      const isHoraDoAlerta = (currentTotalMin >= alertaAlmocoMin && currentTotalMin <= voltaPrevistaMin + 10);

      if (isHoraDoAlerta && !activeAlarm) {
        const hPrev = String(Math.floor(voltaPrevistaMin / 60)).padStart(2, '0');
        const mPrev = String(voltaPrevistaMin % 60).padStart(2, '0');
        const horaStr = `${hPrev}:${mPrev}`;

        const alarmInfo = {
          type: 'almoco',
          title: '⏰ ATENÇÃO: RETORNO DO ALMOÇO!',
          message: `Faltam menos de 5 minutos para as ${horaStr}. Prepare-se para retornar e bater no relógio físico Knup!`,
          targetTime: horaStr
        };

        setActiveAlarm(alarmInfo);
        startEmergencyAlarm();
        sendNotification(alarmInfo.title, alarmInfo.message, 'lunch-alarm');
      }
    }

    // Se a volta do almoço for batida enquanto o alarme estiver tocando, desativa imediatamente
    if (ponto?.volta_almoco && activeAlarm?.type === 'almoco') {
      stopEmergencyAlarm();
      setActiveAlarm(null);
    }

    // -------------------------------------------------------------
    // 2. GATILHO: FIM DO EXPEDIENTE
    // Ativa quando Entrada foi batida, mas Fim do Expediente AINDA NÃO.
    // -------------------------------------------------------------
    if (ponto?.entrada_expediente && !ponto?.saida_expediente && !dismissedAlarms['expediente']) {
      const isSexta = dayOfWeek === 5;
      const horarioLimiteStr = isSexta ? jornada?.saida_sexta : jornada?.saida_seg_qui;
      const limiteMin = parseTimeToMinutes(horarioLimiteStr);

      if (limiteMin) {
        // Exatamente 5 minutos antes
        const alertaFimMin = (limiteMin - 5 + 1440) % 1440;

        const isHoraDoAlerta = (currentTotalMin >= alertaFimMin && currentTotalMin <= limiteMin + 15);

        if (isHoraDoAlerta && !activeAlarm) {
          const alarmInfo = {
            type: 'expediente',
            title: '🏁 HORA DE ENCERRAR O EXPEDIENTE!',
            message: `Faltam 5 minutos para as ${horarioLimiteStr.slice(0, 5)}. Finalize suas atividades e registre a saída no relógio físico Knup!`,
            targetTime: horarioLimiteStr.slice(0, 5)
          };

          setActiveAlarm(alarmInfo);
          startEmergencyAlarm();
          sendNotification(alarmInfo.title, alarmInfo.message, 'end-day-alarm');
        }
      }
    }

    // Se a saída do expediente for batida enquanto o alarme estiver tocando, desativa
    if (ponto?.saida_expediente && activeAlarm?.type === 'expediente') {
      stopEmergencyAlarm();
      setActiveAlarm(null);
    }

  }, [todayData, serverTime, dismissedAlarms, activeAlarm]);

  return {
    activeAlarm,
    dismissAlarm,
    triggerTestAlarm
  };
}
