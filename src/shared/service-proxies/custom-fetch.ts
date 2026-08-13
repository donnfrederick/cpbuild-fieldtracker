import { useNetworkStore } from '@/stores/useNetworkStore';
import { cacheableUrls } from '../offlineDb/cacheableUrls';
import { cpBuildIndexedDb } from '../offlineDb/CPBuildIndexedDb';
import { storeToRefs } from 'pinia';
import { featureFlags } from '@/config/featureFlags';
import { IdbTaskSubmissionViewerCacheService } from '../offlineDb/services/idbTaskSubmissionViewerCacheService';
import {
  TasksubmissionUpdateUnitByScopeDto,
  TaskSubmissionUpdateUnitTaskDto,
  UpdateDeficiencyDto,
} from './service-proxies';
import { IdbUpdateUnitTaskTSVService } from '../offlineDb/services/idbUpdateUnitTaskTSVService';
import { IUpdateUnitByScopeTSV } from '../offlineDb/interfaces/IUpdateUnitByScopeTSV';
import { IUpdateUnitTaskTSV } from '../offlineDb/interfaces/IUpdateUnitTaskTSV';
import { IdbUpdateUnitByScopeTSVService } from '../offlineDb/services/idbUpdateUnitByScopeTSVService';
import { IdbUpdateDeficiencyTSVService } from '../offlineDb/services/idbUpdateDeficiencyTSVService';

const nativeFetch = globalThis.fetch;

export async function customFetch(
  input: string | Request | URL,
  init?: RequestInit
): Promise<Response> {
  if (!featureFlags.offlineMode) {
    return nativeFetch(input, init);
  }

  const { isOffline } = storeToRefs(useNetworkStore());
  const { url, method, headers, shouldCache, body } = await normalizeRequest(input, init);

  if (shouldCache) {
    if (isOffline.value) {
      switch (method) {
        case 'GET': {
          const cached = await getIDBRequestCachedResponse(url, method);
          if (cached) return cached;

          return buildResponse(
            { status: 'offline', message: 'No cached response available.' },
            503
          );
        }

        case 'PATCH':
        case 'POST':
        case 'PUT':
          return await handleMuationMethods(url, body);

        default:
          return buildResponse({ status: 'offline', message: 'Not handled offline' }, 503);
      }
    }

    // 🌐 ONLINE: Perform fetch and cache response
    const response = await nativeFetch(input, init);
    const cloned = response.clone();
    const responseBody = await parseResponseBody(cloned);

    await cpBuildIndexedDb.requests.put({
      url,
      method,
      headers,
      body: init?.body ? await serializeBody(init.body) : null,
      response: responseBody,
      statusCode: response.status,
      timestamp: Date.now(),
      synced: false,
    });

    if (
      url.includes('TaskSubmissionViewer/GetTaskSubmissionViewerDetails') ||
      url.includes('TaskSubmissionViewer/GetTaskSubmissionViewerDetailsBulkForOffline')
    ) {
      await IdbTaskSubmissionViewerCacheService.saveFromSummary(responseBody);
    }

    return response;
  }

  // 📡 No caching needed, just fetch directly
  return nativeFetch(input, init);
}

async function normalizeRequest(
  input: string | Request | URL,
  init?: RequestInit
): Promise<{
  url: string;
  method: string;
  headers?: Record<string, string>;
  shouldCache: boolean;
  body: any;
}> {
  let url: string;
  if (typeof input === 'string') url = input;
  else if (input instanceof Request) url = input.url;
  else if (input instanceof URL) url = input.toString();
  else throw new Error('Unsupported fetch input type');
  return {
    url,
    method: init?.method?.toUpperCase() || 'GET',
    headers: extractHeaders(init?.headers),
    shouldCache: isURLCacheable(url),
    body: await serializeBody(init?.body as BodyInit),
  };
}

// ✅ Only cache GET requests to specific endpoints
function isURLCacheable(url: string): boolean {
  return cacheableUrls.some((path) => url.includes(path));
}

function extractHeaders(headersInit?: HeadersInit): Record<string, string> | undefined {
  const headers: Record<string, string> = {};
  if (!headersInit) return undefined;

  if (headersInit instanceof Headers) {
    headersInit.forEach((value, key) => (headers[key] = value));
  } else if (Array.isArray(headersInit)) {
    for (const [key, value] of headersInit) headers[key] = value;
  } else {
    Object.assign(headers, headersInit);
  }

  return headers;
}

async function serializeBody(body: BodyInit): Promise<any> {
  if (typeof body === 'string') return JSON.parse(body);
  if (body instanceof Blob) return await body.text();
  if (body instanceof FormData) {
    const obj: any = {};
    for (const [key, val] of body.entries()) obj[key] = val;
    return JSON.stringify(obj);
  }
  return JSON.stringify(body);
}

async function parseResponseBody(response: Response): Promise<any> {
  try {
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) return await response.json();
    return await response.text();
  } catch {
    return null;
  }
}

function buildResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getIDBRequestCachedResponse(url: string, method: string): Promise<Response | null> {
  const cached = await cpBuildIndexedDb.requests.get([url, method]);
  if (!cached?.response) return null;

  return buildResponse(cached.response, cached.statusCode ?? 200);
}

async function handleMuationMethods(url: string, body: any): Promise<any> {
  switch (true) {
    case url.includes('TaskSubmissionViewer/UpdateUnitTask'): {
      const parsedBody = body as TaskSubmissionUpdateUnitTaskDto;
      const taskId = parsedBody.unitTaskId;

      await IdbUpdateUnitTaskTSVService.save({
        taskId,
        updateUnitTaskRequest: parsedBody,
      } as IUpdateUnitTaskTSV);

      return buildResponse(
        { message: 'TaskSubmissionViewer - UpdateUnitTask - Stored Offline' },
        200
      );
    }

    case url.includes('TaskSubmissionViewer/UpdateUnitByScope'): {
      const parsedBody = body as TasksubmissionUpdateUnitByScopeDto;
      const unitId = parsedBody.unitId;

      await IdbUpdateUnitByScopeTSVService.save({
        unitId,
        updateUnitByScope: parsedBody,
      } as IUpdateUnitByScopeTSV);

      return buildResponse(
        { message: 'TaskSubmissionViewer - UpdateUnitByScope - Stored Offline' },
        200
      );
    }

    case url.includes('ClearInspection/UpdateDeficiency'): {
      const parsedBody = body as UpdateDeficiencyDto;
      const deficiencyId = parsedBody.id;

      await IdbUpdateDeficiencyTSVService.save({
        deficiencyId,
        request: parsedBody,
      });

      return buildResponse({ message: 'ClearInspection - UpdateDeficiency - Stored Offline' }, 200);
    }
  }
}
