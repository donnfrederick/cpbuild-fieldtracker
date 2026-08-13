export interface UnitTask {
  id: number;
  unitByScopeId: number;
  parentTaskId?: number;
  taskTypeId: number;
  phaseId: number;
  statusId: number;
  assignedWorkerId?: number;
  scheduledDate?: string;
  scheduledBy?: number;
  submittedAt?: string;
  submittedBy?: number;
  submissionNotes?: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  taskDetails?: string;
  imageAcknowledgment: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
  deletedAt?: string;
  deletedBy?: number;
}
