const CACHE_NAME = 'fireworks-shell-v1';
const ASSETS = ['.', './index.html', './manifest.webmanifest', './icon.svg', './fireworks.config.js'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/')) {
    event.respondWith((async () => {
      try {
        const net = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', net.clone());
        return net;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const net = await fetch(event.request);
      cache.put(event.request, net.clone());
      return net;
    } catch (err) {
      return Response.error();
    }
  })());
});
