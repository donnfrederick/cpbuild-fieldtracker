export interface IsIhiWorkerApiRequst {
  userId: number;
}

export interface ScopeAssignmentsApiRequest {
  workerId: number;
}

export interface ProjectLevelSubmissionTypesApiRequest {
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface WorkHourSubmissionCreateApi {
  workerId: number;
  projectByScopeId: number;
  taskId?: number;
  roleId?: number;
  quantity?: number | string;
  submitTypeId: number;
  hours: number | string;
  submissionNotes: string | null;
  teamLeadId: number;
  createdBy: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface ProjectByScopeDetailsApiRequest {
  projectByScopeId: number;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface MainTasksSubmissionsApiRequest {
  projectByScopeId: number;
  workerId: number;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface WorkHourSubmissionsProjectLevelListApiRequest {
  workerId: number;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface WorkHourSubmissionsByWorkerAndProjectScopeApiRequest {
    workerId: number,
    projectByScopeId: number,
    targetUrl?: string,
    targetMethodType?: string
}

export interface WorkHourSubmissionsUpdateApiRequest {
  workHourSubmissionId: number;
  workerId: number;
  hours?: number;
  quantity?: number;
  submissionNotes?: string;
  updatedBy: number;
}

export interface WorkHourSubmissionDeleteApiRequest {
  workHourSubmissionId: number;
  deletedBy: number;
}

export interface UnitLevelSubmissionTypesApiRequest {
  phaseByScopeId: number;
  targetUrl?: string;
  targetMethodType?: string;
}
