import { UpdateDeficiencyDto } from '@/shared/service-proxies/service-proxies';

export interface IUpdateDeficiencyTSV {
  deficiencyId: number;
  request: UpdateDeficiencyDto;
  timestamp: number;
  synced: boolean;
}
