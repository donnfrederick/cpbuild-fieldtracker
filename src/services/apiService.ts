import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';

const ENABLE_JWT = false; // Change to true to enable JWT logic

const apiUrl = import.meta.env.VITE_API_BASE_URL;
const middlewareURL = import.meta.env.VITE_API_MIDDLEWARE_URL;

// Set up axios defaults
// axios.defaults.baseURL = middlewareURL;
// axios.defaults.withCredentials = true;

// Function to refresh token
const refreshToken = async () => {
  try {
    await axios.post(`${apiUrl}/refresh-token`);
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
};

// Generate a JWT token
const generateJwt = async () => {
  try {
    const response = await axios.post(`${apiUrl}/jwt-create`);
    if (response.status !== 200) {
      throw new Error(`Failed to generate JWT! status: ${response.status}`);
    }
    return response.data.token;
  } catch (error) {
    console.error('Failed to generate JWT:', error);
    throw error;
  }
};

// Axios response interceptor
axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    // ✅ Ensure error is an AxiosError and has a response/config
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url?.includes('/api-proxy')
    ) {
      if (ENABLE_JWT) {
        await refreshToken();
      }
      if (error.config) {
        return axios(error.config as AxiosRequestConfig);
      }
    }

    // ✅ Fallback for any error (even if it's not Axios)
    return Promise.reject(error);
  }
);

// Get a message from the API
const getApiMessage = async () => {
  const authStore = useAuthStore();
  const jwtToken = authStore.jwtToken;
  const userRoles = authStore.userInfo?.clientPrincipal.userRoles || [];

  const headers: Record<string, string> = {
    'x-user-roles': JSON.stringify(userRoles), // Include the user roles
    'x-target-function': 'test2', // Keep the x-target-function as is
  };

  if (ENABLE_JWT) {
    headers['Authorization'] = `Bearer ${jwtToken}`; // Add Authorization header only if ENABLE_JWT is true
  }

  try {
    const response = await axios.get(`${middlewareURL}`, {
      headers,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('Axios Get response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Axios Get error:', error.response || error.request || error.message);

    return;
  }
};

const reformatDate = async (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const year = date.getFullYear();

  // Zero-pad month and day to ensure they are always two digits
  const paddedMonth = month.toString().padStart(2, '0');
  const paddedDay = day.toString().padStart(2, '0');

  return `${paddedMonth}-${paddedDay}-${year}`;
};

export const apiService = {
  getApiMessage,
  generateJwt,
  reformatDate,
};
