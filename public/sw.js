// PinchChat Service Worker — cache static assets for offline/instant load
const CACHE_NAME = 'pinchchat-v1';

// Cache static assets on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for static assets, network-first for API/WS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, WebSocket upgrades, and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Don't cache API calls or WebSocket-related requests
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) return;

  // For navigation requests (HTML), always go network-first to get latest SPA shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|ico|json)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }
});
