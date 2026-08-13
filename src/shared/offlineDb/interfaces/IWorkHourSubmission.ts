export interface IWorkHourSubmission {
  tempId?: number;
  workerId: number;
  projectByScopeId: number;
  taskId?: number;
  roleId?: number;
  quantity?: number | string;
  submitTypeId: number;
  submitTypeName: string;
  hours: number | string;
  submissionNotes: string | null;
  teamLeadId: number;
  createdBy: number;
  userRoles: string;
  timestamp?: number;
  synced?: boolean;
}
