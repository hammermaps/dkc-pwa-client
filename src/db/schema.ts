import type { Meter, MeterReading } from '../api/meters';
import type { UserInfo } from '../api/auth';

export interface CachedMeter extends Meter {
  cached_at: number;
}

export interface CachedMeterReading extends MeterReading {
  synced: boolean;
  cached_at: number;
}

export interface OfflineQueueItem {
  id?: number;
  action: string;
  payload: Record<string, unknown>;
  image_blob?: Blob | null;
  created_at: number;
  retry_count: number;
  last_error?: string | null;
}

export interface UserCache {
  id: string;
  user: UserInfo;
  permissions: Record<string, boolean>;
  active_project_id: number | null;
  cached_at: number;
}
