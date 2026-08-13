export interface ProjectInfoChanges {
    projectName?: string;
    projectStatusId?: number;
    projectManagerId?: number;
    installManagerId?: number;
    stateId?: number;
    salesforceId?: string;
    siteLocStreetAddress: string;
    siteLocCity: string;
    siteLocPostalCode: string;
    expectedStartDate: Date | string;
    updatedBy: number | null;
    updatedAt: string | null;
}

export interface ProjectInfoUpdate {
    changes: Partial<ProjectInfoChanges>;
}