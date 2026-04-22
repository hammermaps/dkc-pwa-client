import { apiGet, apiPost, apiDelete } from './client';

export interface LoginRequest {
  username: string;
  password: string;
  token_name?: string;
  ttl_days?: number;
}

export interface UserInfo {
  id: number;
  username: string;
  vname: string;
  nname: string;
  email: string;
  is_admin: boolean;
  active_project_id?: number;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  token_type?: string;
  expires_at?: string;
  user?: UserInfo;
  error?: string;
}

export interface AuthStatusResponse {
  success: boolean;
  authenticated: boolean;
  user?: UserInfo;
  error?: string;
}

export interface UserInfoResponse {
  success: boolean;
  user?: UserInfo & { active_project_id?: number };
  permissions?: Record<string, boolean>;
  error?: string;
}

export interface TokenInfo {
  id: number;
  name: string;
  expires_at: string | null;
  last_used_at: string | null;
  last_ip: string | null;
  created_at: string;
}

export interface UserTokensResponse {
  success: boolean;
  tokens?: TokenInfo[];
  error?: string;
}

const TOKEN_NAME = (import.meta.env.VITE_TOKEN_NAME as string) ?? 'DKC PWA';
const TOKEN_TTL = Number(import.meta.env.VITE_TOKEN_TTL_DAYS ?? 30);

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('auth_login', {
    username,
    password,
    token_name: TOKEN_NAME,
    ttl_days: TOKEN_TTL,
  });
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
  return apiPost('auth_logout');
}

export async function getAuthStatus(): Promise<AuthStatusResponse> {
  return apiGet<AuthStatusResponse>('auth_status');
}

export async function getUserInfo(): Promise<UserInfoResponse> {
  return apiGet<UserInfoResponse>('user_info');
}

export async function listTokens(): Promise<UserTokensResponse> {
  return apiGet<UserTokensResponse>('user_tokens_list');
}

export async function deleteToken(tokenId: number): Promise<{ success: boolean; message?: string }> {
  return apiDelete('user_token_delete', { token_id: tokenId });
}
