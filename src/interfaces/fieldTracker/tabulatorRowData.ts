export interface TabulatorRowData {
  scopeDetailId: number;
  scopeDetailCode: string;
  scopeDetailDescription: string;
  isActive: boolean;
  primeCodeId: number;
  primeCode: string;
  primeCodeDescription: string;
  subPrimeCodeId: number;
  subPrimeCode: string;
  subPrimeCodeDescription: string;
  uomTypeId: number;
  uomType: string;
  uomTypeDescription: string;
  defaultManHoursQuantity: number;
  defaultInstallFactor: number;
  scopeOverrideId: number;
  scopeOverrideFtProjectId: number;
  scopeOverrideScopeDetailId: number;
  manHoursQuantityOverride: number;
  installFactorOverride: number;
  overrideCreatedAt: Date | string;
  overrideCreatedById: number;
  overrideCreatedByName: string;
  overrideUpdatedAt: Date | string;
  overrideUpdatedById: number;
  overrideUpdatedByName: string;
  overrideDeletedAt: Date | string;
  overrideDeletedById: number;
  overrideDeletedByName: string;
  quantityPerHour: number;
  _isDirty?: boolean;
  [key: string]: any; // This allows any string as a key and any type as a value
}
