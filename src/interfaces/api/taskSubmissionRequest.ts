export interface ClearInspectionChecklistUpdateApiRequest {
  itemId: number;
  isChecked: boolean;
  updatedBy: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface ClearInspectionDeficiencyLevelTypesApiRequest {
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface SubmittedHoursListApiRequest {
  unitTaskId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface UnitLevelProjectSubmissionsApiRequest {
  workerId: number;
  taskId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface RoleAssignmentsApiRequest {
  scopeTypeId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface EligibleWorkersListApiRequest {
  scopeTypeId: number;
  roleIds: string;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}
