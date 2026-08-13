import type { AzureBlobDeleteApiRequest } from '@/interfaces/api/azureBlobRequest';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

export const azureBlobDeleteApi = async (data: AzureBlobDeleteApiRequest): Promise<any> => {
  data.targetUrl = `${apiBaseUrl}/blob/${data.uploadId}/delete`;
  data.targetMethodType = 'PATCH';

  return await axios.post(`${apiBaseUrl}/api-proxy`, data, {
    timeout: 120000,
  });
};
