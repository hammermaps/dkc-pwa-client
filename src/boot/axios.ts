import { defineBoot } from '#q-app/wrappers';
import { useOfflineStore } from '../stores/offline';

export default defineBoot(() => {
  // This boot file sets up network monitoring.
  // The store itself is initialized lazily on first use.
  window.addEventListener('online', () => {
    const offlineStore = useOfflineStore();
    offlineStore.setOnline(true);
  });

  window.addEventListener('offline', () => {
    const offlineStore = useOfflineStore();
    offlineStore.setOnline(false);
  });
});
