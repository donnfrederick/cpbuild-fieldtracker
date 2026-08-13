import type { ProjectData } from './';

export interface FieldTrackerProjectsResponse {
  data: ProjectData[] | null;
  error: boolean;
  message?: string;
}
