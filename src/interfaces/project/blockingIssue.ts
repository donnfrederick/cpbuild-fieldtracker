export interface BlockingIssue {
  id: number;
  createdAt: string; // or Date if it's already a Date object
  statusId: number;
  statusName: string;
  isVisible?: boolean;
  mode?: string;
}
