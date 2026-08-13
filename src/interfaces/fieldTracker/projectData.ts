export interface ProjectData {
  ftProjectId: number;
  rootProjectId: number;
  projectName: string;
  salesforceId: string;
  projectManagerName: string;
  projectManagerId: number;
  installManagerName: string;
  installManagerId: number;
  stateName: string;
  stateCode: string;
  stateId: number;
  siteLocStreetAddress: string;
  siteLocCity: string;
  siteLocPostalCode: string;
  expectedStartDate: Date | string;
  createdAt: string;
  createdByName: string;
  createdById: number;
  updatedAt: string;
  updatedById: number;
  updatedByName: string;
}
