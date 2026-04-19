const CACHE_NAME = 'kickoff-v3'; // Bump version for the new navigation strategy
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kick_off_logo.png'
];

// 1. Install - cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch - Progressive Strategy for SPA
self.addEventListener('fetch', (event) => {
  // Navigation requests (Page Refreshes) - ALWAYS serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Common Strategy for other assets: Cache First, then Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Optionally cache new assets on the fly
        return fetchRes;
      });
    })
  );
});
