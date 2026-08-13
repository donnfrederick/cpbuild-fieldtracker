import { PunchWorkTaskCreateDto } from '@/shared/service-proxies/service-proxies';

export interface IPunchWorkTaskCreateTSV extends PunchWorkTaskCreateDto {
  timestamp: number;
  synced: boolean;
}
