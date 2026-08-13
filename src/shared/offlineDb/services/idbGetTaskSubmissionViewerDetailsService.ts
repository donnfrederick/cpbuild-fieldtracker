import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { CurrentUnitDto } from '@/shared/service-proxies/service-proxies';

const baseUrlApiV2 = import.meta.env.VITE_API_V2_BASE_URL as string;

export class IdbGetTaskSubmissionViewerDetailsService {
  static async getDetails(taskId: number): Promise<CurrentUnitDto> {
    const requests = await cpBuildIndexedDb.requests.toArray();

    const taskDetails = requests.find(
      (request) =>
        request.url ===
        `${baseUrlApiV2}/TaskSubmissionViewer/GetTaskSubmissionViewerDetails?taskId=${taskId}`
    );

    if (taskDetails != null) {
      return taskDetails.response.currentUnit;
    } else return {} as CurrentUnitDto;
  }
}
