import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNetworkStore = defineStore('network', () => {
  const isOffline = ref(!navigator.onLine);

  // Holds the interval ID so we can clear it later
  let interval: ReturnType<typeof setInterval> | null = null;

  // Performs an actual connectivity check using a lightweight static file
  const checkConnectivity = async () => {
    try {
      const response = await fetch('/ping.json?_=' + Date.now(), { cache: 'no-store' });
      isOffline.value = !response.ok;
    } catch (err) {
      isOffline.value = true;
      console.error('[useNetworkStore] Connectivity check failed:', err);
    }
  };

  // Sets the offline flag based on navigator.onLine
  const updateStatus = (manualTrigger?: boolean) => {
    isOffline.value = manualTrigger != null ? manualTrigger : !navigator.onLine;
    console.log('[useNetworkStore] isOffline updated:', isOffline.value);
  };

  // Defined separately so we can remove them later
  const onOnline = () => {
    updateStatus();
    checkConnectivity();
  };

  const onOffline = () => {
    updateStatus();
  };

  const startMonitoring = () => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    updateStatus();
    checkConnectivity();

    // Start polling every 30 seconds to catch network changes
    if (!interval) {
      interval = setInterval(checkConnectivity, 30000);
    }
  };

  const stopMonitoring = () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);

    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  return {
    isOffline,
    updateStatus,
    startMonitoring,
    stopMonitoring,
  };
});
