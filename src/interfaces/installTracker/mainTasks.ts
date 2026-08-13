export interface MainTasks {
  taskId: number;
  unitId: number;
  building: string;
  level: string;
  unit: string;
  area: string;
  unitType: string;
  unitPhaseName: string;
  progress: number;
  unitStatusName: string;
  taskTypeName: string;
  taskStatusName: string;
  scheduledDate: Date | string;
  submittedBy: string;
  submissionDate: Date | string;
  reviewedAt: Date | string;
  unitByScopeId: number;
  projectByScopeId: number;
  hasSubTasks: boolean;
}
