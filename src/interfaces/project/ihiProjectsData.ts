import { ProjectWithTasksDto } from '@/shared/service-proxies/service-proxies';

export interface IHIProjectsData extends ProjectWithTasksDto {
  expanded: boolean;
}
