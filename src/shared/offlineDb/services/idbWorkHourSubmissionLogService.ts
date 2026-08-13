import type {
  OfflineWorkHourSubmissionRequestDto,
  TaskSubmissionViewerWorkHourSubmissionDto,
  UploadRequestDto,
} from '@/shared/service-proxies/service-proxies';
import type { IWorkHourSubmission } from '../interfaces/IWorkHourSubmission';
import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { IdbImageService } from './idbImageService';

export class IdbWorkHourSubmissionLogService {
  static async save(
    submission: Omit<IWorkHourSubmission, 'tempId' | 'timestamp' | 'synced'>
  ): Promise<number> {
    const now = Date.now();
    const tempId = await cpBuildIndexedDb.workHourSubmission.put({
      ...submission,
      tempId: undefined, // let Dexie auto-increment
      timestamp: now,
      synced: false,
    });

    await cpBuildIndexedDb.enforceMaxRecords(
      cpBuildIndexedDb.workHourSubmission,
      (w) => w.tempId ?? 0
    );

    return tempId;
  }

  static async edit(
    submission: Pick<IWorkHourSubmission, 'tempId'> & Partial<IWorkHourSubmission>
  ): Promise<void> {
    if (!submission.tempId) {
      throw new Error('tempId is required to edit a work hour submission');
    }

    // Fetch the existing record
    const existing = await cpBuildIndexedDb.workHourSubmission.get(submission.tempId);

    if (!existing) {
      throw new Error(`Work hour submission with tempId ${submission.tempId} does not exist`);
    }

    if (existing.synced) {
      throw new Error(
        `Work hour submission with tempId ${submission.tempId} is already synced and cannot be edited`
      );
    }

    await cpBuildIndexedDb.workHourSubmission.update(submission.tempId, {
      ...existing, // preserve other fields
      ...submission, // override updated fields
      timestamp: Date.now(), // refresh last updated time
      synced: false, // remain unsynced until re-synced
    });
  }

  static async markAsSynced(tempId: number): Promise<void> {
    await cpBuildIndexedDb.workHourSubmission.update(tempId, { synced: true });

    await IdbImageService.markAsSyncedBySubmissionIdAndLocation(
      tempId,
      'field_tracker.work_hour_submissions'
    );
  }

  static async markAsNotSynced(tempId: number): Promise<void> {
    await cpBuildIndexedDb.workHourSubmission.update(tempId, { synced: false });

    await IdbImageService.markAsNotSyncedBySubmissionIdAndLocation(
      tempId,
      'field_tracker.work_hour_submissions'
    );
  }

  static async markAllAsNotSynced(): Promise<void> {
    await cpBuildIndexedDb.workHourSubmission.toCollection().modify({ synced: false });
  }

  static async getUnsynced(): Promise<IWorkHourSubmission[]> {
    return cpBuildIndexedDb.workHourSubmission.filter((w) => w.synced === false).toArray();
  }

  /**
   * Delete all records where synced is true by tempId
   */
  static async deleteSyncedRecordsByTempId(tempId: number): Promise<void> {
    await cpBuildIndexedDb.workHourSubmission.where('tempId').equals(tempId).delete();

    await IdbImageService.deleteSyncedImageBySubmissionIdAndLocation(
      tempId,
      'field_tracker.work_hour_submissions'
    );
  }

  /**
   * Delete all records where synced is true
   */
  static async deleteSyncedRecords(): Promise<void> {
    await cpBuildIndexedDb.workHourSubmission.where('synced').equals(1).delete();
  }

  /**
   * Get all submissions by taskId
   */
  static async getOfflineSavedWorkHourSubmissionByTaskId(
    taskId: number
  ): Promise<TaskSubmissionViewerWorkHourSubmissionDto[]> {
    const result = [] as TaskSubmissionViewerWorkHourSubmissionDto[];
    const records = await cpBuildIndexedDb.workHourSubmission
      .where('taskId')
      .equals(taskId)
      .filter((w) => w.synced === false)
      .toArray();

    records.forEach((record: IWorkHourSubmission) => {
      const date = new Date(record.timestamp ?? Date.now());
      const formatted = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
        .getDate()
        .toString()
        .padStart(2, '0')}-${date.getFullYear()}`;

      const hrs = Math.floor(Number(record.hours));
      const mins = Math.round((Number(record.hours) - hrs) * 60);
      const hoursText = `${hrs} hrs. ${mins} min.`;
      const hoursArray = [hrs, mins];
      result.push({
        id: record.tempId ?? 0,
        submissionDate: formatted,
        submitTypeName: record.submitTypeName + ' (Offline)',
        quantity: record.quantity ?? 0,
        hours: Number(record.hours),
        hoursText,
        submissionNotes: record.submissionNotes,
        hoursArray,
      } as TaskSubmissionViewerWorkHourSubmissionDto);
    });

    return result;
  }

  /**
   * Get all submissions
   */
  static async getOfflineSavedWorkHourSubmissionForSyncing(): Promise<
    OfflineWorkHourSubmissionRequestDto[]
  > {
    const records = await cpBuildIndexedDb.workHourSubmission
      .filter((w) => w.synced === false)
      .toArray();

    const result = await Promise.all(
      records
        .filter(
          (record): record is IWorkHourSubmission & { tempId: number | string } =>
            record.tempId != null
        )
        .map(async (record) => {
          const date = new Date(record.timestamp ?? Date.now());
          const formatted = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
            .getDate()
            .toString()
            .padStart(2, '0')}-${date.getFullYear()}`;

          const getRelatedImages = await IdbImageService.getAllImagesBySubmissionIdWithLocation(
            record.tempId,
            'field_tracker.work_hour_submissions'
          );

          return {
            createdBy: record.createdBy,
            hours: record.hours,
            projectByScopeId: record.projectByScopeId,
            submissionNotes: record.submissionNotes,
            submitTypeId: record.submitTypeId,
            taskId: record.taskId,
            teamLeadId: record.teamLeadId,
            tempId: record.tempId,
            workerId: record.workerId,
            quantity: record.quantity ? Number(record.quantity) : 0,
            roleId: record.roleId,
            timeStamp: formatted,
            uploadRequest: getRelatedImages as unknown as UploadRequestDto[],
          } as OfflineWorkHourSubmissionRequestDto;
        })
    );

    return result;
  }
}
