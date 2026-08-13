export interface TaskInfo {
  taskId: string;
  taskTypeName: string;
  taskStatusName: string;
  scheduledDate?: Date | null;
  submittedBy: string;
  submissionDate: Date | null;
  dateCreated?: Date | null;
  createdBy?: string;
  parentTaskId?: string;
  parentTaskTypeName?: string;
  parentTaskStatusName?: string;
  inspectionDate?: Date | null;
  inspectedBy?: string;
}
