// ⚡ TheKing Burger — Service Worker v2.0
// Verix Fix: activate + clients.claim() para habilitar beforeinstallprompt

const CACHE_NAME = 'theking-v2';
const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/products.js',
];

// INSTALL: Pre-cachear recursos esenciales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// ACTIVATE: Tomar control inmediato de todos los clientes
// SIN ESTO el navegador no dispara beforeinstallprompt correctamente
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH: Network-first con fallback a cache
self.addEventListener('fetch', (e) => {
  // Solo interceptar GET del mismo origen
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
