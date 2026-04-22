import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getMeterList,
  getMeterReadings,
  submitReading,
  deactivateMeter,
  activateMeter,
} from '../api/meters';
import type { Meter, MeterReading, MeterSubmitRequest } from '../api/meters';
import { db } from '../db';
import type { CachedMeter, CachedMeterReading } from '../db/schema';
import { useOfflineStore } from './offline';

export const useMeterStore = defineStore('meters', () => {
  const meters = ref<Meter[]>([]);
  const currentMeter = ref<Meter | null>(null);
  const currentReadings = ref<MeterReading[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadMeters(projectId?: number): Promise<void> {
    isLoading.value = true;
    error.value = null;
    const offlineStore = useOfflineStore();

    try {
      if (offlineStore.isOnline) {
        const res = await getMeterList(projectId);
        if (res.success && res.meters) {
          meters.value = res.meters;
          // Cache in IndexedDB
          const now = Date.now();
          const cached: CachedMeter[] = res.meters.map((m) => ({ ...m, cached_at: now }));
          await db.meters.bulkPut(cached);
        } else {
          error.value = res.error ?? 'Fehler beim Laden der Zähler';
        }
      } else {
        // Load from IndexedDB cache
        const cached = await db.meters.toArray();
        meters.value = cached.map(({ cached_at: _ca, ...m }) => m as Meter);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Netzwerkfehler';
      // Fallback to cache
      const cached = await db.meters.toArray();
      meters.value = cached.map(({ cached_at: _ca, ...m }) => m as Meter);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadReadings(meterId: number, limit = 50): Promise<void> {
    isLoading.value = true;
    error.value = null;
    const offlineStore = useOfflineStore();

    try {
      if (offlineStore.isOnline) {
        const res = await getMeterReadings(meterId, limit);
        if (res.success && res.readings) {
          currentReadings.value = res.readings;
          // Cache readings
          const now = Date.now();
          const cached: CachedMeterReading[] = res.readings.map((r) => ({
            ...r,
            synced: true,
            cached_at: now,
          }));
          await db.meterReadings.bulkPut(cached);
        } else {
          error.value = res.error ?? 'Fehler beim Laden der Ablesungen';
          // Fall back to cached readings on API error
          const cached = await db.meterReadings
            .where('meter_id')
            .equals(meterId)
            .reverse()
            .limit(limit)
            .toArray();
          currentReadings.value = cached.map(({ synced: _s, cached_at: _ca, ...r }) => r as MeterReading);
        }
      } else {
        const cached = await db.meterReadings
          .where('meter_id')
          .equals(meterId)
          .reverse()
          .limit(limit)
          .toArray();
        currentReadings.value = cached.map(({ synced: _s, cached_at: _ca, ...r }) => r as MeterReading);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Netzwerkfehler';
    } finally {
      isLoading.value = false;
    }
  }

  async function addReading(data: MeterSubmitRequest, imageBlob?: Blob | null): Promise<boolean> {
    const offlineStore = useOfflineStore();
    error.value = null;

    if (!offlineStore.isOnline) {
      // Save to offline queue
      await offlineStore.enqueueReading(data, imageBlob);
      return true;
    }

    try {
      const res = await submitReading(data);
      if (res.success) {
        await loadReadings(data.meter_id);
        return true;
      } else {
        error.value = res.error ?? 'Fehler beim Speichern der Ablesung';
        return false;
      }
    } catch (err) {
      // Fallback: queue offline
      await offlineStore.enqueueReading(data, imageBlob);
      return true;
    }
  }

  async function toggleMeterActive(meterId: number, active: boolean): Promise<boolean> {
    try {
      const fn = active ? activateMeter : deactivateMeter;
      const res = await fn(meterId);
      if (res.success) {
        const idx = meters.value.findIndex((m) => m.id === meterId);
        if (idx >= 0) {
          meters.value[idx] = { ...meters.value[idx]!, active };
        }
        await db.meters.update(meterId, { active });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  return {
    meters,
    currentMeter,
    currentReadings,
    isLoading,
    error,
    loadMeters,
    loadReadings,
    addReading,
    toggleMeterActive,
  };
});
