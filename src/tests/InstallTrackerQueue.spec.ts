import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import InstallTrackerUnitTaskQueue from '@/views/InstallTracker/InstallTrackerUnitTaskQueue.vue';
import type { InstallTrackerTaskQueue, ProjectByScopeDetails } from '@/interfaces/installTracker';

// Mock child components
vi.mock('@/components/SecondaryTasksQueue.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/UnitTaskQueueSubmissionLog.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('@/components/modal/ProjectWorkSubmissionEditModal.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('@/components/modal/ProjectWorkSubmissionCreateModal.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('@/components/BlockedUnitsQueue.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/MainTasksQueue.vue', () => ({ default: '<div />' }));
vi.mock('@/components/SubTaskQueue.vue', () => ({ default: '<div />' }));
vi.mock('@/components/TopNavWithOverlay.vue', () => ({ default: { template: '<div />' } }));

// Mock composables and services
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    tdUserId: 1,
    userInfo: {
      clientPrincipal: {
        userRoles: ['admin'],
      },
    },
  }),
}));
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    params: { id: 123 },
  }),
}));
vi.mock('@/services/installTracker', () => ({
  InstallTrackerService: vi.fn().mockImplementation(() => ({
    projectByScopeDetailsApi: vi.fn().mockResolvedValue({
      id: 1,
      ftProjectId: 1,
      projectId: 1,
      projectName: 'Test Project',
      scopeTypeId: 1,
      scopeTypeName: 'Scope',
      statusId: 1,
      statusName: 'Active',
      teamLeadId: 1,
      teamLeadUserId: 1,
    }),
    isIhiWorkerApi: vi.fn().mockResolvedValue({
      id: 2,
      userId: 1,
      name: 'Worker',
      email: 'worker@test.com',
    }),
    workHourSubmissionsByWorkerAndProjectScopeApi: vi.fn().mockResolvedValue({
      result: [
        {
          id: 1,
          projectName: 'Test Project',
          scopeTypeName: 'Scope',
          submitTypeId: 1,
          submitTypeName: 'Type',
          statusId: 1,
          statusName: 'Submitted',
          hours: 1.5,
          quantity: 2,
          hoursArr: [1, 30],
          submissionDate: '2024-06-01T00:00:00Z',
          submittedBy: 'User',
          submissionNotes: 'Notes',
          managerNotes: 'Manager Notes',
          hoursOverride: 2,
          hoursOverrideArr: [2, 0],
          quantityOverride: 0,
          images: [],
          taskStatusId: 1,
        },
      ],
    }),
    getPendingSubtasks: vi.fn().mockResolvedValue([]),
    getPendingMainTasks: vi.fn().mockResolvedValue([]),
    getSecondaryTasks: vi.fn().mockResolvedValue([]),
    getBlockedUnits: vi.fn().mockResolvedValue([]),
    workHourSubmissionDeleteApi: vi.fn().mockResolvedValue({}),
  })),
}));
vi.mock('@/services/laborManager', () => ({
  unitDataApi: vi.fn().mockResolvedValue({
    data: {
      result: {
        area: '',
        building: '',
        completionDate: '',
        currentPhaseId: 0,
        currentPhaseName: '',
        fieldTrackerProjectRowId: 0,
        finalCumulativePercent: 0,
        id: 0,
        incrementalWeightPercent: 0,
        initialCumulativePercent: 0,
        level: '',
        projectByScopeId: 0,
        projectScopeTypeId: 0,
        projectScopeTypeName: '',
        unit: '',
        unitProgressPercent: 0,
        unitStatusId: 0,
        unitStatusName: '',
        unitType: '',
        blockingIssues: [],
        quantities: 0,
        mainTasks: [],
        subtasks: [],
      },
    },
  }),
}));

const mountWithSubtasks = (
  subTasks: InstallTrackerTaskQueue[] = [],
  mainTasks: InstallTrackerTaskQueue[] = [],
  userRoles = ['install-tracker'],
  projectByScopeDetails = {} as ProjectByScopeDetails
) => {
  const wrapper = mount(InstallTrackerUnitTaskQueue, {
    global: {
      stubs: {
        'router-link': true,
      },
      mocks: {
        $route: {
          params: { id: 123 },
        },
        $router: {
          push: vi.fn(),
        },
      },
    },
  });

  // These are Vue refs inside the component, so assign .value to them
  (wrapper.vm as any).subTasks.value = subTasks;
  (wrapper.vm as any).mainTasks.value = mainTasks;
  (wrapper.vm as any).userRoleString = userRoles.join(',');
  (wrapper.vm as any).projectByScopeDetails.value = projectByScopeDetails;
  (wrapper.vm as any).userId = 1;

  return wrapper;
};

describe('disableMainTaskActions logic', () => {
  it('Scenario 1: 4 subtasks across 4 unique units - should not disable action for main task', () => {
    const subtasks = [1, 2, 3, 4].map((id) => ({ unitByScopeId: id })) as InstallTrackerTaskQueue[];
    const wrapper = mountWithSubtasks(subtasks);
    expect(wrapper.vm.disableMainTaskActions()).toBe(false);
  });

  it('Scenario 2: 5 subtasks across only 3 unique units - should not disable action for main task', () => {
    const subtasks = [1, 1, 2, 2, 3].map((id) => ({
      unitByScopeId: id,
    })) as InstallTrackerTaskQueue[];
    const wrapper = mountWithSubtasks(subtasks);
    expect(wrapper.vm.disableMainTaskActions()).toBe(false);
  });

  it('Scenario 5: User is Install Manager - restriction should not apply', () => {
    const subtasks = [1, 2, 3, 4, 5, 6, 7].map((id) => ({
      unitByScopeId: id,
    })) as InstallTrackerTaskQueue[];
    const wrapper = mountWithSubtasks(subtasks, [], ['installmanager']);
    expect(wrapper.vm.disableMainTaskActions()).toBe(false);
  });

  it('Scenario 6: User is Team Lead - restriction should not apply', () => {
    const subtasks = [1, 2, 3, 4, 5, 6, 7].map((id) => ({
      unitByScopeId: id,
    })) as InstallTrackerTaskQueue[];
    const wrapper = mountWithSubtasks(subtasks, [], ['install-manager'], {
      teamLeadUserId: 1,
    } as ProjectByScopeDetails);
    expect(wrapper.vm.disableMainTaskActions()).toBe(false);
  });
});
