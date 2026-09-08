// Motor de Áudio e Notificações com Web Audio API nativa e Vibration API

let audioCtx = null;
let alarmIntervalId = null;
let isAlarmPlaying = false;

// Verifica se o som está ativado pelo usuário (persistido no localStorage)
export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('pontoflow_sound_enabled');
  if (val === 'false') return false;
  if (val === 'true') return true;
  if ('Notification' in window && Notification.permission === 'granted') return true;
  return false;
}

// Salva preferência de som
export function setSoundEnabled(enabled) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pontoflow_sound_enabled', enabled ? 'true' : 'false');
    if (!enabled) {
      stopEmergencyAlarm();
    }
  }
}

// Desbloqueio silencioso do AudioContext no primeiro toque/clique do usuário
if (typeof window !== 'undefined') {
  const silentUnlock = () => {
    try {
      if (isSoundEnabled()) {
        const ctx = initAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch (e) {}
  };

  ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, silentUnlock, { capture: true, passive: true });
  });
}

// Inicializa e desbloqueia o AudioContext em dispositivos móveis (iOS/Android)
export function initAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('[AUDIO] Não foi possível inicializar AudioContext:', err);
    return null;
  }
}

// Bip básico sintetizado
export function playTone(freq = 800, duration = 0.15, type = 'sine', gainVal = 0.25) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('[AUDIO] Erro ao tocar som:', err);
  }
}

// Som de confirmação (Chime de sucesso ao bater ponto)
export function playSuccessChime() {
  try {
    playTone(523.25, 0.1, 'triangle', 0.2); // C5
    setTimeout(() => {
      playTone(659.25, 0.12, 'triangle', 0.2); // E5
      setTimeout(() => {
        playTone(783.99, 0.25, 'triangle', 0.25); // G5
      }, 100);
    }, 100);

    // Vibração tátil no smartphone
    vibrate([60, 40, 60]);
  } catch (e) {
    console.warn(e);
  }
}

// Som de Bip duplo de atenção
export function playWarningBeep() {
  playTone(880, 0.18, 'sawtooth', 0.2);
  setTimeout(() => {
    playTone(1046.5, 0.22, 'sawtooth', 0.25);
  }, 200);
}

// Disparo contínuo e repetitivo de alarme emergencial
export function startEmergencyAlarm() {
  if (isAlarmPlaying) return;
  isAlarmPlaying = true;

  initAudioContext();

  const playSequence = () => {
    if (!isAlarmPlaying) return;

    // Duplo bip estridente de alta penetração sonora
    playTone(950, 0.16, 'sawtooth', 0.35);
    setTimeout(() => {
      if (isAlarmPlaying) {
        playTone(1200, 0.22, 'sawtooth', 0.4);
      }
    }, 180);

    // Vibração no celular
    vibrate([250, 150, 250, 150, 400]);
  };

  playSequence();
  alarmIntervalId = setInterval(playSequence, 1200);
}

// Parar alarme emergencial
export function stopEmergencyAlarm() {
  isAlarmPlaying = false;
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

export function isAlarmActive() {
  return isAlarmPlaying;
}

// Feedback háptico tátil via Vibration API
export function vibrate(pattern = [100]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    console.warn('[VIBRATION] Erro ao vibrar dispositivo:', err);
  }
}

// Solicitação de permissão para notificações Web Push / Desktop
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[NOTIFICATION] Erro ao solicitar permissão:', err);
    return 'denied';
  }
}

// Disparo de notificação no Sistema Operacional / Celular
export function sendNotification(title, body, tag = 'pontoflow') {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const options = {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };
      new Notification(title, options);
    }
  } catch (err) {
    console.warn('[NOTIFICATION] Erro ao disparar notificação:', err);
  }
}
