export interface RowChanges {
  [key: string]: any; // This allows any string as a key and any type as a value
  ftProjectId: number;
  building?: string;
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
}
