// ── Evona Stock – Service Worker v202611101500 ──
const VERSION = '202611101500';
const CACHE_NAME = 'evona-stock-' + VERSION;

const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  console.log('[SW] Installation version', VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activation version', VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Suppression ancien cache:', key);
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network First pour HTML, Cache First pour le reste
self.addEventListener('fetch', event => {
  const isHTML = event.request.destination === 'document' ||
                 event.request.url.endsWith('.html');
  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
