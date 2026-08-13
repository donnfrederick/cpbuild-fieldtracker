export interface InstallTrackerTaskQueue {
  building: string;
  level: number;
  unit: string;
  area: number;
  unitType: string;
  unitId: number;
  unitByScopeId: number;
  unitPhaseName: string;
  unitStatusName: string;
  progress: number;
  taskId: number;
  taskTypeId: number;
  taskTypeName: string;
  taskStatusId: number;
  taskStatusName: string;
  phaseId: number;
  phaseName?: string | null;
  dateCreated: Date;
  createdBy: string;
  parentTaskId?: number | null;
  parentTaskTypeName?: string | null;
  parentTaskStatusName?: string | null;
  primaryWorkerName?: string | null;
  secondaryWorkerId?: number | null;
  secondaryWorkerName?: string | null;
  assignedWorkerId?: number;
  scheduledDate?: Date | null;
}
