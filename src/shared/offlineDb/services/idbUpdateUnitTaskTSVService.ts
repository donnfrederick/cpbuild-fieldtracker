import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { IUpdateUnitTaskTSV } from '../interfaces/IUpdateUnitTaskTSV';
import { IdbImageService } from './idbImageService';
import { IdbUpdateDeficiencyTSVService } from './idbUpdateDeficiencyTSVService';

export class IdbUpdateUnitTaskTSVService {
  static async save(input: Omit<IUpdateUnitTaskTSV, 'timestamp' | 'synced'>): Promise<void> {
    const now = Date.now();
    await cpBuildIndexedDb.updateUnitTaskTSV.put({
      ...input,
      timestamp: now,
      synced: false,
    });

    await cpBuildIndexedDb.enforceMaxRecords(cpBuildIndexedDb.updateUnitTaskTSV, (w) => w.taskId);
  }

  static async getAllUnsyncedRecords(): Promise<IUpdateUnitTaskTSV[]> {
    return await cpBuildIndexedDb.updateUnitTaskTSV.filter((w) => w.synced === false).toArray();
  }

  static async getByTaskId(taskId: number): Promise<IUpdateUnitTaskTSV | undefined> {
    return await cpBuildIndexedDb.updateUnitTaskTSV.get(taskId);
  }

  static async getByTaskIds(taskIds: number[]): Promise<IUpdateUnitTaskTSV[]> {
    const records = await cpBuildIndexedDb.updateUnitTaskTSV.bulkGet(taskIds);
    return records.filter((r) => r !== undefined) as IUpdateUnitTaskTSV[];
  }

  static async getSyncedByTaskIds(taskIds: number[]): Promise<IUpdateUnitTaskTSV[]> {
    const records = await this.getByTaskIds(taskIds);
    return records.filter((r) => r.synced) as IUpdateUnitTaskTSV[];
  }

  static async markAsSyncedByTaskId(taskId: number): Promise<void> {
    await cpBuildIndexedDb.updateUnitTaskTSV.update(taskId, { synced: true });
  }

  static async markAsNotSyncedByTaskId(taskId: number): Promise<void> {
    await cpBuildIndexedDb.updateUnitTaskTSV.update(taskId, { synced: false });
  }

  static async deleteSyncedRecordsByTaskIdWithRelatedImage(taskId: number): Promise<void> {
    await cpBuildIndexedDb.updateUnitTaskTSV
      .where('taskId')
      .equals(taskId)
      .filter((w) => w.synced === true)
      .delete();

    await IdbImageService.deleteSyncedImageBySubmissionIdAndLocation(
      taskId,
      'field_tracker.unit_tasks',
      false
    );

    await IdbUpdateDeficiencyTSVService.deleteDeficieniesByTaskId(taskId);
  }
}
