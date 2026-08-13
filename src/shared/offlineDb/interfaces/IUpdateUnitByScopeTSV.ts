import { TasksubmissionUpdateUnitByScopeDto } from '@/shared/service-proxies/service-proxies';

export interface IUpdateUnitByScopeTSV {
  unitId: number;
  updateUnitByScope: TasksubmissionUpdateUnitByScopeDto;
  timestamp: number;
  synced: boolean;
}
