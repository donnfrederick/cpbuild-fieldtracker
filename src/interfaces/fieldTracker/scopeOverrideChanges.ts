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
