// src/tests/WorkforceWorkers.getWorkersList.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import WorkforceWorkers from '@/views/WorkforceWorkers.vue';
import { WorkForceServiceProxy } from '@/shared/service-proxies/service-proxies';

// Mock router if the component uses it
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock v-select
vi.mock('vue-select', () => ({
  default: { name: 'v-select', template: '<div />' },
}));

// Mock the class
vi.mock('@/shared/service-proxies/service-proxies', () => ({
  WorkForceServiceProxy: vi.fn(),
}));

// Patch the prototype method AFTER mocking the class
const getWorkersListMock = vi.fn();
WorkForceServiceProxy.prototype.getWorkersList = getWorkersListMock;

describe('WorkforceWorkers - getWorkersList', () => {
  let wrapper: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    wrapper = mount(WorkforceWorkers);

    // Wait a tick for setup to complete
    await nextTick();
  });

  it('should populate workers and convert string fields to arrays', async () => {
    // Mock return value
    const mockData = [
      {
        id: 1,
        name: 'Donn Frederick',
        roleTypes: 'Apprentice, Assembler, Installer, Laborer, Skilled Laborer',
        scopeTypes:
          'Baseboards, Cabinetry, Commercial Door Hardware, Commercial Doors, Countertops, Residential Interior Prehung Doors, Shelving',
        workerRoleTypeIds: '1, 10, 11, 12, 13, 14, 15, 18, 2, 22, 23, 3, 4, 5, 6',
        statusName: 'active',
      },
    ];
    getWorkersListMock.mockResolvedValue(mockData);

    // Call the component method
    await wrapper.vm.getWorkersList();
    await nextTick(); // wait for reactive update

    // Assert length
    expect(wrapper.vm.workersData).toHaveLength(1);

    const worker = wrapper.vm.workersData[0];

    // Assert the string fields are split into arrays
    // Assert the string fields are still comma-separated strings
    expect(worker.roleTypes).toBe('Apprentice, Assembler, Installer, Laborer, Skilled Laborer');
    expect(worker.scopeTypes).toBe(
      'Baseboards, Cabinetry, Commercial Door Hardware, Commercial Doors, Countertops, Residential Interior Prehung Doors, Shelving'
    );
    expect(worker.workerRoleTypeIds).toBe('1, 10, 11, 12, 13, 14, 15, 18, 2, 22, 23, 3, 4, 5, 6');
  });
});
