import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ReadyTasks from '@/components/ReadyTasksSummaryButton.vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UnitTasksAndProjectRowDto } from '@/shared/service-proxies/service-proxies';

// Mock Dexie service
vi.mock('@/shared/offlineDb/services/idbUpdateUnitTaskTSVService', () => ({
  IdbUpdateUnitTaskTSVService: {
    getByTaskIds: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Pinia store
vi.mock('@/stores/useNetworkStore', () => ({
  useNetworkStore: vi.fn(() => ({
    isOffline: { value: false },
  })),
}));

beforeEach(() => {
  setActivePinia(createPinia());
});

const validTasks = [
  {
    taskId: 1,
    unitByScopeId: 1,
    projectId: 1,
    taskTypeId: 1,
    taskTypeName: 'Main',
    phaseId: 2,
    phaseName: 'Assembly',
    statusId: 4,
    submittedAt: '2025-01-15',
    building: '7A',
    level: '3',
    unit: '2',
    area: '2',
    unitType: 'Restroom',
  },
  {
    taskId: 2,
    unitByScopeId: 2,
    projectId: 2,
    taskTypeId: 2,
    taskTypeName: 'Subtask',
    phaseId: 3,
    phaseName: 'Install',
    statusId: 4,
    submittedAt: '2025-01-15',
    building: '7A',
    level: '3',
    unit: '2',
    area: '2',
    unitType: 'Restroom',
  },
  {
    taskId: 3,
    unitByScopeId: 3,
    projectId: 3,
    taskTypeId: 1,
    taskTypeName: 'Main',
    phaseId: 4,
    phaseName: 'Clear Inspection',
    statusId: 2,
    submittedAt: '2025-01-15',
    building: '7A',
    level: '3',
    unit: '2',
    area: '2',
    unitType: 'Restroom',
  },
  {
    taskId: 4,
    unitByScopeId: 4,
    projectId: 4,
    taskTypeId: 2,
    taskTypeName: 'Subtask',
    phaseId: 4,
    phaseName: 'Clear Inspection',
    statusId: 2,
    submittedAt: '2025-01-15',
    building: '7A',
    level: '3',
    unit: '2',
    area: '2',
    unitType: 'Restroom',
  },
] as UnitTasksAndProjectRowDto[];

describe('ReadyTasksSummaryButton.vue', () => {
  it('renders all given tasks correctly', async () => {
    const wrapper = mount(ReadyTasks, {
      props: { tasks: validTasks },
    });

    await flushPromises();

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(validTasks.length);

    // Optionally confirm one field
    expect(wrapper.text()).toContain('Assembly');
  });
});
