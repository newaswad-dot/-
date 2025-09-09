const CACHE_NAME = 'pwa-wrapper-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './styles.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first for iframe URL, cache-first for shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin requests for shell
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((resp) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        });
      }).catch(() => caches.match('./offline.html'))
    );
  }
  // Cross-origin (like your Apps Script URL) will pass through network
  // If offline and it fails, the iframe page itself can't be cached due to CORS.
  // The shell will still load and show an offline message.
});
