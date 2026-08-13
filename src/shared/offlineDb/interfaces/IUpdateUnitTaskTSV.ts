import { TaskSubmissionUpdateUnitTaskDto } from '@/shared/service-proxies/service-proxies';

export interface IUpdateUnitTaskTSV {
  taskId: number;
  updateUnitTaskRequest: TaskSubmissionUpdateUnitTaskDto;
  timestamp: number;
  synced: boolean;
}
