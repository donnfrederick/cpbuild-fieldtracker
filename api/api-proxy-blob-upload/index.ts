import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import axios, { AxiosError } from 'axios';

const apiKey = process.env.API_KEY || '';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log("Processing api-proxy-blob-upload request...");

  const blobUploadUrl = `${process.env.API_URL}/blob/upload?code=${apiKey}`;
  context.log(`Target URL: ${blobUploadUrl}`);

  try {
    // Use context.log.verbose or context.log for more granular logging
    context.log.verbose("Incoming request headers:", req.headers);

    const response = await axios({
      method: 'POST',
      url: blobUploadUrl,
      headers: {
        'Content-Type': req.headers['content-type']
      },
      data: req.body
    });

    context.log(`Blob-upload function responded with status: ${response.status}`);

    context.res = {
      status: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/json'
      },
      body: response.data
    };

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      context.log.error("Axios error calling blob-upload:", axiosError.message);

      if (axiosError.response) {
        context.res = {
          status: axiosError.response.status,
          body: axiosError.response.data || "Error from blob-upload function"
        };
      } else {
        context.res = {
          status: 502,
          body: "Bad Gateway: No response received from blob-upload function."
        };
      }
    } else {
      context.log.error("Unexpected error in api-proxy-blob-upload:", error);
      context.res = {
        status: 500,
        body: "Internal Server Error"
      };
    }
  }
};

export default httpTrigger;