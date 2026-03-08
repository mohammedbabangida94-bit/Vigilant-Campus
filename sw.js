const CACHE_NAME = 'vigilantNG-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './siren.mp3',
  './icon.png'
];

// 1. INSTALL: Caches your assets + Forces immediate update
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Forces the phone to use the new code immediately
});

// 2. ACTIVATE: Claims the app so the switch works without a restart
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        );
      }),
      self.clients.claim() // Takes control of the app right away
    ])
  );
});

// 3. FETCH: Smart Logic (Network-First for Security, Cache-First for Siren)
self.addEventListener('fetch', (e) => {
  // RULE: If the request is for the Kill Switch JSON, ALWAYS go to GitHub
  if (e.request.url.includes('sys_check_772.json')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // DEFAULT: Use cache for Siren/Images to save data and work offline
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});