const CACHE_NAME = 'intera-demo-v2';
const APP_SHELL = [
  './', './index.html', './offline.html', './manifest.webmanifest', './assets/app.css', './assets/intera-mark.svg',
  './src/ui/app.js', './src/ui/router.js', './src/ui/components.js', './src/ui/controller.js', './src/ui/explore-filter.js', './src/ui/views/home.js', './src/ui/views/marketplace.js', './src/ui/views/exchanges.js',
  './src/demo/seed.js', './src/persistence/local-repository.js', './src/application/demo-service.js', './src/application/selectors.js',
  './src/domain/ct.js', './src/domain/ledger.js', './src/domain/state-machine.js', './src/domain/types.js', './src/domain/matching.js', './src/domain/reputation.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html').then((page) => page || caches.match('./offline.html')) : caches.match('./offline.html')))
  );
});
