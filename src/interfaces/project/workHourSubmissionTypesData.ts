export interface WorkHourSubmissionTypesData {
  id: number;
  typeName: string;
  taskTypeId: number;
  taskTypeName: string;
  taskTypeDescription: string;
  unitPhasesByScopeId: number;
  unitPhasesByScopeName: string;
  workPayTypeId: number;
  workPayTypeName: string;
  unreviewedWorkHourSubmissions: number;
}
