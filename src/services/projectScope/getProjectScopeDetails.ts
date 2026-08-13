import type { ProjectByScopeDetails } from '@/interfaces/installTracker';
import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';

const authStore = useAuthStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
const userRoles = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';

export const getProjectRecord = async (
  projectId: number
): Promise<ProjectByScopeDetails | null> => {
  try {
    const { data } = await axios.post(
      `${apiBaseUrl}/api-proxy`,
      {
        userRoles,
        targetUrl: `${apiBaseUrl}/project-scope/${projectId}/details`,
        targetMethodType: 'GET',
      },
      {
        timeout: 120000,
      }
    );

    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
