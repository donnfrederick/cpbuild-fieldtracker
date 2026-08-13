export interface InstallTeamData {
  id: number;
  teamName: string;
  statusId: number;
  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
  updatedBy: number;
  deletedAt: Date;
  deletedBy: number;
  statusName: string;
  creatorName: string;
  lable?: string;
}
