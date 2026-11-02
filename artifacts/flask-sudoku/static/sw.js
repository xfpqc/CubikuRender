const CACHE_NAME = 'cubiku-v55';

const ASSETS = [
  './',
  './index.html',
  './static/style.css?v=55',
  './static/game.js?v=55',
  './static/icon-512.png',
  './static/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          // If network fails (offline or Render sleeping/spinning up), fall back to cached page for navigation requests
          if (!cachedResponse && event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          throw err;
        });

      // Instantly return cached response to wake up UI immediately, while network fetches in background
      return cachedResponse || fetchPromise;
    })
  );
});