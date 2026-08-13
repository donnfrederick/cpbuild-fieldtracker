import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import DashboardView from '@/views/DashboardView.vue';
import InstallTeamsTool from '@/views/InstallTeamsTool.vue';
import FieldTrackerTool from '@/views/FieldTrackerTool.vue';
import FieldTrackerProjectViewer from '@/views/FieldTrackerProjectViewer.vue';
import FieldTrackerScopeEditor from '@/views/FieldTrackerScopeEditor.vue';
import FieldTrackerHighLevelReportViewer from '@/views/FieldTrackerHighLevelReportViewer.vue';
import WorkforceTeamLeads from '@/views/WorkforceTeamLeads.vue';
import WorkforceWorkers from '@/views/WorkforceWorkers.vue';
import ProjectAssignerTeamLeads from '@/views/ProjectAssignerTeamLeads.vue';
import DataDictionaryReportViewer from '@/views/DataDictionaryReportViewer.vue';
import LaborManagerAssignedProjects from '@/views/LaborManagerAssignedProjects.vue';
import LaborManagerProjectScopeViewer from '@/views/LaborManagerProjectScopeViewer.vue';
import LaborManagerHoursSubmittedViewer from '@/views/LaborManagerHoursSubmittedViewer.vue';
import LaborManagerBlockingIssueViewer from '@/views/LaborManagerBlockingIssueViewer.vue';
import LaborManagerReadyTaskSummaryViewer from '@/views/LaborManagerReadyTaskSummaryViewer.vue';
import TaskSubmissionViewer from '@/views/TaskSubmissionViewer.vue';
import { installTrackerRoutes } from '@/views/InstallTracker/installTrackerRoute';
import { inspectionTrackerRoutes } from '@/views/inspectionTracker/inspectionTrackerRoute';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { storeToRefs } from 'pinia';
import { SessionStorageService } from '@/util/sessionStorageService';
import type { ModeTool } from '@/interfaces/common/modeTool';
import { ref } from 'vue';
import { featureFlags } from '@/config/featureFlags';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, allowedInOffline: true },
  },
  {
    path: '/install-teams',
    name: 'install-teams',
    component: InstallTeamsTool,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'controlsmanager'] },
  },
  {
    path: '/field-tracker',
    name: 'field-tracker',
    component: FieldTrackerTool,
    meta: {
      requiresAuth: true,
      allowedRoles: [
        'admin',
        'installdirector',
        'controlsmanager',
        'projectmanager',
        'installmanager',
        'estimator',
      ],
    },
  },
  {
    path: '/field-tracker/project-viewer/:id/:mode',
    name: 'field-tracker-project-viewer',
    component: FieldTrackerProjectViewer,
    meta: {
      requiresAuth: true,
      allowedRoles: [
        'admin',
        'installdirector',
        'controlsmanager',
        'projectmanager',
        'installmanager',
        'estimator',
      ],
    },
  },
  {
    path: '/field-tracker/project-viewer/:id/scope-editor',
    name: 'field-tracker-project-scope-editor',
    component: FieldTrackerScopeEditor,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'controlsmanager'] },
  },
  {
    path: '/field-tracker/project/:id/high-level-report',
    name: 'field-tracker-high-level-report',
    component: FieldTrackerHighLevelReportViewer,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'controlsmanager'] },
  },
  {
    path: '/workforce/team-leads',
    name: 'workforce-team-leads',
    component: WorkforceTeamLeads,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'installDirector'] },
  },
  {
    path: '/workforce/workers',
    name: 'workforce-workers',
    component: WorkforceWorkers,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'installDirector'] },
  },
  {
    path: '/project-assigner/team-leads',
    name: 'project-assigner-team-leads',
    component: ProjectAssignerTeamLeads,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'installDirector'] },
  },
  {
    path: '/labor-manager/assigned-projects/active',
    name: 'labor-manager-assigned-projects-active',
    component: LaborManagerAssignedProjects,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'teamlead', 'installdirector'] },
  },
  {
    path: '/labor-manager/project-scope/:id',
    name: 'labor-manager-project-scope',
    component: LaborManagerProjectScopeViewer,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'teamlead', 'installdirector'] },
  },
  {
    path: '/labor-manager/hours-submitted/:id',
    name: 'labor-manager-hours-submitted',
    component: LaborManagerHoursSubmittedViewer,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'teamlead', 'installdirector'] },
  },
  {
    path: '/labor-manager/project-scope/:id/blocking-issue/:issueId',
    name: 'labor-manager-blocking-issue',
    component: LaborManagerBlockingIssueViewer,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'teamlead', 'installdirector'] },
  },
  {
    path: '/labor-manager/ready-tasks/summary',
    name: 'labor-manager-task-summary',
    component: LaborManagerReadyTaskSummaryViewer,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'teamlead', 'installdirector'],
      allowedInOffline: featureFlags.laborManagerReadyTaskSummary,
    },
  },
  {
    path: '/project-scope/:projectId/unit-by-scope/:unitId/task-submission/:taskId',
    name: 'task-submission-viewer',
    component: TaskSubmissionViewer,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'teamlead', 'worker', 'installdirector'],
      allowedInOffline: true,
    },
  },
  {
    path: '/reports/data-dictionary-report/view',
    name: 'data-dictionary-report-view',
    component: DataDictionaryReportViewer,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'powerUser', 'executive', 'director', 'controlsmanager'],
    },
  },
  ...installTrackerRoutes,
  ...inspectionTrackerRoutes,
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

let previousRoute: RouteLocationNormalized | null = null;
export const beforeEachGuard = async (
  to: any,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  previousRoute = from; // store previous route
  const sessionStorageService = new SessionStorageService();

  const authStore = useAuthStore();
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);
  const allowedRoles = to.meta.allowedRoles as [];
  const allowedInOffline = to.meta.allowedInOffline as boolean;

  if (to.name === 'task-submission-viewer') {
    const taskId = to.params.taskId as string;
    const sessionKey = `taskSubmissionViewer_task_${taskId}`;
    const config = ref<ModeTool | null>(sessionStorageService.getItem(sessionKey));

    if (!config.value) return next('/dashboard');
  }

  if (isOffline.value && !allowedInOffline) return next('/dashboard');

  if (isOffline.value) authStore.useCachedData();

  if (!authStore.isUserDataReady) {
    await authStore.fetchAndSetUserInfo();
  }

  if (!authStore.hasCheckedWorkerInfo) {
    await authStore.ihiWorker();
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roleCheckers = {
      admin: authStore.hasAdminRole,
      executive: authStore.hasExecutiveRole,
      installdirector: authStore.hasInstallDirectorRole,
      poweruser: authStore.hasPowerUserRole,
      projectcoordinator: authStore.hasProjectCoordinatorRole,
      installmanager: authStore.hasInstallManagerRole,
      controlsmanager: authStore.hasControlsManagerRole,
      projectmanager: authStore.hasProjectManagerRole,
      teamlead: authStore.hasTeamLeadRole,
      worker: authStore.hasWorkerRole,
      estimator: authStore.hasEstimatorRole,
      isUserDataReady: authStore.isUserInfoLoaded,
      isIhiWorker: authStore.hasCheckedWorkerInfo,
    };

    const hasRequiredRole = allowedRoles.some((role) => roleCheckers[role]);

    if (!hasRequiredRole) {
      console.warn('User does not have the required role, but access is allowed.');
    }
  }

  return next();
};

export function getPreviousRoute() {
  return previousRoute;
}

router.beforeEach(beforeEachGuard);
export default router;
