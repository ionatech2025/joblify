// Joblify service worker — conservative offline support for an installable PWA.
// Bump CACHE to invalidate. API + cross-origin (Clerk, Algolia, analytics) are
// never intercepted; hashed static assets are cache-first; navigations are
// network-first with an offline fallback.
const CACHE = 'joblify-v1';
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Clerk / Algolia / analytics
  if (url.pathname.startsWith('/api/')) return; // never cache API responses

  // Immutable hashed build assets → cache-first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Page navigations → network-first, fall back to cache then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(request)) || (await cache.match(OFFLINE_URL)) || Response.error()
          );
        }
      })(),
    );
  }
});
