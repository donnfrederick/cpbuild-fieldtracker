import type { IUnitDetailFilter } from './unitDetailFilter';

export interface UnitListStorage {
  projectByScopeId: number;
  keyword: string;
  selectedPhases: number[];
  selectedStatusTypes: number[];
  unitDetailPresetFilters: IUnitDetailFilter[];
}
