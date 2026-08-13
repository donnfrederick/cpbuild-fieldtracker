import type { AssignedProjectScope } from '@apiInterface/inspectionTracker';
import { ApiBaseService } from './apiBaseService';
import type { CompletedInspection } from '@apiInterface/inspectionTracker/completedInspections';
import type { InspectionsMainTasks } from '@apiInterface/inspectionTracker/inspectionsMainTasks';
import type { PendingReInspectionTasks } from '@apiInterface/inspectionTracker/pendingReInspections';

export class InspectionTrackerService extends ApiBaseService {
  constructor() {
    super();
  }

  public async getAssignedProjectScope(userId: number): Promise<AssignedProjectScope[]> {
    return this.apiProxy(
      `/inspection-tracker/install-manager/${userId}/active-project-scopes`,
      'GET'
    );
  }

  public async getProjectScope(): Promise<AssignedProjectScope[]> {
    return this.apiProxy(`/inspection-tracker/active-project-scopes`, 'GET');
  }

  public async getCompletedInspections(projectByScopeId: number): Promise<CompletedInspection> {
    return this.apiProxy(`/project-by-scope/${projectByScopeId}/completed-inspections`, 'GET');
  }

  public async getInpectionMainTasks(projectByScopeId: number): Promise<InspectionsMainTasks[]> {
    return this.apiProxy(
      `/clear-inspections-queue/project-by-scope/${projectByScopeId}/inspections-main-tasks`,
      'GET'
    );
  }

  public async getPendingReInspectionTasks(
    projectByScopeId: number
  ): Promise<PendingReInspectionTasks[]> {
    return this.apiProxy(
      `/clear-inspections-queue/project-by-scope/${projectByScopeId}/pending-re-inspections`,
      'GET'
    );
  }
}
