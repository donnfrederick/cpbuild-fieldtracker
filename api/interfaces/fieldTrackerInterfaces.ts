// Interface for creating a new project row
export interface ProjectRowInput {
    projectId: number;
    building: string;
    scopeTypeName: string;
    level: string;
    area: string;
    shipPhase: string;
    buildPhase: string;
    scheme: string;
    unit: string;
    unitType: string;
    scopeTypeId: number,
    scopeDetailCodeId: number;
    locationTypeId: number;
    costTypeId: number;
    quantity: number;
    startingDate?: Date | string;
    finishDate?: Date | string;
    percentComplete?: number;
    actualManHours?: number;
    clearInspectionComplete?: boolean;
    clearInspectionPassed?: boolean;
    clearInspectionDate?: Date | string;
    createdBy: number;
};

export interface RowChanges {
    [key: string]: any; // This allows any string as a key and any type as a value
    ftProjectId: number;
    building?: string;
    scopeTypeName?: string;
    scopeTypeId?: number;
    level?: string;
    area?: string;
    shipPhase?: string;
    buildPhase?: string;
    scheme?: string;
    unit?: string;
    unitType?: string;
    scopeDetailCodeId?: number;
    locationTypeId?: number;
    costTypeId?: number;
    quantity?: number;
    startingDate?: Date | string;
    finishDate?: Date | string;
    percentComplete?: number;
    actualManHours?: number;
    clearInspectionComplete?: boolean;
    clearInspectionPassed?: boolean | null;
    clearInspectionDate?: Date | string;
    updatedAt: Date | string;
    updatedBy: number | null;
};

export interface ProjectRowUpdate {
    rowId: number;
    changes: Partial<RowChanges>;
};

export interface ProjectRowDelete {
    userId: number;
    rowIds: number[];
};

export interface ScopeOverride {
    id: number;
    ftProjectId: number;
    scopeDetailId: number;
    manHoursQuantityOverride: number;
    installFactorOverride: number;
    createdAt?: Date | string;
    createdById?: number;
    createdByName?: string;
    updatedAt?: Date | string;
    updatedById?: number;
    updatedByName?: string;
    deletedAt?: Date | string;
    deletedById?: number;
    deletedByName?: string;
};

export interface PrimeCode {
    id: number;
    primeCode: string;
    description: string;
};

export interface SubPrimeCode {
    id: number;
    subPrimeCode: string;
    description: string;
};

export interface UomType {
    id: number;
    uomName: string;
    description: string | null;
};

export interface ScopeDetail {
    scopeDetailId: number;
    scopeDetailCode: string;
    description: string;
    isActive: boolean;
    primeCode: Partial<PrimeCode>;
    subPrimeCode: Partial<SubPrimeCode>;
    uomType: Partial<UomType>;
    defaultManHoursQuantity: number;
    defaultInstallFactor: number;
    scopeOverride: Partial<ScopeOverride> | null;
    _isDirty?: boolean;
    [key: string]: any;
};

export interface ScopeOverrideChanges {
    [key: string]: any;
    scopeOverrideId: number;
    scopeDetailId: number;
    changes: {
        manHoursQuantityOverride?: number;
        installFactorOverride?: number;
        updatedAt?: Date | string;
        updatedBy?: number | null;
        createdAt?: Date | string;
        createdBy?: number | null;
    };
}
