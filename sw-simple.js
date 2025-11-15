// Service Worker simple per l'app
const CACHE_NAME = 'paraulogic-app-v1';

self.addEventListener('install', (event) => {
  console.log('SW: Instal·lat');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activat');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Deixar passar totes les peticions sense cache
  // (així sempre carrega la versió més recent del Paraulògic)
  event.respondWith(fetch(event.request));
});
