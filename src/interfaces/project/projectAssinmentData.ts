import type { Tasks } from './tasks';

export interface ProjectAssinmentData {
  projectId: number;
  projectName: string;
  tasks: Tasks[];
  expanded?: boolean;
}
