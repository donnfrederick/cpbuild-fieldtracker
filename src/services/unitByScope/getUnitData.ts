import type { UnitData } from '@/interfaces/project';
import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';

const authStore = useAuthStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
const userRoles = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';

export const getUnitData = async (unitId: number): Promise<UnitData | null> => {
  try {
    const { data } = await axios.post(
      `${apiBaseUrl}/api-proxy`,
      {
        userRoles,
        targetUrl: `${apiBaseUrl}/unit-by-scope-data/${unitId}`,
        targetMethodType: 'GET',
      },
      {
        timeout: 120000,
      }
    );

    return data.result ?? [];
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return null;
  }
};
