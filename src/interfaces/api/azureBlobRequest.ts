export interface AzureBlobDeleteApiRequest {
  uploadId: number;
  deletedBy: number;
  userRoles: string;
  targetUrl?: string;
  targetMethodType?: string;
}
