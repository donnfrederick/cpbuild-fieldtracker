import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TopNavBar from '@/components/TopNavBar.vue';
import { createTestingPinia } from '@pinia/testing';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useAuthStore } from '@/stores/useAuthStore';

describe('TopNavBar.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = (options = {}) =>
    mount(TopNavBar, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
      },
      ...options,
    });

  it('renders the navbar with the title', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Tools Dashboard');
  });

  it('displays the user’s email from the auth store', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    // Inject auth state before mounting
    const authStore = useAuthStore();
    authStore.userInfo = {
      clientPrincipal: {
        userId: 'test-user-id',
        userRoles: ['authenticated'],
        claims: [],
        allowedRoles: ['admin'],
        identityProvider: 'test-provider',
        userDetails: 'test.user@example.com',
      },
    };

    const wrapper = mount(TopNavBar, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('test.user@example.com');
  });

  it('shows offline mode banner when offline', async () => {
    const wrapper = mountComponent();
    const networkStore = useNetworkStore();
    networkStore.isOffline = true;

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain('(Offline Mode');
    expect(wrapper.find('.navbar-offline').exists()).toBe(true);
  });

  it('does not show offline mode banner when online', () => {
    const wrapper = mountComponent();
    const networkStore = useNetworkStore();
    networkStore.isOffline = false;

    expect(wrapper.html()).not.toContain('(Offline Mode');
    expect(wrapper.find('.navbar-offline').exists()).toBe(false);
  });

  it('applies the correct navbar class when offline', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const networkStore = useNetworkStore();
    networkStore.isOffline = true; // ✅ set before mount

    const wrapper = mount(TopNavBar, {
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();

    const nav = wrapper.get('nav');
    expect(nav.classes()).toContain('navbar-offline');
    expect(nav.classes()).not.toContain('navbar-dark');
  });

  it('does not render popover icon when online', () => {
    const networkStore = useNetworkStore();
    networkStore.isOffline = false;

    const wrapper = mountComponent();
    const popoverIcon = wrapper.find('[data-bs-toggle="popover"]');
    expect(popoverIcon.exists()).toBe(false);
  });
});
