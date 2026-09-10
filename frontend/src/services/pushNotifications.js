import { api } from './api';

function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

// Salva a inscrição no backend. O navegador poderá então receber push mesmo fechado.
export async function enableBackgroundNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const { publicKey } = await api.notifications.getConfig();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    await api.notifications.subscribe(subscription.toJSON());
    return true;
  } catch (error) {
    console.warn('[PUSH] Não foi possível habilitar notificações em segundo plano:', error.message);
    return false;
  }
}