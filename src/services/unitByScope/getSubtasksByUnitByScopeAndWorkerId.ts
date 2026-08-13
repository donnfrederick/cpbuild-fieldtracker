import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';
import type { Task } from '@/interfaces/installTracker';

const authStore = useAuthStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
const userRoles = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';

export const getSubtasksByUnitByScopeAndWorkerId = async (
  unitByScopeId: number,
  workerId: number
): Promise<Task[]> => {
  try {
    const response = await axios.post<Task[]>(
      `${apiBaseUrl}/api-proxy`,
      {
        userRoles,
        targetUrl: `${apiBaseUrl}/unit-by-scope/${unitByScopeId}/worker/${workerId}/subtask-submissions`,
        targetMethodType: 'GET',
      },
      { timeout: 120000 }
    );

    return response.data ?? [];
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return [];
  }
};
