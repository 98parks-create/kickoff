const CACHE_NAME = 'kickoff-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kick_off_logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

// Network-First for ALL navigation requests to ensure 404s on refresh are handled by the server
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker for Supabase API calls to ensure real-time data
  if (url.hostname.includes('supabase.co')) {
    return; // Let it go directly to the network
  }

  // 2. Navigation requests: Network-First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3. Static assets: Cache-First
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
