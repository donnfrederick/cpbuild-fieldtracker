export interface UnitTaskUpdateApiRequest {
  unitTaskId: number;
  statusId: number;
  assignedWorkerId?: number;
  scheduledDate?: Date;
  scheduledBy?: number;
  submittedAt?: Date;
  submittedBy?: number;
  submissionNotes?: string | null;
  reviewedAt?: Date;
  reviewedBy?: number;
  reviewNotes?: string | null;
  taskDetails?: string;
  imageAcknowledgement?: number | boolean;
  updatedBy: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface UnitByScopeUpdateApiRequest {
  unitId: number;
  newPhaseId: number;
  statusId: number;
  completionDate: string | null;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface TeamLeadActiveIHIProjectApiRequest {
  teamLeadId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface UnitDataApiRequest {
  unitByScopeId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface UnitsInfoListApiRequest {
  projectByScopeId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface UnitsDetailsApiRequest {
  unitTaskId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface ActiveWorkersByScopeApiRequest {
  scopeTypeId: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface UnitLevelSubtaskTypesApiRequest {
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}

export interface ParentChildPunchTaskCreateApiRequest {
  parentTaskId: number;
  unitByScopeId: number;
  statusId: number;
  assignedWorkerId: number;
  taskDetails: string;
  createChecklist: boolean;
  createdBy: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
  rootMainTaskId?: number | null;
}

export interface UpdateUnitsByScopeApiRequest {
  completionDate: string | null;
  newPhaseId: number;
  statusId: number;
  updatedBy: number;
}
