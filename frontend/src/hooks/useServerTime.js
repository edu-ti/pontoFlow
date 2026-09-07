import { useState, useEffect, useRef } from 'react';

export function useServerTime(initialServerTime, initialServerDate) {
  const [currentTime, setCurrentTime] = useState(initialServerTime || '08:00:00');
  const [currentDate, setCurrentDate] = useState(initialServerDate || '');
  const serverOffsetRef = useRef(0);

  // Calcular offset entre o relógio local e o servidor quando initialServerTime for fornecido
  useEffect(() => {
    if (!initialServerTime) return;

    try {
      const now = new Date();
      const [h, m, s] = initialServerTime.split(':').map(Number);
      const serverDateObj = new Date();
      serverDateObj.setHours(h, m, s, 0);

      // Offset em milissegundos: tempo_servidor - tempo_cliente
      serverOffsetRef.current = serverDateObj.getTime() - now.getTime();
      setCurrentTime(initialServerTime);
      if (initialServerDate) setCurrentDate(initialServerDate);
    } catch (err) {
      console.warn('Erro ao sincronizar relógio com o servidor:', err);
    }
  }, [initialServerTime, initialServerDate]);

  // Avançar o relógio a cada 1 segundo sincronizado com o offset
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date(Date.now() + serverOffsetRef.current);
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { currentTime, currentDate };
}
