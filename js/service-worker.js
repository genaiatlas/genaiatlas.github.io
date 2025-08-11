self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  console.log('[ServiceWorker] Activated');
});

self.addEventListener('fetch', function (event) {
  // Simple pass-through; you can expand with caching logic later
  event.respondWith(fetch(event.request));
});