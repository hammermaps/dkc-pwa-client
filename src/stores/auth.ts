import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, logout as apiLogout, getAuthStatus, getUserInfo } from '../api/auth';
import type { UserInfo } from '../api/auth';
import { db } from '../db';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('dkc_token'));
  const user = ref<UserInfo | null>(null);
  const permissions = ref<Record<string, boolean>>({});
  const activeProjectId = ref<number | null>(null);
  const isLoading = ref(false);
  const loginError = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.is_admin ?? false);

  function hasPermission(perm: string): boolean {
    if (isAdmin.value) return true;
    return permissions.value[perm] ?? false;
  }

  async function login(username: string, password: string): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;
    try {
      const res = await apiLogin(username, password);
      if (res.success && res.token && res.user) {
        token.value = res.token;
        user.value = res.user;
        localStorage.setItem('dkc_token', res.token);
        if (res.user.active_project_id) {
          activeProjectId.value = res.user.active_project_id;
        }
        await loadPermissions();
        return true;
      } else {
        loginError.value = res.error ?? 'Anmeldung fehlgeschlagen';
        return false;
      }
    } catch (err) {
      loginError.value = err instanceof Error ? err.message : 'Netzwerkfehler';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiLogout();
    } catch {
      // Ignore errors on logout
    } finally {
      token.value = null;
      user.value = null;
      permissions.value = {};
      localStorage.removeItem('dkc_token');
      // Clear IndexedDB user cache
      await db.userCache.clear();
    }
  }

  async function checkAuth(): Promise<boolean> {
    if (!token.value) {
      // Try to restore from IndexedDB
      const cached = await db.userCache.get('current');
      if (cached) {
        user.value = cached.user;
        permissions.value = cached.permissions;
        activeProjectId.value = cached.active_project_id;
        return true;
      }
      return false;
    }
    try {
      const res = await getAuthStatus();
      if (res.success && res.authenticated && res.user) {
        user.value = res.user;
        return true;
      } else {
        await logout();
        return false;
      }
    } catch {
      // Network error – try offline cache
      const cached = await db.userCache.get('current');
      if (cached) {
        user.value = cached.user;
        permissions.value = cached.permissions;
        activeProjectId.value = cached.active_project_id;
        return true;
      }
      return false;
    }
  }

  async function loadPermissions(): Promise<void> {
    try {
      const res = await getUserInfo();
      if (res.success && res.user && res.permissions) {
        user.value = res.user;
        permissions.value = res.permissions;
        if (res.user.active_project_id) {
          activeProjectId.value = res.user.active_project_id;
        }
        // Cache in IndexedDB for offline access
        await db.userCache.put({
          id: 'current',
          user: res.user,
          permissions: res.permissions,
          active_project_id: res.user.active_project_id ?? null,
          cached_at: Date.now(),
        });
      }
    } catch {
      // Non-fatal: permissions may already be set from cache
    }
  }

  return {
    token,
    user,
    permissions,
    activeProjectId,
    isLoading,
    loginError,
    isAuthenticated,
    isAdmin,
    hasPermission,
    login,
    logout,
    checkAuth,
    loadPermissions,
  };
});
