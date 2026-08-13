export interface UnitTask {
    taskId: number;
    taskTypeName: string;
    taskStatusName: string;
    dateCreated?: Date | null;
    scheduledDate?: Date | null;
    createdBy?: string;
    parentTaskId: number;
    parentTaskTypeName?: string;
    parentTaskStatusName?: string;
    inspectionDate?: Date | null;
    inspectedBy?: string;
}