import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Check environment variables
const checkEnvVars = (keys: string[]) => {
  keys.forEach(key => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`No ${key} defined in environment variables`);
    }
  });
};

checkEnvVars(['API_URL', 'API_KEY']);

const apiKey = process.env.API_KEY!;

function isAxiosError(error: any): error is AxiosError {
  return error.response !== undefined;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Processing api-proxy request...');
  context.log(`Node is running on arch: ${process.arch}, platform: ${process.platform}`);

  // Initialize context.res if it's not already
  context.res = context.res || {};
  context.res.headers = context.res.headers || {};

  let response: AxiosResponse | null = null;

  const userRoles = req.body?.['userRoles'];
  const targetUrl = req.body?.['targetUrl'];
  const targetMethodType = req.body?.['targetMethodType'];
  const dataPayload = req.body?.['data']; // Extracting the actual data meant for the downstream API

  context.log('User Roles:', userRoles);
  context.log(`Target URL: ${targetUrl}`);

  // if (!userRoles) {
  //   context.res = {
  //     status: 400, // Bad Request
  //     body: "The 'userRoles' parameter must be provided in the request body."
  //   };
  //   return;
  // }

  if (!targetUrl) {
    context.res = {
      status: 400, // Bad Request
      body: "The 'targetUrl' parameter must be provided in the request body."
    };
    return;
  }

  if (!targetMethodType) {
    context.res = {
      status: 400, // Bad Request
      body: "The 'targetMethodType' parameter must be provided in the request body."
    };
    return;
  }

  let axiosConfig: AxiosRequestConfig = {
    headers: {
      'x-functions-key': apiKey,
      'x-user-roles': JSON.stringify(userRoles)
    }
  };

  if (Object.keys(req.query).length > 0) {
    axiosConfig.params = req.query;
  }

  // Include query parameters if they exist
  if (Object.keys(req.query).length > 0) {
    axiosConfig.params = req.query;
  }

  // Assign the data payload to axiosConfig.data if the method is not 'GET' and there is actual data to send
  if (targetMethodType !== 'GET' && dataPayload) {
    axiosConfig.data = dataPayload;
  }

  if (targetMethodType !== 'GET' && req.body) {
    axiosConfig.data = req.body;
  }

  if (targetMethodType) {
    context.log(`Setting method to ${targetMethodType}`);
    axiosConfig.method = targetMethodType as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  }

  try {
    // Make request
    response = await axios(targetUrl, axiosConfig);

    if (response) {
      context.res = {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        },
        body: response.data
      };
    } else {
      context.res = {
        status: 500,
        body: 'Internal Server Error - No response received.'
      };
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      context.log(`Axios Error: ${axiosError.message}`);

      if (axiosError.response) {
        context.res = {
          status: axiosError.response.status,
          body: axiosError.response.data || "Error"
        };
      } else {
        context.res = {
          status: 500,
          body: 'Internal Server Error'
        };
      }
    } else {
      context.log(`Generic Error: ${error.message}`);
      context.res = {
        status: 500,
        body: 'Internal Server Error'
      };
    }
  }
};

export default httpTrigger;