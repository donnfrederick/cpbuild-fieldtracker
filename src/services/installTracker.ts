import type {
  BlockedUnitsResult,
  InstallTrackerTaskQueue,
  UnstagedUnits,
} from '@/interfaces/installTracker';
import { ApiBaseService } from './apiBaseService';
import type {
  IsIhiWorkerApiRequst,
  MainTasksSubmissionsApiRequest,
  ProjectByScopeDetailsApiRequest,
  ScopeAssignmentsApiRequest,
  UnitLevelSubmissionTypesApiRequest,
  WorkHourSubmissionCreateApi,
  WorkHourSubmissionDeleteApiRequest,
  WorkHourSubmissionsByWorkerAndProjectScopeApiRequest,
  WorkHourSubmissionsProjectLevelListApiRequest,
  WorkHourSubmissionsUpdateApiRequest,
} from '@/interfaces/api/installTrackerRequest';

export class InstallTrackerService extends ApiBaseService {
  constructor() {
    super();
  }

  public async getPendingSubtasks(
    projectByScopeId: number,
    workerId: number
  ): Promise<InstallTrackerTaskQueue[]> {
    return this.apiProxy(
      `/install-tracker/project/${projectByScopeId}/worker/${workerId}/pending-subtasks`,
      'GET'
    );
  }

  public async isIhiWorkerApi(data: IsIhiWorkerApiRequst): Promise<any> {
    return this.apiProxy(`/user/${data.userId}/is-ihi-worker`, 'GET');
  }

  public async scopeAssignmentsApi(data: ScopeAssignmentsApiRequest): Promise<any> {
    return this.apiProxy(`/projects-by-scope/worker/${data.workerId}/scope-assignments`, 'GET');
  }

  public async projectLevelSubmissionTypesApi(): Promise<any> {
    return this.apiProxy(`/work-hour-submission/project-level/submission-types`, 'GET');
  }

  public async unitLevelSubmissionTypesApi(data: UnitLevelSubmissionTypesApiRequest): Promise<any> {
    return this.apiProxy(
      `/work-hour-submissions/unit-level/scope-phase/${data.phaseByScopeId}/submission-types`,
      'GET'
    );
  }

  public async workHourSubmissionCreateApi(data: WorkHourSubmissionCreateApi): Promise<any> {
    return this.apiProxy(
      `/project-by-scope/${data.projectByScopeId}/work-hour-submission/create`,
      'POST',
      data
    );
  }

  public async projectByScopeDetailsApi(data: ProjectByScopeDetailsApiRequest): Promise<any> {
    return this.apiProxy(`/project-scope/${data.projectByScopeId}/details`, 'GET');
  }

  public async mainTaskSubmissionsApi(data: MainTasksSubmissionsApiRequest): Promise<any> {
    return this.apiProxy(
      `/project-by-scope/${data.projectByScopeId}/worker/${data.workerId}/main-task-submissions`,
      'GET'
    );
  }

  public async workHourSubmissionsProjectLevelListApi(
    data: WorkHourSubmissionsProjectLevelListApiRequest
  ): Promise<any> {
    return this.apiProxy(
      `/worker/${data.workerId}/work-hour-submissions/project-level/list`,
      'GET'
    );
  }

  public async workHourSubmissionsByWorkerAndProjectScopeApi(
    data: WorkHourSubmissionsByWorkerAndProjectScopeApiRequest
  ): Promise<any> {
    return this.apiProxy(
      `/work-hour-submissions/worker/${data.workerId}/project-scope/${data.projectByScopeId}`,
      'GET'
    );
  }

  public async workHourSubmissionsUpdateApi(
    data: WorkHourSubmissionsUpdateApiRequest
  ): Promise<any> {
    return this.apiProxy(
      `/work-hour-submission/${data.workHourSubmissionId}/worker/${data.workerId}/update`,
      'PATCH',
      data
    );
  }

  public async workHourSubmissionDeleteApi(data: WorkHourSubmissionDeleteApiRequest): Promise<any> {
    return this.apiProxy(
      `/work-hour-submission/${data.workHourSubmissionId}/delete`,
      'PATCH',
      data
    );
  }

  public async getPendingMainTasks(
    projectByScopeId: number,
    workerId: number
  ): Promise<InstallTrackerTaskQueue[]> {
    return this.apiProxy(
      `/install-tracker/project/${projectByScopeId}/worker/${workerId}/pending-main-tasks`,
      'GET'
    );
  }

  public async getBlockedUnits(
    projectByScopeId: number,
    workerId: number
  ): Promise<BlockedUnitsResult[]> {
    return this.apiProxy(
      `/install-tracker/project/${projectByScopeId}/worker/${workerId}/blocked-units`,
      'GET'
    );
  }

  public async getUnstagedUnits(projectByScopeId: number): Promise<UnstagedUnits[]> {
    return this.apiProxy(`/unstaged/units/project-scope/${projectByScopeId}/list`, 'GET');
  }

  public async getSecondaryTasks(
    projectByScopeId: number,
    workerId: number
  ): Promise<InstallTrackerTaskQueue[]> {
    return this.apiProxy(
      `/secondary-tasks/worker/${workerId}/project-scope/${projectByScopeId}`,
      'GET'
    );
  }
}
