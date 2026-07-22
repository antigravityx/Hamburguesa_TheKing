self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Passthrough fetch requests (simple PWA offline requirement)
  e.respondWith(fetch(e.request));
});
