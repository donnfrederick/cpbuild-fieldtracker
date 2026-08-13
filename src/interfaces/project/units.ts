import type { RoleAssignments } from './roleAssignments';
import type { UnitsByScopeDto, UnitTaskDto } from '@/shared/service-proxies/service-proxies';

export interface Units extends UnitsByScopeDto {
  mainTasks: UnitTaskDto[];
  subtasks: UnitTaskDto[];
  expanded: boolean;
  roleAssignments: RoleAssignments[];
}
