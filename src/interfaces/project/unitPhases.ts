export interface UnitPhases {
  id: number;
  mainTaskRequired: boolean;
  phaseName: string;
  phaseOrder: number;
  scopeTypeId: number;
  version: number;
  workerAssignmentRequired: boolean;
  workerAssignmentDisplayName: string;
  hasChecklistItems: boolean;
  schedulingRequired: boolean;
  incrementalWeightPercent: number;
  initialCumulativePercent: number;
  finalCumulativePercent: number;
  description: string;
}
