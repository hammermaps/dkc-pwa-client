import Dexie, { type Table } from 'dexie';
import type {
  CachedMeter,
  CachedMeterReading,
  OfflineQueueItem,
  UserCache,
} from './schema';

export class DkcDatabase extends Dexie {
  meters!: Table<CachedMeter, number>;
  meterReadings!: Table<CachedMeterReading, number>;
  offlineQueue!: Table<OfflineQueueItem, number>;
  userCache!: Table<UserCache, string>;

  constructor() {
    super('dkc-pwa-db');

    this.version(1).stores({
      meters:
        '&id, name, type, location, unit, project_id, active, cached_at',
      meterReadings:
        '++id, meter_id, value, date, synced, cached_at',
      offlineQueue:
        '++id, action, created_at, retry_count',
      userCache:
        '&id',
    });
  }
}

export const db = new DkcDatabase();
