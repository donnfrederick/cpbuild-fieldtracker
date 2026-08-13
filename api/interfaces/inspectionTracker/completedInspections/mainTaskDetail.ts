import { type UnitTask } from "./unitTask";

export interface MainTaskDetail extends UnitTask {
    building: string;
    level: string;
    unit: string;
    area: string;
    unitType: string;
    unitByScopeId: number;
    unitPhaseName: string;
    unitStatusName: string;
    progress: number;

    resolutionTasks: UnitTask[];
}