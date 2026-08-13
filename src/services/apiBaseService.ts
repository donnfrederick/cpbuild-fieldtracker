import { useAuthStore } from '@/stores/useAuthStore';
import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';

export class ApiBaseService {
  private axiosInstance: AxiosInstance;
  private baseURL = import.meta.env.VITE_API_BASE_URL as string;
  private authStore = useAuthStore();

  constructor() {
    const userRoles = this.authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Roles': userRoles,
      },
    });
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      console.error(
        `API Error: ${error.response.status} - ${error.response.statusText}`,
        error.response.data
      );
      throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('No response received from API', error.request);
      throw new Error('No response received from API');
    } else {
      console.error('Request error', error.message);
      throw new Error(`Request error: ${error.message}`);
    }
  }

  protected async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async post<T>(url: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async put<T>(url: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async patch<T>(url: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async apiProxy<T>(url: string, targetMethodType: string, data?: any): Promise<T> {
    try {
      const userRoles = this.authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
      data = {
        ...data,
        userRoles,
        targetUrl: `${this.baseURL}${url}`,
        targetMethodType,
      };
      const response: AxiosResponse<T> = await this.axiosInstance.post(
        `${this.baseURL}/api-proxy`,
        data,
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}
