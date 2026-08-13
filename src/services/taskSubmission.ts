import type {
  ClearInspectionChecklistUpdateApiRequest,
  ClearInspectionDeficiencyLevelTypesApiRequest,
  EligibleWorkersListApiRequest,
  RoleAssignmentsApiRequest,
  SubmittedHoursListApiRequest,
  UnitLevelProjectSubmissionsApiRequest,
} from '@/interfaces/api/taskSubmissionRequest';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

export const clearInspectionChecklistUpdateApi = async (
  data: ClearInspectionChecklistUpdateApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/unit-task/clear-inspection-checklist/${data.itemId}/update`;
  data.targetMethodType = 'PATCH';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const clearInspectionDeficiencyLevelTypesApi = async (
  data: ClearInspectionDeficiencyLevelTypesApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/clear-inspection/deficiency-level-types`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const submittedHoursListApi = async (data: SubmittedHoursListApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/unit-task/${data.unitTaskId}/submitted-hours/list`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const unitLevelProjectSubmissionsApi = async (
  data: UnitLevelProjectSubmissionsApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/worker/${data.workerId}/work-hour-submissions/task/${data.taskId}`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const roleAssignmentsApi = async (data: RoleAssignmentsApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/project-scope-type/${data.scopeTypeId}/required-roles/list`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const eligibleWorkersListApi = async (data: EligibleWorkersListApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/scope-task/${data.scopeTypeId}/eligible-workers/list?roleIds=${data.roleIds}`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};
