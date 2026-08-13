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
}
