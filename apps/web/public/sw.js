// Joblify service worker — conservative offline support for an installable PWA.
// Bump CACHE to invalidate. API + cross-origin (Clerk, Algolia, analytics) are
// never intercepted; hashed static assets are cache-first; navigations go to the
// network with an offline fallback.
const CACHE = 'joblify-v2';
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
    (async () => {
      // Navigation preload lets the browser fire the navigation request in
      // parallel with booting this worker. Without it, every navigation on the
      // site waits for service-worker startup before its request even leaves —
      // a cost paid on all four hops of onboarding in exchange for a fallback
      // that only ever serves /offline.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
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

  // Page navigations → preloaded network response, falling back to the offline
  // page. Responses are deliberately NOT cached: most routes here are
  // authenticated, and a shared device would let the next person read the
  // previous one's console out of the cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse;
          if (preloaded) return preloaded;
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
  }
});
