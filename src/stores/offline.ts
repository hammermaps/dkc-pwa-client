import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db';
import type { OfflineQueueItem } from '../db/schema';
import type { MeterSubmitRequest } from '../api/meters';
import { batchSyncReadings, submitReadingWithImage } from '../api/meters';

export const useOfflineStore = defineStore('offline', () => {
  const isOnline = ref<boolean>(navigator.onLine);
  const isSyncing = ref(false);
  const pendingCount = ref(0);
  const lastSyncAt = ref<Date | null>(null);
  const syncError = ref<string | null>(null);

  // Initialize pending count from IndexedDB on store creation
  void db.offlineQueue.count().then((count) => {
    pendingCount.value = count;
  });

  async function refreshPendingCount(): Promise<void> {
    pendingCount.value = await db.offlineQueue.count();
  }

  function setOnline(value: boolean): void {
    isOnline.value = value;
    if (value) {
      void refreshPendingCount();
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

    // Use indexed query to avoid in-memory full scan
    const items = await db.offlineQueue
      .where('retry_count')
      .below(5)
      .toArray();

    if (items.length === 0) return;

    isSyncing.value = true;
    syncError.value = null;

    try {
      // Partition items into those with and without an image in a single pass
      const itemsWithImage: OfflineQueueItem[] = [];
      const itemsWithoutImage: OfflineQueueItem[] = [];
      for (const item of items) {
        if (item.action !== 'meter_submit') continue;
        if (item.image_blob instanceof Blob) {
          itemsWithImage.push(item);
        } else {
          itemsWithoutImage.push(item);
        }
      }

      // Batch sync for items without images
      if (itemsWithoutImage.length > 0) {
        const readings = itemsWithoutImage.map(
          (item) => item.payload as unknown as MeterSubmitRequest,
        );
        const res = await batchSyncReadings(readings);
        if (res.success) {
          const ids = itemsWithoutImage
            .filter((item) => item.id !== undefined)
            .map((item) => item.id as number);
          await db.offlineQueue.bulkDelete(ids);
          lastSyncAt.value = new Date();
        } else {
          syncError.value = res.error ?? 'Batch-Sync fehlgeschlagen';
          for (const item of itemsWithoutImage) {
            if (item.id !== undefined) {
              await db.offlineQueue.update(item.id, {
                retry_count: item.retry_count + 1,
                last_error: res.error,
              });
            }
          }
        }
      }

      // Individual FormData upload for items with images
      for (const item of itemsWithImage) {
        try {
          const data = item.payload as unknown as MeterSubmitRequest;
          const res = await submitReadingWithImage(data, item.image_blob as Blob);
          if (res.success) {
            if (item.id !== undefined) {
              await db.offlineQueue.delete(item.id);
            }
            lastSyncAt.value = new Date();
          } else {
            if (item.id !== undefined) {
              await db.offlineQueue.update(item.id, {
                retry_count: item.retry_count + 1,
                last_error: res.error,
              });
            }
            // Preserve the first error encountered; later errors are secondary
            if (!syncError.value) {
              syncError.value = res.error ?? 'Bild-Upload fehlgeschlagen';
            }
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Sync-Fehler';
          if (item.id !== undefined) {
            await db.offlineQueue.update(item.id, {
              retry_count: item.retry_count + 1,
              last_error: errMsg,
            });
          }
          // Preserve the first error encountered
          if (!syncError.value) {
            syncError.value = errMsg;
          }
        }
      }
    } catch (err) {
      syncError.value = err instanceof Error ? err.message : 'Sync-Fehler';
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
