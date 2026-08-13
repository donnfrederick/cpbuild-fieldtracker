import type { Tasks } from '../taskSubmission/tasks';

export interface ProjectAssinmentData {
  projectId: number;
  projectName: string;
  tasks: Tasks[];
}
