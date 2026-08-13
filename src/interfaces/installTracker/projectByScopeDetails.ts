export interface ProjectByScopeDetails {
  id: number;
  ftProjectId: number;
  projectId: number;
  projectName: string;
  scopeTypeId: number;
  scopeTypeName: string;
  statusId: number;
  statusName: string;
  teamLeadId: number;
  teamLeadUserId?: number;
}
