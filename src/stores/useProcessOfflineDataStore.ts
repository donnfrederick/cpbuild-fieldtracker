import { defineStore } from 'pinia';
import { IdbWorkHourSubmissionLogService } from '@/shared/offlineDb/services/idbWorkHourSubmissionLogService';
import {
  OfflineWorkHourSubmissionRequestDto,
  ProcessTaskSubmissionBackgroundJobDto,
  TaskSubmissionViewerServiceProxy,
} from '@/shared/service-proxies/service-proxies';
import { localStorageHelper } from '@/util/localStorageHelper';
import { notificationService } from '@/services/notificationService';
import { SessionStorageService } from '@/util/sessionStorageService';
import { NotificationType } from '@/enum/notification/notificationType';
import { NotificationMessage } from '@/interfaces/notification/notificationMessage';
import { NotificationEventTypeEnum } from '@/enum/notification/notificationEventTypeEnum';
import { IdbTaskSubmissionService } from '@/shared/offlineDb/services/idbTaskSubmissionService';
import { useNotificationStore } from './useNotificationStore';

const sessionStorageService = new SessionStorageService();

export const useProcessOfflineDataStore = defineStore('processOfflineData', {
  state: () => ({
    lastSync: null as Date | null,
    error: null as string | null,
    currentUserId: localStorageHelper<number>('userId').get(),
    taskSubmissionViewerServiceProxy: new TaskSubmissionViewerServiceProxy(),
    isSyncOfflineWorkHourRecords:
      localStorageHelper<boolean>('syncOfflineWorkHourRecords').get() ?? false,
    isSyncOfflineTaskSubmissions:
      localStorageHelper<boolean>('syncOfflineTaskSubmissions').get() ?? false,
    notificationStore: useNotificationStore(),
  }),
  getters: {
    notificationStore: () => useNotificationStore(),
  },
  actions: {
    async initNotificationService() {
      try {
        await notificationService.init();
        console.log('🔔 Notifications initialized globally');
        notificationService.onMessage((notification: NotificationMessage) => {
          // Don't show toast for bulk creation progress updates
          if (notification.eventType !== NotificationEventTypeEnum.ProjectRowBulkCreation) {
            this.notificationStore.showNotification(notification);
          }
          this.handleNotificationMessage(notification);
        });

        await this.syncOfflineWorkHourRecords();
        await this.syncOfflineTasksubmissions();
      } catch (err) {
        console.error('❌ Failed to initialize notifications', err);
      }
    },

    async syncOfflineWorkHourRecords() {
      if (this.isSyncOfflineWorkHourRecords) return;
      try {
        const records: OfflineWorkHourSubmissionRequestDto[] =
          await IdbWorkHourSubmissionLogService.getOfflineSavedWorkHourSubmissionForSyncing();
        if (records.length > 0) {
          sessionStorageService.setItem<boolean>('syncOfflineWorkHourRecords', true);
          await this.taskSubmissionViewerServiceProxy
            .syncOfflineWorkHourSubmissions(Number(this.currentUserId), records)
            .then(async () => {
              await Promise.all(
                records.map((record) => IdbWorkHourSubmissionLogService.markAsSynced(record.tempId))
              );
            });
        }
        this.lastSync = new Date();
      } catch (e: any) {
        this.error = e.message || 'Sync failed.';
      }
    },
    async syncOfflineTasksubmissions(): Promise<void> {
      if (this.isSyncOfflineTaskSubmissions) return;

      const records = await IdbTaskSubmissionService.prepareTaskSubmissionForSync();

      if (records.length > 0) {
        localStorageHelper<boolean>('syncOfflineTaskSubmissions').set(true);

        await Promise.all(
          records.map((record) => {
            IdbTaskSubmissionService.markAsSyncedByTaskIdAndUnitId(
              record.updateUnitTask.unitTaskId,
              record.updateUnitByScope?.unitId,
              record.punchWorkTaskCreate?.tempId
            );
          })
        );

        await this.taskSubmissionViewerServiceProxy.processTaskSubmissionBackgroundJob(
          Number(this.currentUserId),
          records
        );
      }
    },

    handleNotificationMessage(notification: NotificationMessage) {
      switch (notification.eventType) {
        case NotificationEventTypeEnum.WorkHourSubmission:
          {
            switch (notification.type) {
              case NotificationType.Success:
                IdbWorkHourSubmissionLogService.deleteSyncedRecordsByTempId(
                  (notification.payload as any).tempId
                );
                break;

              case NotificationType.Error:
                IdbWorkHourSubmissionLogService.markAsNotSynced(
                  (notification.payload as any).tempId
                );
                break;
            }

            localStorageHelper<boolean>('syncOfflineWorkHourRecords').set(false);
          }
          break;

        case NotificationEventTypeEnum.TaskSubmission:
          {
            const payload = notification.payload as ProcessTaskSubmissionBackgroundJobDto;
            switch (notification.type) {
              case NotificationType.Success:
                IdbTaskSubmissionService.deleteByTaskIdAndUnitId(
                  payload.updateUnitTask.unitTaskId,
                  payload.updateUnitByScope?.unitId,
                  payload.punchWorkTaskCreate?.tempId
                );
                break;

              case NotificationType.Error:
                IdbTaskSubmissionService.markAsNotSyncedByTaskIdAndUnitId(
                  payload.updateUnitTask.unitTaskId,
                  payload.updateUnitByScope?.unitId
                );
                break;
            }

            localStorageHelper<boolean>('syncOfflineTaskSubmissions').set(false);
          }
          break;
      }
    },
  },
});
