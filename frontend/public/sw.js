// PontoFlow Service Worker - cache do PWA e notificações Web Push em segundo plano
const CACHE_NAME = 'pontoflow-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch((err) => {
      console.warn('Cache de ativos parciais:', err);
    }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'PontoFlow', {
    body: payload.body || 'Você possui um lembrete de jornada.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'pontoflow',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.focus();
    return self.clients.openWindow(event.notification.data?.url || '/');
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('/index.html');
    }))
  );
});