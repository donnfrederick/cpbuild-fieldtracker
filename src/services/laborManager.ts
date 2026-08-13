import type {
  ActiveWorkersByScopeApiRequest,
  ParentChildPunchTaskCreateApiRequest,
  TeamLeadActiveIHIProjectApiRequest,
  UnitByScopeUpdateApiRequest,
  UnitDataApiRequest,
  UnitLevelSubtaskTypesApiRequest,
  UnitsDetailsApiRequest,
  UnitsInfoListApiRequest,
  UnitTaskUpdateApiRequest,
} from '@/interfaces/api/laborManagerRequest';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

export const unitTaskUpdateApi = async (data: UnitTaskUpdateApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/unit-task/${data.unitTaskId}/update`;
  data.targetMethodType = 'PATCH';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const unitByScopeUpdateApi = async (data: UnitByScopeUpdateApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/units-by-scope/${data.unitId}/update`;
  data.targetMethodType = 'PATCH';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const teamLeadActiveIHIProjectApi = async (
  data: TeamLeadActiveIHIProjectApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/labor-manager/team-leads/${data.teamLeadId}/active-ihi-projects`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const unitDataApi = async (data: UnitDataApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/unit-by-scope-data/${data.unitByScopeId}`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const unitsInfoListApi = async (data: UnitsInfoListApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/project-by-scope/${data.projectByScopeId}/units-info/list`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const unitsDetailsApi = async (data: UnitsDetailsApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/unit-task/${data.unitTaskId}/details`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const activeWorkersByScopeApi = async (
  data: ActiveWorkersByScopeApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/active-workers-by-scope/${data.scopeTypeId}`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const unitLevelSubtaskTypesApi = async (
  data: UnitLevelSubtaskTypesApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/unit-level/subtask/types`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};

export const parentChildPunchTaskCreateApi = async (
  data: ParentChildPunchTaskCreateApiRequest
): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/parent-task/${data.parentTaskId}/child-punch-task/create?create-checklist=${data.createChecklist}`;
  data.targetMethodType = 'POST';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};
