export interface UnreviewedWorkHourSubmissionsData {
  id: number;
  projectByScopeId: number;
  scopeTypeId: number;
  scopeTypeName: string;
  workerId: number;
  workerName: string;
  taskId: number;
  workerRoleTypeId: number;
  workerRoleTypeName: string;
  workHourSubmissionTypeId: number;
  workHourSubmissionTypeName: string;
  workHourSubmissionStatusTypeId: number;
  workHourSubmissionStatusTypeName: string;
  hours: number;
  hours_override: number;
  quantity: number;
  quantity_override: number;
}
