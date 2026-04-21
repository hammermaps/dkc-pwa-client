import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db';
import type { OfflineQueueItem } from '../db/schema';
import type { MeterSubmitRequest } from '../api/meters';
import { batchSyncReadings } from '../api/meters';

export const useOfflineStore = defineStore('offline', () => {
  const isOnline = ref<boolean>(navigator.onLine);
  const isSyncing = ref(false);
  const pendingCount = ref(0);
  const lastSyncAt = ref<Date | null>(null);
  const syncError = ref<string | null>(null);

  async function refreshPendingCount(): Promise<void> {
    pendingCount.value = await db.offlineQueue.count();
  }

  function setOnline(value: boolean): void {
    isOnline.value = value;
    if (value) {
      void syncQueue();
    }
  }

  async function enqueueReading(
    data: MeterSubmitRequest,
    imageBlob?: Blob | null,
  ): Promise<void> {
    const item: OfflineQueueItem = {
      action: 'meter_submit',
      payload: data as unknown as Record<string, unknown>,
      image_blob: imageBlob ?? null,
      created_at: Date.now(),
      retry_count: 0,
    };
    await db.offlineQueue.add(item);
    await refreshPendingCount();
  }

  async function syncQueue(): Promise<void> {
    if (isSyncing.value || !isOnline.value) return;

    const items = await db.offlineQueue
      .filter((item) => item.retry_count < 5)
      .toArray();

    if (items.length === 0) return;

    isSyncing.value = true;
    syncError.value = null;

    try {
      // Group meter_submit actions for batch sync
      const meterReadings = items
        .filter((item) => item.action === 'meter_submit')
        .map((item) => item.payload as unknown as MeterSubmitRequest);

      if (meterReadings.length > 0) {
        const res = await batchSyncReadings(meterReadings);
        if (res.success) {
          // Remove synced items from queue
          const ids = items
            .filter((item) => item.action === 'meter_submit' && item.id !== undefined)
            .map((item) => item.id as number);
          await db.offlineQueue.bulkDelete(ids);
          lastSyncAt.value = new Date();
        } else {
          syncError.value = res.error ?? 'Sync fehlgeschlagen';
          // Increment retry count
          for (const item of items) {
            if (item.id !== undefined) {
              await db.offlineQueue.update(item.id, {
                retry_count: item.retry_count + 1,
                last_error: res.error,
              });
            }
          }
        }
      }
    } catch (err) {
      syncError.value = err instanceof Error ? err.message : 'Sync-Fehler';
      // Increment retry counts
      for (const item of items) {
        if (item.id !== undefined) {
          await db.offlineQueue.update(item.id, {
            retry_count: item.retry_count + 1,
            last_error: syncError.value,
          });
        }
      }
    } finally {
      isSyncing.value = false;
      await refreshPendingCount();
    }
  }

  async function clearQueue(): Promise<void> {
    await db.offlineQueue.clear();
    await refreshPendingCount();
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    syncError,
    setOnline,
    enqueueReading,
    syncQueue,
    clearQueue,
    refreshPendingCount,
  };
});
