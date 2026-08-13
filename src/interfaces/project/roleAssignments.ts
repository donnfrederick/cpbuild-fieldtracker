import type { RoleAssignmentDto } from '@/shared/service-proxies/service-proxies';
export interface RoleAssignments extends RoleAssignmentDto {
  editing: boolean;
  editingSecondaryWorker?: boolean;
}
