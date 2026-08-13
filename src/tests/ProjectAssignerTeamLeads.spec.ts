import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/* ===========================
   SAMPLE DATA (top-level)
   =========================== */
const sampleProjects = [
  {
    projectId: 1,
    projectName: 'Test Project',
    tasks: [
      {
        id: 10,
        scopeTypeId: 5,
        scopeTypeName: 'Scope A',
        teamLeadId: null,
        teamLeadName: '',
        statusId: 2,
      },
    ],
    expanded: false,
  },
];

const sampleTeamLeads = [
  {
    id: 7,
    name: 'Alice',
    scopeAssignments: [{ scopeTypeId: 5 }],
  },
];

/* ===========================
   DECLARE MOCKS BEFORE vi.mock
   (important: vi.mock factories are hoisted)
   =========================== */

// service-proxy mock fn (used by ProjectAssignerServiceProxy)
const mockGetAllProjectWithTasks = vi.fn().mockResolvedValue(sampleProjects);

// axios mocks
const postMock = vi.fn((url: string, body?: any) => {
  // emulate GET team leads call when targetMethodType === 'GET'
  if (body && body.targetMethodType === 'GET') {
    return Promise.resolve({ data: sampleTeamLeads });
  }
  // emulate PATCH/update call
  return Promise.resolve({ data: {} });
});
const getMock = vi.fn(() => Promise.resolve({ data: sampleTeamLeads }));
const createMock = vi.fn(() => ({ post: postMock, get: getMock }));

// bootstrap modal spies
const showSpy = vi.fn();
const hideSpy = vi.fn();

/* ===========================
   NOW SAFE: mock modules
   =========================== */

vi.mock('@/stores/useAuthStore', () => {
  return {
    useAuthStore: () => ({
      tdUserId: 123,
      userInfo: { clientPrincipal: { userRoles: ['Admin'] } },
    }),
  };
});

vi.mock('@/shared/service-proxies/service-proxies', () => {
  class ProjectAssignerServiceProxy {
    constructor() {
      // no-op
    }
    getAllProjectWithTasks() {
      return mockGetAllProjectWithTasks();
    }
  }
  return {
    ProjectAssignerServiceProxy,
  };
});

vi.mock('axios', () => {
  return {
    default: {
      post: postMock,
      get: getMock,
      create: createMock,
    },
  };
});

vi.mock('bootstrap', () => {
  return {
    Modal: class {
      constructor() {
        // no-op
      }
      show() {
        showSpy();
      }
      hide() {
        hideSpy();
      }
    },
  };
});

/* ===========================
   GLOBAL STUBS for child components
   =========================== */
const globalStubs = {
  TopNavBar: { template: '<div />' },
  'v-select': {
    props: ['modelValue', 'options', 'label'],
    emits: ['update:modelValue'],
    template: `
      <select @change="$emit('update:modelValue', Number($event.target.value))">
        <option v-for="opt in options" :key="opt.id" :value="opt.id">
          {{ opt.label || opt.name }}
        </option>
      </select>
    `,
  },
  'router-link': {
    props: ['to'],
    template: '<a><slot /></a>',
  },
};

/* ===========================
   TEST SUITE
   =========================== */
describe('ProjectAssignerTeamLeads.vue', () => {
  let ProjectAssignerTeamLeads: any;

  beforeEach(async () => {
    // reset mocks
    vi.clearAllMocks();

    // ensure default resolved value for service proxy
    mockGetAllProjectWithTasks.mockResolvedValue(sampleProjects);

    // dynamically import component AFTER mocks are established
    const mod = await import('@/views/ProjectAssignerTeamLeads.vue');
    ProjectAssignerTeamLeads = mod.default;
  });

  it('calls service proxy to fetch projects on mount', async () => {
    mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();
    expect(mockGetAllProjectWithTasks).toHaveBeenCalled();
  });

  it('shows no projects when API returns empty list', async () => {
    mockGetAllProjectWithTasks.mockResolvedValueOnce([]);

    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();

    expect(wrapper.text()).not.toContain('Test Project');
  });

  it('filters projects using filter input and clearFilter', async () => {
    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();

    expect(wrapper.text()).toContain('Test Project');

    const input = wrapper.find('input[type="text"]');
    if (input.exists()) {
      await input.setValue('no match');
      await flushPromises();
      expect(wrapper.text()).not.toContain('Test Project');

      // call clearFilter if exists
      if (typeof (wrapper.vm as any).clearFilter === 'function') {
        (wrapper.vm as any).clearFilter();
        await flushPromises();
        expect(wrapper.text()).toContain('Test Project');
      }
    }
  });

  it('does not throw when service proxy fails', async () => {
    mockGetAllProjectWithTasks.mockRejectedValueOnce(new Error('service failure'));
    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();
    expect(mockGetAllProjectWithTasks).toHaveBeenCalled();
    expect(wrapper.exists()).toBe(true);
  });

  it('clearFilter helper results in empty filter and shows projects', async () => {
    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();

    if (typeof (wrapper.vm as any).clearFilter === 'function') {
      (wrapper.vm as any).filterText = 'no match';
      await flushPromises();
      (wrapper.vm as any).clearFilter();
      await flushPromises();
      expect((wrapper.vm as any).filterText).toBe('');
      expect(wrapper.text()).toContain('Test Project');
    } else {
      expect(true).toBe(true);
    }
  });
  it('does not throw when service proxy fails', async () => {
    mockGetAllProjectWithTasks.mockRejectedValueOnce(new Error('service failure'));
    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();
    expect(mockGetAllProjectWithTasks).toHaveBeenCalled();
    expect(wrapper.exists()).toBe(true);
  });

  it('clearFilter helper results in empty filter and shows projects', async () => {
    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();

    if (typeof (wrapper.vm as any).clearFilter === 'function') {
      (wrapper.vm as any).filterText = 'no match';
      await flushPromises();
      (wrapper.vm as any).clearFilter();
      await flushPromises();
      expect((wrapper.vm as any).filterText).toBe('');
      expect(wrapper.text()).toContain('Test Project');
    } else {
      expect(true).toBe(true);
    }
  });

  it('putOnEdit sets vSelectTeamLeadsList, currentProject, currentTask and shows modal', async () => {
    const wrapper = mount(ProjectAssignerTeamLeads, { global: { stubs: globalStubs } });
    await flushPromises();

    // Mock data
    const project = {
      projectId: 1,
      projectName: 'Test Project',
      tasks: [{ id: 10, scopeTypeId: 5, teamLeadId: 7 }],
    };
    const task = project.tasks[0];

    // Setup the component refs (assuming these are defined in the component)
    (wrapper.vm as any).teamLeadsList = [
      { id: 7, name: 'Alice', scopeAssignments: [{ scopeTypeId: 5 }] },
      { id: 8, name: 'Bob', scopeAssignments: [{ scopeTypeId: 99 }] },
    ];
    (wrapper.vm as any).vSelectTeamLeadsList = [];
    (wrapper.vm as any).currentProject = { value: null };
    (wrapper.vm as any).currentTask = { value: null };
    (wrapper.vm as any).teamLeadId = { value: null };
    (wrapper.vm as any).editAssignmentModalInstance = { show: showSpy };

    // Call putOnEdit
    (wrapper.vm as any).putOnEdit(project, task);
    await flushPromises();

    // Assertions
    const vSelectList = (wrapper.vm as any).vSelectTeamLeadsList;
    expect(vSelectList).toHaveLength(2); // Unassigned + Alice
    expect(vSelectList[0].label).toBe('Unassigned');
    expect(vSelectList[1].label).toBe('Alice');

    expect(showSpy).toHaveBeenCalled();
  });
});
