import type { Task } from '../installTracker';
import type { BlockingIssue } from './blockingIssue';
import type { Tasks } from './tasks';

export interface UnitData {
  area: string;
  building: string;
  completionDate: string;
  currentPhaseId: number;
  currentPhaseName: string;
  fieldTrackerProjectRowId: number;
  finalCumulativePercent: number;
  id: number;
  incrementalWeightPercent: number;
  initialCumulativePercent: number;
  level: string;
  projectName?: string;
  projectByScopeId: number;
  projectScopeTypeId: number;
  projectScopeTypeName: string;
  unit: string;
  unitProgressPercent: number;
  unitStatusId: number;
  unitStatusName: string;
  unitType: string;
  blockingIssues: BlockingIssue[] | null;
  quantities: number | { setQuantity: number; installedQuantities: { addedQuantities: number } };
  mainTasks: Tasks[] | [];
  subtasks: Task | [];
}
