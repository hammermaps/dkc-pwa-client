import { apiGet } from './client';

export interface MmMessage {
  uid: string;
  status: number;
  betreff: string;
  street: string;
  whg: string;
  melder: string;
  datetime: string;
  dringlichkeit: string;
  nachunternehmer: string | null;
  scanned: boolean;
  zugeh: string;
}

export interface MmDetail extends MmMessage {
  meldung_massage: string;
  apleona: string | null;
  folge: string | null;
  tel: string;
  email: string;
  ekpreis: string;
  klausel: boolean;
  zeit: number;
  planon: string | null;
  instructions: unknown[];
}

export interface MmListResponse {
  success: boolean;
  total?: number;
  limit?: number;
  offset?: number;
  messages?: MmMessage[];
  error?: string;
}

export interface MmDetailResponse {
  success: boolean;
  message?: MmDetail;
  error?: string;
}

export async function getMmList(opts?: {
  status?: number;
  street?: string;
  limit?: number;
  offset?: number;
}): Promise<MmListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (opts?.status !== undefined) params['status'] = opts.status;
  if (opts?.street !== undefined) params['street'] = opts.street;
  if (opts?.limit !== undefined) params['limit'] = opts.limit;
  if (opts?.offset !== undefined) params['offset'] = opts.offset;
  return apiGet<MmListResponse>('mm_list', params);
}

export async function getMmDetail(uid: string): Promise<MmDetailResponse> {
  return apiGet<MmDetailResponse>('mm_detail', { uid });
}
