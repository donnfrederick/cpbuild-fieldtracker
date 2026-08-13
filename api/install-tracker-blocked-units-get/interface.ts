export interface BlockedUnitsResult {
    blockedUnitByScope: BlockedUnitByScope;
    blockingIssues: BlockingIssues[];
}

export interface BlockingIssues {
    blockingIssueId: number;
    unitId: number;
    taskId: number;
    unitPhaseName: string;
    unitStatusName: string;
    progress: number;
}

export interface BlockedUnitByScope {
    projectScopeById: number;
    building: string;
    level: string;
    unit: string;
    area: string;
    unitType: string;
    unitId: number;
    progress: number;
}

export interface RequestResult<T> {
    data: T;
    statusCode: number;
    error: Error | null;
}