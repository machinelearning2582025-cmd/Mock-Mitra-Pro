const CACHE_NAME = 'mockmitra-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Asset precache partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache-First / Stale-While-Revalidate with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude Firebase API, Gemini API, and analytics requests from SW cache
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('generativelanguage.googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Handle standard navigation and static requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache if online
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline and requesting navigation, return index.html
          if (event.request.mode === 'navigate') {
            const indexFallback = await caches.match('/index.html');
            if (indexFallback) return indexFallback;
          }
          return new Response('Offline: Resource not available in cache', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

// Push & Notification Event Handlers
self.addEventListener('push', (event) => {
  let data = {
    title: 'MockMitra Study Reminder',
    body: 'Aapke targeted exam ke liye daily practice test ready hai! 🎯',
    tag: 'mockmitra-study-reminder'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    },
    tag: data.tag || 'mockmitra-daily-reminder',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click: Focus existing app window or open a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
