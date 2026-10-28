const CACHE_NAME = 'wiejskie-zycie-v6';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './farm3d.js',
  './data.js',
  './music.js',
  './agent.js',
  './scenery.js',
  './look.js',
  './vendor/addons/geometries/RoundedBoxGeometry.js',
  './vendor/addons/objects/Sky.js',
  './vendor/addons/postprocessing/EffectComposer.js',
  './vendor/addons/postprocessing/MaskPass.js',
  './vendor/addons/postprocessing/OutputPass.js',
  './vendor/addons/postprocessing/Pass.js',
  './vendor/addons/postprocessing/RenderPass.js',
  './vendor/addons/postprocessing/ShaderPass.js',
  './vendor/addons/postprocessing/UnrealBloomPass.js',
  './vendor/addons/shaders/CopyShader.js',
  './vendor/addons/shaders/LuminosityHighPassShader.js',
  './vendor/addons/shaders/OutputShader.js',
  './vendor/three.module.min.js',
  './fonts/fredoka-latin.woff2',
  './fonts/fredoka-latin-ext.woff2',
  './manifest.webmanifest',
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
