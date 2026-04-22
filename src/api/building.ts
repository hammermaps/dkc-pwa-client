import { apiGet } from './client';

export interface Building {
  id: number;
  name: string;
  address: string;
  description: string;
  enabled: boolean;
  project_id: number;
}

export interface BuildingInspection {
  id: number;
  building_id: number;
  building_name: string;
  title: string;
  inspection_date: string;
  status: string;
  overall_result: string;
  created_by_name: string;
  last_editor_name: string;
  weather: string;
  attendees: string;
}

export interface BuildingListResponse {
  success: boolean;
  project_id?: number;
  buildings?: Building[];
  error?: string;
}

export interface BuildingInspectionsResponse {
  success: boolean;
  project_id?: number;
  total?: number;
  limit?: number;
  offset?: number;
  inspections?: BuildingInspection[];
  error?: string;
}

export async function getBuildingList(projectId?: number): Promise<BuildingListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (projectId !== undefined) params['project_id'] = projectId;
  return apiGet<BuildingListResponse>('building_list', params);
}

export async function getBuildingInspections(opts?: {
  building_id?: number;
  status?: string;
  year?: number;
  limit?: number;
  offset?: number;
}): Promise<BuildingInspectionsResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (opts?.building_id !== undefined) params['building_id'] = opts.building_id;
  if (opts?.status !== undefined) params['status'] = opts.status;
  if (opts?.year !== undefined) params['year'] = opts.year;
  if (opts?.limit !== undefined) params['limit'] = opts.limit;
  if (opts?.offset !== undefined) params['offset'] = opts.offset;
  return apiGet<BuildingInspectionsResponse>('building_inspections', params);
}
