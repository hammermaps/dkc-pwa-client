import { apiGet, apiPost } from './client';

export interface Meter {
  id: number;
  name: string;
  type: string;
  location: string;
  unit: string;
  project_id: number;
  serial_number?: string;
  description?: string;
  active: boolean;
  last_reading?: number;
  last_reading_date?: string;
  qr_code?: string;
}

export interface MeterReading {
  id: number;
  meter_id: number;
  value: number;
  date: string;
  notes?: string;
  image_path?: string;
  created_by?: string;
  created_at?: string;
}

export interface MeterListResponse {
  success: boolean;
  meters?: Meter[];
  error?: string;
}

export interface MeterReadingsResponse {
  success: boolean;
  meter_id?: number;
  readings?: MeterReading[];
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
}

export interface MeterSubmitRequest {
  meter_id: number;
  value: number;
  date: string;
  notes?: string;
}

export interface MeterBatchSyncRequest {
  readings: MeterSubmitRequest[];
}

export interface MeterQrItem {
  id: number;
  name: string;
  type: string;
  unit: string;
  qr_code: string;
  location: string;
}

export interface MeterQrListResponse {
  success: boolean;
  meters?: MeterQrItem[];
  error?: string;
}

export async function getMeterList(projectId?: number): Promise<MeterListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (projectId !== undefined) params['project_id'] = projectId;
  return apiGet<MeterListResponse>('meter_list', params);
}

export async function getMeterReadings(
  meterId: number,
  limit = 50,
  offset = 0,
): Promise<MeterReadingsResponse> {
  return apiGet<MeterReadingsResponse>('meter_readings', {
    meter_id: meterId,
    limit,
    offset,
  });
}

export async function submitReading(data: MeterSubmitRequest): Promise<{ success: boolean; error?: string }> {
  return apiPost('meter_submit', data);
}

export async function batchSyncReadings(
  readings: MeterSubmitRequest[],
): Promise<{ success: boolean; synced?: number; errors?: unknown[]; error?: string }> {
  return apiPost('meter_batch_sync', { readings });
}

export async function getMeterQrList(): Promise<MeterQrListResponse> {
  return apiGet<MeterQrListResponse>('meter_qr_list');
}

export async function deactivateMeter(
  meterId: number,
): Promise<{ success: boolean; error?: string }> {
  return apiPost('meter_deactivate', { meter_id: meterId });
}

export async function activateMeter(
  meterId: number,
): Promise<{ success: boolean; error?: string }> {
  return apiPost('meter_activate', { meter_id: meterId });
}
