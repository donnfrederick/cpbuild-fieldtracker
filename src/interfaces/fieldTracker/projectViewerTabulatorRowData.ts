export interface ProjectViewerTabulatorRowData {
  id: string;
  ftProjectId: string;
  building: string;
  level: string;
  area: string;
  shipPhase: string;
  buildPhase: string;
  scheme: string;
  unit: string;
  unitType: string;
  description: string;
  scopeTypeName: string;
  scopeTypeId: string;
  primeCode: string;
  primeCodeDescription: string;
  subPrimeCode: string;
  subPrimeCodeDescription: string;
  scopeDetailCodeId: string;
  scopeDetailCode: string;
  scopeDetailCodeDescription: string;
  scopeCode: string;
  uomTypeId: string;
  uomName: string;
  unitRate: string;
  budgetedManHours: string;
  installedQuantity: string;
  locationTypeId: string;
  locationTypeName: string;
  locationTypeDescription: string;
  costTypeId: string;
  costTypeName: string;
  costTypeDescription: string;
  costTypeDefinition: string;
  quantity: number;
  installTeamId: string;
  startingDate?: string | null;
  finishDate?: string | null;
  percentComplete?: string | null;
  earnedManHours: string | null;
  actualManHours?: string | null;
  productivityFactor: string;
  clearInspectionComplete: string | null; // Yes or No
  clearInspectionPassed?: string | null; // Yes, No, or null
  clearInspectionDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  _isDirty?: boolean;
}
