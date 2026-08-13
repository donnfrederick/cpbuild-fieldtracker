import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SecondaryTasksQueue from '@/components/SecondaryTasksQueue.vue'; // Adjust if path differs
import type { InstallTrackerTaskQueue } from '@/interfaces/installTracker';

describe('SecondaryTasksQueue.vue', () => {
  const currentUserName = 'Jane Doe';

  const validItem: InstallTrackerTaskQueue = {
    taskId: 1,
    scheduledDate: new Date('2025-06-19'),
    secondaryWorkerName: currentUserName,
    primaryWorkerName: 'John Smith',
    building: '',
    level: 0,
    unit: '',
    area: 0,
    unitType: '',
    unitId: 0,
    unitByScopeId: 0,
    unitPhaseName: '',
    unitStatusName: '',
    progress: 0,
    taskTypeId: 0,
    taskTypeName: '',
    taskStatusId: 0,
    taskStatusName: '',
    phaseId: 0,
    dateCreated: new Date('2025-06-19'),
    createdBy: '',
    assignedWorkerId: 1,
    phaseName: null,
  };

  const invalidItem: InstallTrackerTaskQueue = {
    taskId: 2,
    scheduledDate: null,
    secondaryWorkerName: currentUserName,
    primaryWorkerName: 'Leader B',
    building: '',
    level: 0,
    unit: '',
    area: 0,
    unitType: '',
    unitId: 0,
    unitByScopeId: 0,
    unitPhaseName: '',
    unitStatusName: '',
    progress: 0,
    taskTypeId: 0,
    taskTypeName: '',
    taskStatusId: 0,
    taskStatusName: '',
    phaseId: 0,
    dateCreated: new Date('2025-06-19'),
    createdBy: '',
    assignedWorkerId: 1,
    phaseName: null,
  };

  it('renders only items with valid scheduledDate', () => {
    const wrapper = mount(SecondaryTasksQueue, {
      props: {
        items: [validItem, invalidItem],
      },
      global: {
        stubs: ['UnitInfo', 'TaskInfo'],
      },
    });

    // Check if one task was rendered
    const renderedTasks = wrapper.findAll('.task-container');
    expect(renderedTasks.length).toBe(1);

    // Make sure it's the one with valid date
    expect(validItem.primaryWorkerName).toBeDefined();
    expect(wrapper.html()).toContain(validItem.primaryWorkerName as string);
    expect(invalidItem.primaryWorkerName).toBeDefined();
    expect(wrapper.html()).not.toContain(invalidItem.primaryWorkerName as string);
  });
});
