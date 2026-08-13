export interface WorkersList {
  id: number;
  name: string;
  roleTypes: string | string[];
  scopeTypes: string | string[];
  workerRoleTypeIds: string | number[] | string[];
  statusName: string;
}
