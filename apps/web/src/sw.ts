/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

precacheAndRoute(self.__WB_MANIFEST);

// Permite que `updateServiceWorker(true)` (prompt de nueva versión) active
// el SW en espera: el cliente postea SKIP_WAITING y aquí lo aplicamos.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// El nuevo SW toma control de las pestañas abiertas tras activarse.
clientsClaim();

registerRoute(
  ({ url }) => url.origin === 'https://api.santiagomustafa.com.ar',
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
  })
);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const { title, body, url } = payload;
  event.waitUntil(
    self.registration.showNotification(title ?? 'ManageCost', {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(self.clients.openWindow(url));
});
