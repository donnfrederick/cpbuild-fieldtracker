import type { ScopeAssignmentsScopes } from './scopeAssignmentsScopes';

export interface ScopeAssignments {
  projectName: string;
  fieldTrackerProjectId: number;
  scopes: ScopeAssignmentsScopes[];
  hasReadyUnits: boolean;
  expanded: boolean;
}
