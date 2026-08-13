import type { ImageUploads } from '../common';

export interface WorkHourSubmissions {
  id: number;
  projectName: string;
  scopeTypeName: string;
  submitTypeId: number;
  submitTypeName: string;
  statusId: number;
  statusName: string;
  hours: number | string;
  hoursText?: string;
  quantity: number;
  hoursArr: Array<number>;
  submissionDate: string;
  submittedBy: string;
  submissionNotes: string;
  managerNotes: string;
  hoursOverride: number;
  hoursOverrideArr: Array<number>;
  quantityOverride: number;
  images: ImageUploads[];
  taskTypeName?: string | null;
  payTypeName?: string | null;
  taskStatusId: number;
}
