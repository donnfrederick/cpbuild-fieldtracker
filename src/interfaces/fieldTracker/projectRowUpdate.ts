import type { RowChanges } from './';

export interface ProjectRowUpdate {
  rowId: number;
  changes: Partial<RowChanges>;
}
