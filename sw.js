// Gastia Service Worker — Network First strategy
// Bump this version to force cache invalidation on next deploy
const VERSION = 'gastia-v1';
const CACHE = VERSION;

// On install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => 
      cache.addAll(['/gastia/', '/gastia/index.html'])
    ).then(() => self.skipWaiting())
  );
});

// On activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network First — always try network, fallback to cache
self.addEventListener('fetch', e => {
  // Only intercept same-origin navigation requests (the HTML)
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Cache the fresh response
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Everything else (Supabase API calls, etc.) goes straight to network
  e.respondWith(fetch(e.request));
});

// Allow main thread to trigger immediate activation
self.addEventListener('message', e => {
  if(e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
