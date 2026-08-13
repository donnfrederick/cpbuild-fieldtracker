import { defineStore } from 'pinia';
import { ref } from 'vue';
import { featureFlags, featureFlagsReady } from '@/config/featureFlags';
import { usePostHog } from './usePostHog';
import { SessionStorageService } from '@/util/sessionStorageService';
import type { MaskingSession } from '@/interfaces/common/maskingSession';

export const useMaskingStore = defineStore('masking', () => {
  const isMasking = ref(false);
  const postHog = usePostHog();
  const sessionStorageService = new SessionStorageService();

  const readMaskingFlag = async () => {
    // Read the masking mode feature flag from PostHog

    await featureFlagsReady;

    await postHog?.reloadFeatureFlags();

    if (featureFlags.maskingMode) {
      console.log('Masking Mode is enabled');
    } else {
      console.log('Masking Mode is disabled');
    }

    setTimeout(() => {
      readMaskingFlag();
    }, 60000);
  };

  const readMaskingSession = () => {
    console.log('Masking Session is being read');
    const maskingSession = sessionStorageService.getItem<MaskingSession>('maskingSession');

    if (featureFlags.maskingMode && maskingSession) {
      isMasking.value = true;
    } else {
      isMasking.value = false;
    }

    // Set a timeout to re-check the masking session every 5 seconds
    setTimeout(() => {
      readMaskingSession();
    }, 5000);
  };

  const startMaskMonitoring = () => {
    console.log('Monitoring has been started');
    readMaskingFlag();
    readMaskingSession();
  };

  const stopMasking = () => {
    isMasking.value = false;
    sessionStorage.removeItem('maskingSession');
  };

  const allowedRoutes = [
    'labor-manager-assigned-projects-active',
    'labor-manager-project-scope',
    'labor-manager-hours-submitted',
    'labor-manager-blocking-issue',
    'labor-manager-task-summary',
    'task-submission-viewer',
  ];

  return {
    isMasking,
    allowedRoutes,
    startMaskMonitoring,
    stopMasking,
  };
});
