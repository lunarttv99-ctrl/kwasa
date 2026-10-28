const CACHE_NAME = 'wiejska-zagroda-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './more.js',
  './world.js',
  './sprites.js',
  './data.js',
  './sound.js',
  './manifest.webmanifest',
  './fonts/fredoka-latin.woff2',
  './fonts/fredoka-latin-ext.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

// Najpierw sieć (żeby aktualizacje docierały od razu), a bez internetu — kopia z pamięci.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
