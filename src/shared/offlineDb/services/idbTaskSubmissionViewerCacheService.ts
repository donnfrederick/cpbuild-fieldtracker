import type { TaskSubmissionViewerDto } from '../../service-proxies/service-proxies';
import { cpBuildIndexedDb } from '../CPBuildIndexedDb';

export class IdbTaskSubmissionViewerCacheService {
  /**
   * Save one or multiple TaskSubmissionViewerDto records into the request cache
   */
  static async saveFromSummary(
    summaryResponse: TaskSubmissionViewerDto | TaskSubmissionViewerDto[]
  ): Promise<void> {
    const records = Array.isArray(summaryResponse) ? summaryResponse : [summaryResponse];

    for (const record of records) {
      if (!record?.taskId) continue;

      const taskId = record.taskId;
      const requestKey = `${
        import.meta.env.VITE_API_BASE_URL_V2
      }/TaskSubmissionViewer/GetTaskSubmissionViewerDetails?taskId=${taskId}`;

      await cpBuildIndexedDb.requests.put({
        url: requestKey,
        method: 'GET',
        headers: {},
        body: null,
        response: record,
        statusCode: 200,
        timestamp: Date.now(),
        synced: false,
      });

      if (record.taskDetail.workHourSubmissionTypes.length > 0) {
        const workHourSubmissionTypesKey = `${
          import.meta.env.VITE_API_BASE_URL_V2
        }/TaskSubmissionViewer/GetUnitLevelWorkHourSubmissionTypesByPhaseId?phaseId=${
          record.taskDetail.phaseId
        }`;

        await cpBuildIndexedDb.requests.put({
          url: workHourSubmissionTypesKey,
          method: 'GET',
          headers: {},
          body: null,
          response: record.taskDetail.workHourSubmissionTypes,
          statusCode: 200,
          timestamp: Date.now(),
          synced: false,
        });
      }

      if (record.workHourSubmissionsLogs.length > 0) {
        const getTaskSubmissionViewerDetailsKey = `${
          import.meta.env.VITE_API_BASE_URL_V2
        }/TaskSubmissionViewer/GetWorkHourSubmissions?taskId=${taskId}`;

        await cpBuildIndexedDb.requests.put({
          url: getTaskSubmissionViewerDetailsKey,
          method: 'GET',
          headers: {},
          body: null,
          response: record.workHourSubmissionsLogs,
          statusCode: 200,
          timestamp: Date.now(),
          synced: false,
        });
      }

      // Enforce record limits
      await cpBuildIndexedDb.enforceMaxRecords(
        cpBuildIndexedDb.requests,
        (r) => [r.url, r.method] as [string, string]
      );
    }
  }

  /**
   * Get cached response for a specific taskId
   */
  static async getByTaskId(taskId: number): Promise<TaskSubmissionViewerDto | undefined> {
    const requestKey = `${
      import.meta.env.VITE_API_BASE_URL_V2
    }/TaskSubmissionViewer/GetTaskSubmissionViewerDetails?taskId=${taskId}`;

    const cached = await cpBuildIndexedDb.requests.get([requestKey, 'GET']);
    return cached?.response as TaskSubmissionViewerDto | undefined;
  }

  /**
   * Mark cached response as synced
   */
  static async markAsSynced(taskId: number): Promise<void> {
    const requestKey = `${
      import.meta.env.VITE_API_BASE_URL_V2
    }/TaskSubmissionViewer/GetTaskSubmissionViewerDetails?taskId=${taskId}`;

    await cpBuildIndexedDb.requests.update([requestKey, 'GET'], { synced: true });
  }
}
