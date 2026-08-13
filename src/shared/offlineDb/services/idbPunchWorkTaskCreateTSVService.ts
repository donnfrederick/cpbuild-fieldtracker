import { PunchWorkTaskCreateDto } from '@/shared/service-proxies/service-proxies';
import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { IPunchWorkTaskCreateTSV } from '../interfaces/IPunchWorkTaskCreateTSV';
import { IdbImageService } from './idbImageService';

export class IdbPunchWorkTaskCreateTSVService {
  static async save(input: PunchWorkTaskCreateDto): Promise<number> {
    const now = Date.now();

    const existing = await cpBuildIndexedDb.punchWorkTaskCreateTSV
      .where('parentTaskId')
      .equals(input.parentTaskId)
      .first();

    let id: number;

    if (existing) {
      await cpBuildIndexedDb.punchWorkTaskCreateTSV.update(Number(existing.tempId), {
        ...existing,
        ...input,
        timestamp: now,
        synced: false,
      });
      id = Number(existing.tempId);
    } else {
      id = await cpBuildIndexedDb.punchWorkTaskCreateTSV.put({
        ...input,
        timestamp: now,
        synced: false,
      } as IPunchWorkTaskCreateTSV);
    }

    await cpBuildIndexedDb.enforceMaxRecords(
      cpBuildIndexedDb.punchWorkTaskCreateTSV,
      (w) => w.tempId ?? 0
    );

    return id;
  }

  static async getAllUnsyncedRecords(): Promise<IPunchWorkTaskCreateTSV[]> {
    return await cpBuildIndexedDb.punchWorkTaskCreateTSV
      .filter((w) => w.synced === false)
      .toArray();
  }
  static async getByTempId(tempId: number): Promise<IPunchWorkTaskCreateTSV | null> {
    return (await cpBuildIndexedDb.punchWorkTaskCreateTSV.get(tempId)) ?? null;
  }

  static async getByParentTaskId(parentTaskId: number): Promise<IPunchWorkTaskCreateTSV | null> {
    return (
      (await cpBuildIndexedDb.punchWorkTaskCreateTSV
        .filter((w) => w.parentTaskId === parentTaskId)
        .first()) ?? null
    );
  }

  static async markAsSyncedByTempId(tempId: number): Promise<void> {
    await cpBuildIndexedDb.punchWorkTaskCreateTSV.update(tempId, { synced: true });
  }

  static async markAsNotSyncedByTempId(tempId: number): Promise<void> {
    await cpBuildIndexedDb.punchWorkTaskCreateTSV.update(tempId, { synced: false });
  }

  static async deleteRecordByParentTaskId(parentTaskId: number): Promise<void> {
    const punchWorkTask = await this.getByParentTaskId(parentTaskId);
    if (!punchWorkTask) return;

    const tempId = Number(punchWorkTask.tempId);
    await cpBuildIndexedDb.punchWorkTaskCreateTSV.where('tempId').equals(tempId).delete();
    await IdbImageService.deleteUnSyncedImageBySubmissionIdAndLocation(
      tempId,
      'field_tracker.unit_tasks',
      true
    );
  }

  static async deleteSyncedRecordsByTempId(tempId: number): Promise<void> {
    await cpBuildIndexedDb.punchWorkTaskCreateTSV
      .where('tempId')
      .equals(tempId)
      .filter((w) => w.synced === true)
      .delete();

    await IdbImageService.deleteSyncedImageBySubmissionIdAndLocation(
      tempId,
      'field_tracker.unit_tasks',
      true
    );
  }
}
