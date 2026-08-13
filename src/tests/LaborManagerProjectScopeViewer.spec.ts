// src/tests/LaborManagerProjectScopeViewer.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import LaborManagerProjectScopeViewer from '@/views/LaborManagerProjectScopeViewer.vue';
import { useToolStore } from '@/stores/toolStore';
import {
  UnitByScopeServiceProxy,
  UnitTaskServiceProxy,
  WorkForceServiceProxy,
} from '@/shared/service-proxies/service-proxies';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 123 }, meta: { allowedRoles: ['Admin'] }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), currentRoute: { value: { path: '/' } } }),
  onBeforeRouteLeave: vi.fn(),
}));

// If you don't already have this in vitest.setup.ts:
vi.mock('vue-select', () => ({
  default: { name: 'v-select', template: '<div />' },
}));

const mockUnits = [
  {
    id: 1,
    building: 'Alpha Building',
    level: 'level1',
    unit: 'unit1',
    unitType: 'unitType1',
    currentPhaseId: 1,
    unitStatusId: 1,
  },
  {
    id: 2,
    building: 'Beta Building',
    level: 'level2',
    unit: 'unit2',
    unitType: 'unitType3',
    currentPhaseId: 2,
    unitStatusId: 1,
  },
  {
    id: 3,
    building: 'Gamma Building',
    level: 'level3',
    unit: 'unit3',
    unitType: 'unitType3',
    currentPhaseId: 3,
    unitStatusId: 3,
  },
];

function mountViewer(seed?: {
  units?: any[];
  phases?: any[];
  statusTypes?: any[];
  filters?: { keyword?: string; phaseId?: number | null; statusTypeId?: number | null };
}) {
  // 1) Create a single testing pinia
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: true,
  });

  // 2) Activate/seed the real store BEFORE mounting so setup() sees data
  const store = useToolStore();
  store.$patch((s) => {
    const st = s as any; // test-only: avoid strict typing issues
    st.units = seed?.units ?? [];
    st.phases = seed?.phases ?? [{ id: 10, name: 'Assembly' }];
    st.statusTypes = seed?.statusTypes ?? [
      { id: 1, name: 'Ready' },
      { id: 2, name: 'Started' },
    ];
    st.filters = {
      keyword: seed?.filters?.keyword ?? '',
      phaseId: seed?.filters?.phaseId ?? null,
      statusTypeId: seed?.filters?.statusTypeId ?? null,
    };
    st.isLoading = false;
  });

  // 3) Mount with that one pinia and stubs
  const wrapper = shallowMount(LaborManagerProjectScopeViewer, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: true,
        RouterView: true,
        ProjectScopeFilters: true,
        StatusLegend: true,
        'v-select': true,
      },
    },
  });

  // 4) Mirror into local refs if the component keeps its own state (defensive)
  const vm: any = wrapper.vm;
  if (seed?.units && 'units' in vm) vm.units = seed.units;
  if (seed?.filters?.keyword !== undefined && 'keyword' in vm) vm.keyword = seed.filters.keyword;
  if (seed?.filters?.phaseId != null && 'selectedPhases' in vm)
    vm.selectedPhases = [seed.filters.phaseId];
  if (seed?.filters?.statusTypeId != null && 'selectedStatusTypes' in vm)
    vm.selectedStatusTypes = [seed.filters.statusTypeId];

  return wrapper;
}

describe('LaborManagerProjectScopeViewer - Advanced Filters', () => {
  it('returns all units when no filters applied', () => {
    const wrapper = mountViewer({ units: mockUnits });
    const filtered = (wrapper.vm as any).filteredUnits;
    expect(filtered.length).toBe(3);
  });

  it('filters by keyword (building name)', async () => {
    const wrapper = mountViewer({ units: mockUnits, filters: { keyword: 'Alpha' } });
    await wrapper.vm.$nextTick();
    const filtered = (wrapper.vm as any).filteredUnits;
    expect(filtered.length).toBe(1);
    expect(filtered[0].building).toContain('Alpha');
  });

  it('filters by phase', async () => {
    const wrapper = mountViewer({ units: mockUnits, filters: { phaseId: 1 } });
    await wrapper.vm.$nextTick();
    const filtered = (wrapper.vm as any).filteredUnits;
    expect(filtered.length).toBe(1);
    expect(filtered.every((u: any) => u.currentPhaseId === 1)).toBe(true);
  });

  it('filters by statusType', async () => {
    const wrapper = mountViewer({ units: mockUnits, filters: { statusTypeId: 1 } });
    await wrapper.vm.$nextTick();
    const filtered = (wrapper.vm as any).filteredUnits;
    expect(filtered.length).toBe(2);
    expect(filtered.every((u: any) => u.unitStatusId === 1)).toBe(true);
  });

  it('applies multiple filters (phase + statusType)', async () => {
    const wrapper = mountViewer({ units: mockUnits, filters: { phaseId: 1, statusTypeId: 1 } });
    await wrapper.vm.$nextTick();
    const filtered = (wrapper.vm as any).filteredUnits;
    expect(filtered.length).toBe(1);
    expect(filtered[0].currentPhaseId).toBe(1);
    expect(filtered[0].unitStatusId).toBe(1);
  });

  it('calls unitByScopeServiceProxy and updates unit completionDate on change (confirm ok)', async () => {
    const unit = {
      id: 1,
      completionDate: '',
      mainTasks: [],
      subtasks: [],
      roleAssignments: [],
      currentPhaseId: 1,
      currentPhaseName: '',
      unitStatusId: 1,
      unitStatusName: '',
    };
    const wrapper = mountViewer({ units: [unit] });

    // Prepare mock result returned by the service proxy
    const mockResult = {
      unitByScopeId: 1,
      mainTasks: [{ taskId: 77 }],
      subTasks: [],
      roleAssignments: [],
      unitByScopePhaseId: 2,
      unitByScopePhaseName: 'Phase 2',
      statusId: 3,
      statusName: 'Ready',
    };

    // Spy on the prototype method used inside component
    const spy = vi
      .spyOn(UnitByScopeServiceProxy.prototype, 'setStagingDateAndReturnUnitTasks')
      .mockResolvedValue(mockResult as any);

    // Force confirm dialog to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Call the function directly with a fake event
    const newDate = '2025-10-28';
    await (wrapper.vm as any).updateStagingDate(
      (wrapper.vm as any).units[0],
      (wrapper.vm as any).units[0].completionDate,
      {
        target: { value: newDate },
      }
    );

    // Assertions
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        unitByScopeId: 1,
        completionDate: newDate,
        scopeTypeId: expect.any(Number),
        userId: expect.any(Number),
      })
    );

    expect((wrapper.vm as any).units[0].mainTasks).toEqual(mockResult.mainTasks);
    expect((wrapper.vm as any).units[0].completionDate).toBe(newDate);

    // cleanup
    spy.mockRestore();
    confirmSpy.mockRestore();
  });
  it('calls unitTaskServiceProxy and updates task scheduledDate on change (confirm ok)', async () => {
    const task = {
      taskId: 77,
      scheduledDate: null,
      phaseId: 2,
      statusId: 2,
      assignedWorkerId: 5,
      phaseName: 'Phase 2',
      statusName: 'Started',
      unitByScopeId: 1,
      submittedAt: '',
    };
    const unit = {
      id: 1,
      completionDate: '',
      mainTasks: [task],
      subtasks: [],
      roleAssignments: [],
      currentPhaseId: 2,
      currentPhaseName: '',
      unitStatusId: 1,
      unitStatusName: '',
      expanded: true,
    };

    const wrapper = mountViewer({ units: [unit] });

    const mockResult = {
      unitByScopeId: 1,
      mainTasks: [{ taskId: 77, scheduledDate: '2025-10-29' }],
      subTasks: [],
      roleAssignments: [],
      unitByScopePhaseId: 2,
      unitByScopePhaseName: 'Phase 2',
      statusId: 2,
      statusName: 'Started',
    };

    const spy = vi
      .spyOn(UnitTaskServiceProxy.prototype, 'setUnitTaskScheduleDateAndReturnTasks')
      .mockResolvedValue(mockResult as any);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const newDate = '2025-10-29';
    await (wrapper.vm as any).updateScheduleDate(
      (wrapper.vm as any).units[0],
      (wrapper.vm as any).units[0].mainTasks[0],
      {
        target: { value: newDate },
      }
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        unitTaskId: 77,
        scheduleDate: newDate,
        scopeTypeId: expect.any(Number),
        userId: expect.any(Number),
      })
    );

    expect((wrapper.vm as any).units[0].mainTasks).toEqual(mockResult.mainTasks);
    expect((wrapper.vm as any).units[0].mainTasks[0].scheduledDate).toBe(newDate);

    spy.mockRestore();
    confirmSpy.mockRestore();
  });
});

const getWorkersListMock = vi.fn();
WorkForceServiceProxy.prototype.getWorkersList = getWorkersListMock;

describe('LaborManagerProjectScopeViewer - getWorkersList', () => {
  let wrapper: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    wrapper = mount(LaborManagerProjectScopeViewer);

    // Wait a tick for setup to complete
    await nextTick();
  });

  it('should populate workers and convert string fields to arrays', async () => {
    // Step 2: Mock return value
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

    // Step 3: Call the component method
    await wrapper.vm.getWorkersList();

    // Step 4: Assert that strings are split into arrays
    expect(wrapper.vm.workers[0].roleTypes).toEqual([
      'Apprentice',
      'Assembler',
      'Installer',
      'Laborer',
      'Skilled Laborer',
    ]);
    expect(wrapper.vm.workers[0].scopeTypes).toEqual([
      'Baseboards',
      'Cabinetry',
      'Commercial Door Hardware',
      'Commercial Doors',
      'Countertops',
      'Residential Interior Prehung Doors',
      'Shelving',
    ]);
    expect(wrapper.vm.workers[0].workerRoleTypeIds).toEqual([
      '1',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '18',
      '2',
      '22',
      '23',
      '3',
      '4',
      '5',
      '6',
    ]);
  });
});
