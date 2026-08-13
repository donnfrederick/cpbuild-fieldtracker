<script setup lang="ts">
  import 'bootstrap/dist/css/bootstrap.min.css';
  import 'bootstrap-icons/font/bootstrap-icons.css';
  import { RouterView } from 'vue-router';

  import { watch, watchEffect } from 'vue';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { useProcessOfflineDataStore } from '@/stores/useProcessOfflineDataStore';
  import { useAuthStore } from './stores/useAuthStore';
  import { notificationService } from './services/notificationService';
  import { tsvOfflineEditLock } from './services/tsvOfflineEditLockManager';
  import { Locks } from './interfaces/common/tsvLockEntry';

  const networkStore = useNetworkStore();
  const processOfflineDataStore = useProcessOfflineDataStore();
  const authStore = useAuthStore();

  networkStore.startMonitoring();

  // 🔁 Run sync whenever SignalR connects or reconnects
  notificationService.onConnected(async () => {
    await processOfflineDataStore.syncOfflineWorkHourRecords();
    if (tsvOfflineEditLock.isAnyEditing()) {
      console.warn('Skipping offline sync because an offline edit lock is active in another tab.');
      return;
    }

    await processOfflineDataStore.syncOfflineTasksubmissions();
  });

  tsvOfflineEditLock.onChange(async (locks: Locks) => {
    if (Object.keys(locks).length === 0) {
      console.log('No active offline editors. Attempting to sync queued offline records.');
      try {
        await processOfflineDataStore.syncOfflineTasksubmissions();
      } catch (err) {
        console.error('Background sync after editor release failed:', err);
      }
    }
  });

  watch(
    () => networkStore.isOffline,
    async (isOffline) => {
      if (!isOffline) {
        tsvOfflineEditLock.startExpiryCountdown();
        await notificationService.forceReconnect(); // ✅ restart SignalR if needed
      }
    }
  );

  watch(
    () => authStore.isUserInfoLoaded,
    async (isUserInfoLoaded) => {
      if (isUserInfoLoaded) {
        await processOfflineDataStore.initNotificationService();
      }
    }
  );

  watchEffect(() => {
    if (networkStore) {
      console.log(`🌐 Network status changed: ${networkStore.isOffline ? 'Offline' : 'Online'}`);
    }
  });
</script>

<template>
  <div id="vue-app">
    <router-view />
  </div>
</template>
