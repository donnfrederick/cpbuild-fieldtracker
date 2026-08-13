export interface Tasks {
  id: number;
  scopeTypeId: number;
  scopeTypeName: string;
  teamLeadId: number;
  teamLeadName: string;
  phaseId?: number;
  taskId?: number;
}
