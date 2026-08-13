import Dexie, { type Table } from 'dexie';
import type { IQueuedRequest } from './interfaces/IQueuedRequest';
import type { IWorkHourSubmission } from './interfaces/IWorkHourSubmission';
import { IStoredImage } from './interfaces/IStoredImage';
import { IUpdateUnitTaskTSV } from './interfaces/IUpdateUnitTaskTSV';
import { IUpdateUnitByScopeTSV } from './interfaces/IUpdateUnitByScopeTSV';
import { IPunchWorkTaskCreateTSV } from './interfaces/IPunchWorkTaskCreateTSV';
import { IUpdateDeficiencyTSV } from './interfaces/IUpdateDeficiencyTSV';

export class CPBuildIndexedDb extends Dexie {
  requests!: Table<IQueuedRequest, [string, string]>; // composite key
  workHourSubmission!: Table<IWorkHourSubmission, number>; // auto-increment
  images!: Table<IStoredImage, number>;
  updateUnitTaskTSV!: Table<IUpdateUnitTaskTSV, number>; // Task Submission Viewer
  updateUnitByScopeTSV!: Table<IUpdateUnitByScopeTSV, number>; // Task Submission Viewer
  punchWorkTaskCreateTSV!: Table<IPunchWorkTaskCreateTSV, number>; // Task Submission Viewer
  updateDeficiencyTSV!: Table<IUpdateDeficiencyTSV, number>; // Task Submission Viewer

  static readonly MAX_RECORDS = 500;
  static readonly TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    super('OfflineRequestQueueDB');

    this.version(1).stores({
      requests: '[url+method], timestamp, synced',
      workHourSubmission:
        '++tempId, projectId, taskId, workerId, submissionDate, synced, timestamp',
      images: '++tempId, submissionId, timestamp, synced, [submissionId+submissionLocation]',
      updateUnitTaskTSV: 'taskId, timestamp, synced',
      updateUnitByScopeTSV: 'unitId, timestamp, synced',
      punchWorkTaskCreateTSV: '++tempId, parentTaskId, timestamp, synced',
      updateDeficiencyTSV: 'deficiencyId, timestamp, synced',
    });
  }

  /**
   * Ensures a table doesn’t exceed MAX_RECORDS by removing the oldest entries.
   */
  async enforceMaxRecords<T, Key>(table: Table<T, Key>, keySelector: (item: T) => Key) {
    const count = await table.count();
    if (count > CPBuildIndexedDb.MAX_RECORDS) {
      const oldest = await table
        .orderBy('timestamp')
        .limit(count - CPBuildIndexedDb.MAX_RECORDS)
        .toArray();

      await table.bulkDelete(oldest.map(keySelector));
    }
  }

  /**
   * Cleans up stale entries based on TTL and synced flag.
   */
  async cleanupRequests() {
    const now = Date.now();
    const ttlLimit = now - CPBuildIndexedDb.TTL_MS;

    await this.requests.where('timestamp').below(ttlLimit).delete();
    await this.requests.filter((r) => r.synced === true).delete();
  }
}

export const cpBuildIndexedDb = new CPBuildIndexedDb();
