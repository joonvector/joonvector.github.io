// Cosmic Striker Service Worker (Network-First Live Update + Offline Fallback)
const CACHE_NAME = 'cosmic-striker-v20';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './game_shooting_v.05.html',
  './manifest.json',
  './victory_crown.jpg',
  './title_bg_clean.jpg',
  './title_jet_cutout.png',
  './assets/player_ship.jpg',
  './assets/enemy_scout.jpg',
  './assets/enemy_hunter.jpg',
  './assets/enemy_dreadnought.jpg',
  './assets/set1_bg.jpg',
  './assets/set1_boss.jpg',
  './assets/set2_bg.jpg',
  './assets/set2_boss.jpg',
  './assets/set3_bg.jpg',
  './assets/set3_boss.jpg',
  './assets/set4_bg.jpg',
  './assets/set4_boss.jpg',
  './assets/set5_bg.jpg',
  './assets/set5_boss.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First Strategy: Bypass 10-minute browser HTTP cache for HTML/JS so updates apply immediately
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  const isDocOrScript =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('/');

  const fetchOptions = isDocOrScript ? { cache: 'no-cache' } : {};

  event.respondWith(
    fetch(event.request, fetchOptions)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
