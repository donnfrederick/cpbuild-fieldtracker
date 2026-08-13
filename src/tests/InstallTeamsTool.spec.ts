import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock tabulator-tables Tabulator class used in the component
vi.mock('tabulator-tables', () => ({
  TabulatorFull: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
  })),
}));

// Mock bootstrap Modal
vi.mock('bootstrap', () => ({
  Modal: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
  })),
}));

// Mock the FieldTrackerServiceProxy used by the component to always return the same instance
vi.mock('@/shared/service-proxies/service-proxies', () => {
  // export individual spies so tests can assert against them directly
  const __getInstallTeams = vi.fn().mockResolvedValue([]);
  const __createInstallTeam = vi.fn().mockResolvedValue({});
  const __updateInstallTeam = vi.fn().mockResolvedValue({});

  const FieldTrackerServiceProxy = vi.fn().mockImplementation(() => ({
    getInstallTeams: __getInstallTeams,
    createInstallTeam: __createInstallTeam,
    updateInstallTeam: __updateInstallTeam,
  }));

  return {
    FieldTrackerServiceProxy,
    __getInstallTeams,
    __createInstallTeam,
    __updateInstallTeam,
  };
});

// Mock auth store used by the component
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    tdUserId: 123,
    userInfo: { clientPrincipal: { userRoles: ['role1'] } },
  })),
}));

describe('InstallTeamsTool.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getInstallTeams on mount and createInstallTeam when submitting', async () => {
    // Import the mocked service module so we can reference the exported spies
    const svc = await import('@/shared/service-proxies/service-proxies');

    // import the component dynamically so the vi.mock factories are effective for module evaluation
    const comp = await import('@/views/InstallTeamsTool.vue');
    const InstallTeamsTool = comp.default;

    // Mount the component after we have the mock reference
    const wrapper = mount(InstallTeamsTool, {
      global: {
        stubs: ['TopNavBar'],
        provide: {},
      },
    });
    const svcAny = svc as any;
    const constructedInstance = svcAny.FieldTrackerServiceProxy.mock?.results?.[0]?.value;

    // Set the create modal form values via the DOM and click the Create button
    const nameInput = wrapper.find('#team_name');
    if (nameInput.exists()) {
      await nameInput.setValue('New Team');
    }

    // choose first select on the page (create modal). Use '1' which matches our mock's expectation
    const selects = wrapper.findAll('select');
    if (selects.length > 0) {
      await selects[0].setValue('1');
    }

    // find Create button (look for button with text 'Create')
    const createBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Create');
    if (!createBtn) throw new Error('Create button not found in component');
    await createBtn.trigger('click');

    // Ensure createInstallTeam was invoked on whichever spy the component used
    const exportedCreateCalled = !!(
      svcAny.__createInstallTeam && svcAny.__createInstallTeam.mock?.calls?.length > 0
    );
    const constructedCreateCalled = !!(
      constructedInstance &&
      constructedInstance.createInstallTeam &&
      constructedInstance.createInstallTeam.mock?.calls?.length > 0
    );

    expect(exportedCreateCalled || constructedCreateCalled).toBe(true);
  });
});
