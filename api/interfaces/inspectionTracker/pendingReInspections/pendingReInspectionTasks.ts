export interface PendingReInspectionTasks {
    building: string;
    level: string;
    unit: string;
    area: string;
    unitType: string;
    unitByScopeId: number;
    unitPhaseName: string;
    unitStatusName: string;
    progress: number;
    taskId: number;
    taskTypeName: string;
    taskStatusName: string;
    dateCreated?: Date | null;
    createdBy?: string;
    parentTaskId: number;
    parentTaskTypeName?: string;
    parentTaskStatusName?: string;
}