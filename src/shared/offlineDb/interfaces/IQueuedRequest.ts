export interface IQueuedRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  response?: any;
  statusCode?: number;
  timestamp: number;
  synced: boolean;
}
