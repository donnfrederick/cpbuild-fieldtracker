import {
  ProcessTaskSubmissionBackgroundJobDto,
  PunchWorkTaskCreateDto,
  UploadRequestDto,
} from '@/shared/service-proxies/service-proxies';
import { IdbUpdateUnitByScopeTSVService } from './idbUpdateUnitByScopeTSVService';
import { IdbImageService } from './idbImageService';
import { IdbPunchWorkTaskCreateTSVService } from './idbPunchWorkTaskCreateTSVService';
import { IdbUpdateUnitTaskTSVService } from './idbUpdateUnitTaskTSVService';
import { IdbUpdateDeficiencyTSVService } from './idbUpdateDeficiencyTSVService';

export class IdbTaskSubmissionService {
  static async prepareTaskSubmissionForSync(): Promise<ProcessTaskSubmissionBackgroundJobDto[]> {
    const items: ProcessTaskSubmissionBackgroundJobDto[] = [];

    try {
      const records = await IdbUpdateUnitTaskTSVService.getAllUnsyncedRecords();

      for (const record of records) {
        const updateUnitByScopeRequest = await IdbUpdateUnitByScopeTSVService.getByTaskId(
          record.taskId
        );
        const punchWorkTask = await IdbPunchWorkTaskCreateTSVService.getByParentTaskId(
          record.taskId
        );

        //related images for the task submission punchwork task
        const relatedImages = await IdbImageService.getAllImagesBySubmissionIdWithLocation(
          record.taskId,
          'field_tracker.unit_tasks',
          punchWorkTask != null
        );

        const deficieniesByTaskId = await IdbUpdateDeficiencyTSVService.getDeficieniesByTaskId(
          record.taskId
        );
        const deficiencies = deficieniesByTaskId?.map((e) => e.request);

        items.push({
          updateUnitTask: record.updateUnitTaskRequest ?? null,
          updateUnitByScope: updateUnitByScopeRequest?.updateUnitByScope ?? null,
          uploadRequest: relatedImages as unknown as UploadRequestDto[],
          punchWorkTaskCreate: (punchWorkTask as PunchWorkTaskCreateDto) ?? null,
          updateDeficiencies: deficiencies,
        } as ProcessTaskSubmissionBackgroundJobDto);
      }
    } catch (error) {
      console.error(
        'prepareForSync: Error in preparing data for offline syncing Task Submission Pass/Fail',
        error
      );
    }
    return items;
  }

  static async markAsSyncedByTaskIdAndUnitId(
    unitTaskId: number,
    unitId?: number,
    punchWorktempId?: number
  ): Promise<void> {
    IdbUpdateUnitTaskTSVService.markAsSyncedByTaskId(unitTaskId);
    await IdbImageService.markAsSyncedBySubmissionIdAndLocation(
      unitTaskId,
      'field_tracker.unit_tasks'
    );

    if (unitId) IdbUpdateUnitByScopeTSVService.markAsSyncedByUnitId(unitId);
    if (punchWorktempId) IdbPunchWorkTaskCreateTSVService.markAsSyncedByTempId(punchWorktempId);
  }

  static async markAsNotSyncedByTaskIdAndUnitId(
    unitTaskId: number,
    unitId?: number
  ): Promise<void> {
    IdbUpdateUnitTaskTSVService.markAsNotSyncedByTaskId(unitTaskId);
    await IdbImageService.markAsNotSyncedBySubmissionIdAndLocation(
      unitTaskId,
      'field_tracker.unit_tasks'
    );

    if (unitId) IdbUpdateUnitByScopeTSVService.markAsNotSyncedByUnitId(unitId);
  }

  static async deleteByTaskIdAndUnitId(
    unitTaskId: number,
    unitId?: number,
    punchWorktempId?: number
  ): Promise<void> {
    IdbUpdateUnitTaskTSVService.deleteSyncedRecordsByTaskIdWithRelatedImage(unitTaskId);
    if (unitId) IdbUpdateUnitByScopeTSVService.deleteSyncedRecordsByUnitId(unitId);
    if (punchWorktempId)
      IdbPunchWorkTaskCreateTSVService.deleteSyncedRecordsByTempId(punchWorktempId);
  }
}
