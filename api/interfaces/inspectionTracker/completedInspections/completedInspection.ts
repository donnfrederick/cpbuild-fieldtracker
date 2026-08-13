import { type MainTaskDetail } from "./mainTaskDetail";
import { type ProjectByScopeDetail } from "./projectByScopeDetail";

export interface CompletedInspection {
    projectDetail: ProjectByScopeDetail;
    tasks: MainTaskDetail[];
}