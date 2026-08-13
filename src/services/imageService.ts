import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

/**
 * Interface representing the response structure from the API proxy.
 */
interface ImageResponse {
  images: string[];
}

/**
 * Fetches images based on submission location and ID.
 * @param submissionLocation - The table or location where images are uploaded.
 * @param submissionId - The ID corresponding to the submission.
 * @returns A promise that resolves to an array of image URLs.
 */
export const getImages = async (
  submissionLocation: string,
  submissionId: number
): Promise<string[]> => {
  const authStore = useAuthStore();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  try {
    // Retrieve user roles from the authentication store
    const userRoles = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';

    if (!userRoles) {
      throw new Error('User roles are not available.');
    }

    // Construct the target URL with query parameters
    const targetUrl = `${apiBaseUrl}/blob-get-images?submissionLocation=${encodeURIComponent(
      submissionLocation
    )}&submissionId=${encodeURIComponent(submissionId)}`;
    const targetMethodType = 'GET'; // Assuming the Azure Function expects a GET request

    // Log the request for debugging purposes
    console.info('Fetching images from Azure Function:', targetUrl);

    // Make the POST request to the API proxy
    const response: AxiosResponse<ImageResponse> = await axios.post(
      `${apiBaseUrl}/api-proxy`,
      {
        userRoles: userRoles,
        targetUrl: targetUrl,
        targetMethodType: targetMethodType,
      },
      {
        timeout: 10000, // Optional: Set a timeout for the request
      }
    );

    // Validate and return the images
    if (response.data && Array.isArray(response.data.images)) {
      console.info('Images fetched successfully:', response.data.images);
      return response.data.images;
    } else {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected response format from the server.');
    }
  } catch (error: any) {
    // Log and rethrow the error for the caller to handle
    console.error('Error fetching images:', error);
    throw new Error(error.message || 'Failed to fetch images.');
  }
};
