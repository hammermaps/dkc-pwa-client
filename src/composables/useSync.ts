import { ref, computed } from 'vue';
import { useOfflineStore } from '../stores/offline';

export function useSync() {
  const offlineStore = useOfflineStore();
  const manualSyncError = ref<string | null>(null);

  const canSync = computed(
    () => offlineStore.isOnline && !offlineStore.isSyncing && offlineStore.pendingCount > 0,
  );

  async function triggerSync(): Promise<void> {
    manualSyncError.value = null;
    try {
      await offlineStore.syncQueue();
      if (offlineStore.syncError) {
        manualSyncError.value = offlineStore.syncError;
      }
    } catch (err) {
      manualSyncError.value = err instanceof Error ? err.message : 'Sync-Fehler';
    }
  }

  return {
    isOnline: computed(() => offlineStore.isOnline),
    isSyncing: computed(() => offlineStore.isSyncing),
    pendingCount: computed(() => offlineStore.pendingCount),
    lastSyncAt: computed(() => offlineStore.lastSyncAt),
    canSync,
    manualSyncError,
    triggerSync,
  };
}
