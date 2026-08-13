import { mount, flushPromises } from '@vue/test-utils';
import FieldTrackerTool from '../../src/views/FieldTrackerTool.vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToolStore } from '../../src/stores/toolStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

vi.mock('@/stores/toolStore');
vi.mock('@/stores/useAuthStore');

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    default: {
      ...actual.default,
      create: actual.default.create,
    },
  };
});

vi.mock('vue-router', async () => {
  const actual = (await vi.importActual('vue-router')) as object;
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
    onBeforeRouteLeave: vi.fn(),
  };
});

describe('FieldTrackerTool.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock store values
    (useAuthStore as any).mockReturnValue({
      tdUserId: 1,
      userInfo: {
        clientPrincipal: {
          userRoles: ['admin'],
        },
      },
      isUserDataReady: true,
      hasAdminRole: true,
      hasControlsManagerRole: false,
      fetchAndSetUserInfo: vi.fn(),
    });

    (useToolStore as any).mockReturnValue({
      setActiveFieldTrackerTab: vi.fn(),
      setFieldTrackerProjectsData: vi.fn().mockResolvedValue(undefined),
      getFieldTrackerProjectsData: vi.fn().mockResolvedValue({ data: [], error: null }),
      isToolOpen: false,
      closeTool: vi.fn(),
      getNavigationDetails: vi.fn(),
      setNavigationDetails: vi.fn(),
    });

    // Set required localStorage keys
    localStorage.setItem('activeFieldTrackerTab', 'active');
    localStorage.setItem('toastMessage', 'Test toast message');

    wrapper = mount(FieldTrackerTool, {
      global: {
        stubs: [
          'v-select',
          'Field',
          'TopNavBar',
          'ToolHeader',
          'ConfirmModal',
          'ActiveProjectsTable',
          'CompletedProjectsTable',
          'DeletedProjectsTable',
        ],
      },
    });
  });

  it('renders and loads initial data', async () => {
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Test toast message');
  });

  it('switches tabs when clicked', async () => {
    const completedTab = wrapper.findAll('.nav-link')[1];
    await completedTab.trigger('click');
    expect(wrapper.vm.activeTab).toBe('completed');
  });

  it('opens new project modal when create button is clicked', async () => {
    const createBtn = wrapper.find('.btn-new-project');
    await createBtn.trigger('click');
    await flushPromises();

    expect(wrapper.find('#createProjectModal').exists()).toBe(true);
  });
});
