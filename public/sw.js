const CACHE_NAME = 'tut-city-v1';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Push notification handler
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Tut City 🏙️';
  const options = {
    body: data.body || "Don't break your streak! Solve a problem today 🔥",
    icon: '/branding/app-icon-192.png',
    badge: '/branding/app-icon-192.png',
    data: { url: '/dashboard' },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/dashboard';
  e.waitUntil(clients.openWindow(url));
});

// Periodic streak reminder (triggered from client via message)
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SCHEDULE_STREAK_REMINDER') {
    // Store reminder preference
    // In a real implementation, this would use a push server
    // For now, we acknowledge the request
    e.source?.postMessage({ type: 'REMINDER_SCHEDULED' });
  }
});
