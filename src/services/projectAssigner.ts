import type { TeamLeadsApiRequest } from '@/interfaces/api/projectAssignerRequest';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

export const teamLeadsGetApi = async (data: TeamLeadsApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/project-assigner/team-leads/active/list`;
  data.targetMethodType = 'GET';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};
