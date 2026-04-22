import { apiGet } from './client';

export interface NeaSystem {
  id: number;
  name: string;
  description: string;
  location: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  installation_date: string;
  enabled: boolean;
  project_id: number;
  last_inspection_date: string | null;
  last_inspection_result: string | null;
}

export interface NeaInspection {
  id: number;
  nea_system_id: number;
  system_name: string;
  inspection_type: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
  overall_result: string;
  runtime_hours: number;
  notes: string;
  created_at: string;
}

export interface NeaSystemsResponse {
  success: boolean;
  project_id?: number;
  systems?: NeaSystem[];
  error?: string;
}

export interface NeaInspectionsResponse {
  success: boolean;
  project_id?: number;
  total?: number;
  limit?: number;
  offset?: number;
  inspections?: NeaInspection[];
  error?: string;
}

export interface NeaDashboardResponse {
  success: boolean;
  project_id?: number;
  stats?: {
    total_systems: number;
    inspections_this_week: number;
    inspections_this_month: number;
    failed_last_30_days: number;
  };
  due_tests?: {
    system_id: number;
    system_name: string;
    days_overdue: number;
    last_inspection: string;
  }[];
  recent_inspections?: NeaInspection[];
  error?: string;
}

export async function getNeaDashboard(projectId?: number): Promise<NeaDashboardResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (projectId !== undefined) params['project_id'] = projectId;
  return apiGet<NeaDashboardResponse>('nea_dashboard', params);
}

export async function getNeaSystems(projectId?: number): Promise<NeaSystemsResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (projectId !== undefined) params['project_id'] = projectId;
  return apiGet<NeaSystemsResponse>('nea_systems', params);
}

export async function getNeaInspections(opts?: {
  system_id?: number;
  year?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<NeaInspectionsResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (opts?.system_id !== undefined) params['system_id'] = opts.system_id;
  if (opts?.year !== undefined) params['year'] = opts.year;
  if (opts?.status !== undefined) params['status'] = opts.status;
  if (opts?.limit !== undefined) params['limit'] = opts.limit;
  if (opts?.offset !== undefined) params['offset'] = opts.offset;
  return apiGet<NeaInspectionsResponse>('nea_inspections', params);
}
