import { apiGet } from './client';

export interface DashboardResponse {
  success: boolean;
  project_id?: number;
  mm?: { total: number; pending: number; approved: number; completed: number };
  nea?: { total_systems: number; inspections_this_month: number };
  building?: { open: number; in_progress: number; completed: number };
  keys?: { total_inventory: number; currently_issued: number };
  notifications?: { unread: number };
  error?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export interface ProjectsListResponse {
  success: boolean;
  active_project_id?: number;
  projects?: Project[];
  error?: string;
}

export async function getDashboard(projectId?: number): Promise<DashboardResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (projectId !== undefined) params['project_id'] = projectId;
  return apiGet<DashboardResponse>('dashboard_data', params);
}

export async function getProjectsList(): Promise<ProjectsListResponse> {
  return apiGet<ProjectsListResponse>('projects_list');
}
