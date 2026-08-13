import { FormattedProjectRowDto } from '@/shared/service-proxies/service-proxies';

export interface ProjectRowData extends FormattedProjectRowDto {
  _isDirty?: boolean;
  [key: string]: any; // Allow for any other properties
}
