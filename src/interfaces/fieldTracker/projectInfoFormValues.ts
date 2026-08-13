export interface ProjectInfoFormValues {
  projectName: string;
  salesforceId: string;
  siteLocStreetAddress: string;
  siteLocCity: string;
  siteLocPostalCode: string;
  expectedStartDate: any;
  projectManagerId: number;
  installManagerId: number;
  stateId: number;
  [key: string]: string | number; // This index signature allows any string key to map to a string or number value.
}
