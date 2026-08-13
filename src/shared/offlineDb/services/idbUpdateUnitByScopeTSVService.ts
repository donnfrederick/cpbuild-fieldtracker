import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { IUpdateUnitByScopeTSV } from '../interfaces/IUpdateUnitByScopeTSV';

export class IdbUpdateUnitByScopeTSVService {
  static async save(input: Omit<IUpdateUnitByScopeTSV, 'timestamp' | 'synced'>): Promise<void> {
    const now = Date.now();
    await cpBuildIndexedDb.updateUnitByScopeTSV.put({
      ...input,
      timestamp: now,
      synced: false,
    });

    await cpBuildIndexedDb.enforceMaxRecords(
      cpBuildIndexedDb.updateUnitByScopeTSV,
      (w) => w.unitId
    );
  }

  static async getAllUnsyncedRecords(): Promise<IUpdateUnitByScopeTSV[]> {
    return await cpBuildIndexedDb.updateUnitByScopeTSV.filter((w) => w.synced === false).toArray();
  }

  static async getByTaskId(taskId: number): Promise<IUpdateUnitByScopeTSV | null> {
    return (
      (await cpBuildIndexedDb.updateUnitByScopeTSV
        .filter((e) => e.updateUnitByScope.taskId === taskId)
        .first()) ?? null
    );
  }

  static async markAsSyncedByUnitId(unitId: number): Promise<void> {
    await cpBuildIndexedDb.updateUnitByScopeTSV.update(unitId, { synced: true });
  }

  static async markAsNotSyncedByUnitId(unitId: number): Promise<void> {
    await cpBuildIndexedDb.updateUnitByScopeTSV.update(unitId, { synced: false });
  }

  static async deleteSyncedRecordsByUnitId(unitId: number): Promise<void> {
    await cpBuildIndexedDb.updateUnitByScopeTSV
      .where('unitId')
      .equals(unitId)
      .filter((w) => w.synced === true)
      .delete();
  }
}
