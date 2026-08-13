import InstallTrackerActiveProjectScope from '@/views/InstallTracker/InstallTrackerActiveProjectScope.vue';
import InstallTrackerUnitTaskQueue from '@/views/InstallTracker/InstallTrackerUnitTaskQueue.vue';
import InstallTrackerSubmittedMainTasks from '@/views/InstallTracker/InstallTrackerSubmittedMainTasks.vue';
import InstallTrackerSubmittedUnitSubtasksView from '@/views/InstallTracker/InstallTrackerSubmittedUnitSubtasksView.vue';
import InstallTrackerReadyTaskSummary from '@/views/InstallTracker/InstallTrackerReadyTaskSummary.vue';
import { featureFlags } from '@/config/featureFlags';

export const installTrackerRoutes = [
  {
    path: '/install-tracker/project-scopes',
    name: 'install-tracker-project-scopes',
    component: InstallTrackerActiveProjectScope,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'worker', 'installdirector', 'teamlead'] },
  },
  {
    path: '/install-tracker/unit-task-queue/:id',
    name: 'install-tracker-unit-task-queue',
    component: InstallTrackerUnitTaskQueue,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'worker', 'installdirector', 'teamlead'] },
  },
  {
    path: '/install-tracker/main-tasks/:id',
    name: 'install-tracker-main-tasks',
    component: InstallTrackerSubmittedMainTasks,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'worker', 'installdirector', 'teamlead'] },
  },
  {
    path: '/install-tracker/:projectId/main-tasks/:unitByScopeId/sub-tasks',
    name: 'install-tracker-sub-tasks',
    component: InstallTrackerSubmittedUnitSubtasksView,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'worker', 'installdirector', 'teamlead'] },
  },
  {
    path: '/install-tracker/ready-tasks-summary',
    name: 'install-tracker-ready-tasks-summary',
    component: InstallTrackerReadyTaskSummary,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'worker', 'installdirector', 'teamlead'],
      allowedInOffline: featureFlags.installTrackerReadyTaskSummary,
    },
  },
];
