import InspectionTrackerAssignedProjectScope from './InspectionTrackerAssignedProjectScope.vue';
import InspectionQueue from '@/views/inspectionTracker/InspectionQueue.vue';
import CompletedInspections from '@/views/inspectionTracker/CompletedInspections.vue';

export const inspectionTrackerRoutes = [
  {
    path: '/inspection-tracker/project-scopes',
    name: 'inspection-tracker-project-scopes',
    component: InspectionTrackerAssignedProjectScope,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'teamlead', 'installmanager', 'installdirector'],
    },
  },
  {
    path: '/inspection-tracker/:projectScopeId/inspection-queue',
    name: 'inspection-tracker-inspection-queue',
    component: InspectionQueue,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'teamlead', 'installmanager', 'installdirector'],
    },
  },
  {
    path: '/inspection-tracker/:projectScopeId/completed-inspections',
    name: 'inspection-tracker-completed-inspections',
    component: CompletedInspections,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'teamlead', 'installmanager', 'installdirector'],
    },
  },
];
