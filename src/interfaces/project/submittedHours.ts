export interface SubmittedHours {
  id: number;
  workerId: number;
  workerName: string;
  projectByScopeId: 2015;
  taskId: number;
  roleId: number;
  roleName: string;
  workHourSubmissionTypeId: number;
  workHourSubmissionTypeName: string;
  workHourSubmissionStatusId: number;
  workHourSubmissionStatusName: string;
  lastStatusUpdate: Date;
  statusUpdatedBy: number;
  hours: number;
  hoursOverrid: number;
  quantity: number;
  quantityOverride: number;
  submissionDate: string;
  submissionNotes: string;
  managerNotes: string;
  createdAt: Date | string;
  createdBy: number;
  updatedAt: Date | string | null;
  updatedBy: number;
  deletedAt: Date | string | null;
  deletedBy: number;
}
