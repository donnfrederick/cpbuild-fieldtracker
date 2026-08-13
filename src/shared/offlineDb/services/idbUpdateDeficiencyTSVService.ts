import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { IUpdateDeficiencyTSV } from '../interfaces/IUpdateDeficiencyTSV';

export class IdbUpdateDeficiencyTSVService {
  static async save(input: Omit<IUpdateDeficiencyTSV, 'timestamp' | 'synced'>): Promise<void> {
    const now = Date.now();
    await cpBuildIndexedDb.updateDeficiencyTSV.put({
      ...input,
      timestamp: now,
      synced: false,
    });

    await cpBuildIndexedDb.enforceMaxRecords(
      cpBuildIndexedDb.updateDeficiencyTSV,
      (w) => w.deficiencyId
    );
  }

  static async getAllUnsyncedRecordsByDeficiencyIds(
    ids: number[]
  ): Promise<IUpdateDeficiencyTSV[]> {
    return await cpBuildIndexedDb.updateDeficiencyTSV
      .filter((e) => e.synced === false && ids.includes(e.deficiencyId))
      .toArray();
  }

  static async getDeficieniesByTaskId(taskId: number): Promise<IUpdateDeficiencyTSV[] | undefined> {
    return await cpBuildIndexedDb.updateDeficiencyTSV
      .filter((e) => e.synced === false && e.request.taskId == taskId)
      .toArray();
  }

  static async getByDeficiencyId(deficiencyId: number): Promise<IUpdateDeficiencyTSV | undefined> {
    return await cpBuildIndexedDb.updateDeficiencyTSV.get(deficiencyId);
  }

  static async markAsSyncedBy(deficiencyId: number): Promise<void> {
    await cpBuildIndexedDb.updateDeficiencyTSV.update(deficiencyId, { synced: true });
  }

  static async markAsNotSyncedBy(deficiencyId: number): Promise<void> {
    await cpBuildIndexedDb.updateDeficiencyTSV.update(deficiencyId, { synced: false });
  }

  static async deleteDeficieniesByTaskId(taskId: number): Promise<void> {
    await cpBuildIndexedDb.updateDeficiencyTSV
      .filter((e) => e.synced === false && e.request.taskId == taskId)
      .delete();
  }
}
