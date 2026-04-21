import { ref, onMounted, onUnmounted } from 'vue';

export function useNetwork() {
  const isOnline = ref(navigator.onLine);
  const isCheckingConnectivity = ref(false);

  function handleOnline() {
    isOnline.value = true;
  }

  function handleOffline() {
    isOnline.value = false;
  }

  async function checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      isOnline.value = false;
      return false;
    }

    isCheckingConnectivity.value = true;
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
      const res = await fetch(`${apiBase}/api.php?action=auth_status`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });
      isOnline.value = res.ok || res.status === 401;
    } catch {
      isOnline.value = false;
    } finally {
      isCheckingConnectivity.value = false;
    }

    return isOnline.value;
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  });

  return {
    isOnline,
    isCheckingConnectivity,
    checkConnectivity,
  };
}
