import { computed } from 'vue';
import { useOfflineStore } from '../stores/offline';
import type { MeterSubmitRequest } from '../api/meters';

export function useOfflineQueue() {
  const offlineStore = useOfflineStore();

  const pendingCount = computed(() => offlineStore.pendingCount);
  const isSyncing = computed(() => offlineStore.isSyncing);
  const lastSyncAt = computed(() => offlineStore.lastSyncAt);
  const syncError = computed(() => offlineStore.syncError);

  async function enqueue(data: MeterSubmitRequest, imageBlob?: Blob | null): Promise<void> {
    await offlineStore.enqueueReading(data, imageBlob);
  }

  async function sync(): Promise<void> {
    await offlineStore.syncQueue();
  }

  async function clearAll(): Promise<void> {
    await offlineStore.clearQueue();
  }

  return {
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncError,
    enqueue,
    sync,
    clearAll,
  };
}
