import type { BlockedUnitByScope } from './blockedUnitByScope';
import type { BlockingIssues } from './blockingIssues';

export interface BlockedUnitsResult {
  blockedUnitByScope: BlockedUnitByScope;
  blockingIssues: BlockingIssues[];
}
