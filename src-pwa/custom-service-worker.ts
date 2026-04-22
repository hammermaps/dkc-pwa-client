/**
 * Custom Service Worker for DK-Control PWA.
 * Extends the default Workbox service worker with background sync support.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Background sync plugin for offline meter submissions
const bgSyncPlugin = new BackgroundSyncPlugin('meter-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for max 24 hours (in minutes)
});

// Dashboard data – StaleWhileRevalidate for freshness + speed
registerRoute(
  ({ url }) => url.pathname.includes('api.php') && url.searchParams.get('action') === 'dashboard_data',
  new StaleWhileRevalidate({
    cacheName: 'api-dashboard',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 300 }),
    ],
  }),
);

// API data – NetworkFirst with fallback
registerRoute(
  ({ url }) => url.pathname.includes('api.php') && /^(nea_|mm_|building_|keys_|projects_)/.test(url.searchParams.get('action') ?? ''),
  new NetworkFirst({
    cacheName: 'api-data',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 3600 }),
    ],
  }),
);

// Meter submissions – NetworkFirst with background sync fallback
registerRoute(
  ({ url, request }) =>
    url.pathname.includes('api.php') &&
    /^(meter_submit|meter_batch_sync)$/.test(url.searchParams.get('action') ?? '') &&
    request.method === 'POST',
  new NetworkFirst({
    cacheName: 'api-meter-writes',
    plugins: [bgSyncPlugin],
  }),
  'POST',
);

// Google Fonts – CacheFirst
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

// Skip waiting and take control immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
