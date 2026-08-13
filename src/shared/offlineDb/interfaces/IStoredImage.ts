import { UploadRequestDto } from '@/shared/service-proxies/service-proxies';

export interface IStoredImage extends UploadRequestDto {
  tempId?: number;
  blobFile: Blob;
  timestamp: number;
  synced: boolean;
  file?: File;
  forPunchWorkTask: boolean;
}
