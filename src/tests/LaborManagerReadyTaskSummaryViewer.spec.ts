import { mount, flushPromises } from '@vue/test-utils';
import LaborManagerReadyTaskSummaryViewer from '@/views/LaborManagerReadyTaskSummaryViewer.vue';
import { createTestingPinia } from '@pinia/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {},
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
  onBeforeRouteLeave: vi.fn(),
}));

vi.mock('@/components/TopNavBar.vue', () => ({
  default: { template: '<div>TopNavBar</div>' },
}));
vi.mock('@/components/ReadyTasksSummaryButton.vue', () => ({
  default: { template: '<div>ReadyTasksSummaryButton</div>' },
}));

// Mock auth store
const mockAuthStore = {
  tdUserId: 1,
  userInfo: {
    clientPrincipal: {
      userRoles: ['labormanager'],
    },
  },
};
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock service proxies
const mockGetReadyTasksSummary = vi.fn();
const mockGetTaskSubmissionViewerDetailsBulk = vi.fn();
vi.mock('@/shared/service-proxies/service-proxies', () => ({
  LaborManagerServiceProxy: function () {
    return {
      getReadyTasksSummary: mockGetReadyTasksSummary,
    };
  },
  TaskSubmissionViewerServiceProxy: function () {
    return {
      getTaskSubmissionViewerDetailsBulk: mockGetTaskSubmissionViewerDetailsBulk,
    };
  },
  ReadyTasksSummaryDto: {},
}));

function factory(readyTasks: any[] = []) {
  const wrapper = mount(LaborManagerReadyTaskSummaryViewer, {
    global: {
      plugins: [createTestingPinia()],
      stubs: ['router-link', 'router-view'],
    },
  });

  (wrapper.vm as any).readyTasks = readyTasks;
  return wrapper;
}

describe('LaborManagerReadyTaskSummaryViewer.vue', () => {
  beforeEach(() => {
    mockGetReadyTasksSummary.mockReset();
  });

  it('shows multiple dropdowns for a project scope with main tasks and pending inspections', async () => {
    const wrapper = factory([
      {
        id: 1,
        projectName: 'Project Multi',
        scopeTypeName: 'Type X',
        submittedMainTasks: [{ id: 1 }, { id: 2 }],
        submittedSubTasks: [],
        pendingInspections: [{ id: 10 }],
        pendingReinspections: [],
      },
    ]);

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Project Multi');

    await wrapper.find('.scope-header').trigger('click');
    const types = wrapper.findAll('.type-header');
    expect(types.length).toBe(2);
    expect(types[0].text()).toContain('Submitted Main Tasks (2)');
    expect(types[1].text()).toContain('Pending Clear Inspections (1)');

    await types[0].trigger('click');
    expect(wrapper.findComponent({ name: 'ReadyTasksSummaryButton' }).exists()).toBe(true);

    await types[1].trigger('click');
    expect(wrapper.findAllComponents({ name: 'ReadyTasksSummaryButton' }).length).toBeGreaterThan(
      1
    );
  });

  it('shows only the submitted subtasks dropdown for a project scope with only subtasks', async () => {
    const wrapper = factory([
      {
        id: 2,
        projectName: 'Project Subtasks',
        scopeTypeName: 'Type Y',
        submittedMainTasks: [],
        submittedSubTasks: [{ id: 21 }, { id: 22 }, { id: 23 }],
        pendingInspections: [],
        pendingReinspections: [],
      },
    ]);

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Project Subtasks');

    await wrapper.find('.scope-header').trigger('click');
    const types = wrapper.findAll('.type-header');
    expect(types.length).toBe(1);
    expect(types[0].text()).toContain('Submitted Subtasks (3)');
    await types[0].trigger('click');
    expect(wrapper.findComponent({ name: 'ReadyTasksSummaryButton' }).exists()).toBe(true);
  });

  it('does not render a project scope with all empty queues', async () => {
    const wrapper = factory([
      {
        id: 3,
        projectName: 'Project Empty',
        scopeTypeName: 'Type Z',
        submittedMainTasks: [],
        submittedSubTasks: [],
        pendingInspections: [],
        pendingReinspections: [],
      },
    ]);

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.scope-header').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Project Empty');
  });

  it('shows no scopes when all project scopes are empty', async () => {
    const wrapper = factory([
      {
        id: 4,
        projectName: 'Empty 1',
        scopeTypeName: 'Type A',
        submittedMainTasks: [],
        submittedSubTasks: [],
        pendingInspections: [],
        pendingReinspections: [],
      },
      {
        id: 5,
        projectName: 'Empty 2',
        scopeTypeName: 'Type B',
        submittedMainTasks: [],
        submittedSubTasks: [],
        pendingInspections: [],
        pendingReinspections: [],
      },
    ]);

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.scope-header').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Empty 1');
    expect(wrapper.text()).not.toContain('Empty 2');
  });

  it('renders only scopes with pending or submitted items and hides empty ones', async () => {
    const wrapper = factory([
      {
        id: 6,
        projectName: 'Main Tasks Only',
        scopeTypeName: 'Type M',
        submittedMainTasks: [{ id: 601 }],
        submittedSubTasks: [],
        pendingInspections: [],
        pendingReinspections: [],
      },
      {
        id: 7,
        projectName: 'Reinspections Only',
        scopeTypeName: 'Type R',
        submittedMainTasks: [],
        submittedSubTasks: [],
        pendingInspections: [],
        pendingReinspections: [{ id: 701 }],
      },
      {
        id: 8,
        projectName: 'Completely Empty',
        scopeTypeName: 'Type E',
        submittedMainTasks: [],
        submittedSubTasks: [],
        pendingInspections: [],
        pendingReinspections: [],
      },
    ]);

    await flushPromises();

    const scopeHeaders = wrapper.findAll('.scope-header');
    expect(scopeHeaders.length).toBe(2);
    expect(wrapper.text()).toContain('Main Tasks Only');
    expect(wrapper.text()).toContain('Reinspections Only');
    expect(wrapper.text()).not.toContain('Completely Empty');
  });
});
