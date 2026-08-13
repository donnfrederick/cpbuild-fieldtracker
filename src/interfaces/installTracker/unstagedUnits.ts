import type { BlockingIssue } from '../project/blockingIssue';
import type { RoleAssignments } from '../project/roleAssignments';
import type { UnitTask } from '../project/unitTask';

export interface UnstagedUnits {
  id: number;
  area: number;
  blockingIssues: BlockingIssue[];
  building: string;
  currentPhaseId: number;
  currentPhaseName: string | undefined;
  fieldTrackerProjectRowId: number;
  level: string;
  mainTasks: UnitTask[];
  subtasks: UnitTask[];
  projectByScopeId: number;
  projectScopeTypeId: number;
  projectScopeTypeName: string;
  quantities: any;
  unit: string;
  incrementalWeightPercent: number;
  initialCumulativePercent: number | undefined;
  finalCumulativePercent: number;
  unitStatusId: number;
  unitStatusName: string | undefined;
  completionDate: string;
  unitType: string;
  expanded: boolean;
  roleAssignments: RoleAssignments[];
}
