const CACHE_NAME = 'kickoff-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kick_off_logo.png'
];

// 1. Install - cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
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
    }).then(() => self.clients.claim()) // Immediately take control of all clients
  );
});

// 3. Fetch - Network First for the root/index.html to prevent stale dashboard crashes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // If it's a request for the main page or root, try network first
  if (url.origin === self.location.origin && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Common Strategy for other assets: Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
