import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MainTasksQueue from '@/components/MainTasksQueue.vue';
import { InstallTrackerTaskQueueDto } from '@/shared/service-proxies/service-proxies';

const sampleItem = new InstallTrackerTaskQueueDto();

sampleItem.building = 'A';
sampleItem.level = '1';
sampleItem.unit = '101';
sampleItem.area = '500';
sampleItem.unitType = 'Standard';
sampleItem.unitByScopeId = 2001;
sampleItem.unitPhaseName = 'Assembly';
sampleItem.unitStatusName = 'Started';
sampleItem.progress = 0;
sampleItem.taskId = 3001;
sampleItem.taskTypeId = 1;
sampleItem.taskTypeName = 'Main';
sampleItem.phaseId = 10;
sampleItem.phaseName = 'Assembly';
sampleItem.taskStatusId = 1;
sampleItem.taskStatusName = 'Ready';
sampleItem.dateCreated = new Date('2025-06-01T10:00:00Z');
sampleItem.createdBy = 'John Doe';
sampleItem.scheduledDate = new Date('2025-06-13T08:00:00Z');
sampleItem.parentTaskId = 1;
sampleItem.parentTaskTypeName = 'Main';
sampleItem.parentTaskStatusName = 'Ready';
sampleItem.secondaryWorkerId = 2;
sampleItem.secondaryWorkerName = 'Jane Doe';
sampleItem.assignedWorkerId = 1;

const sampleItems: InstallTrackerTaskQueueDto[] = [sampleItem];

describe('MainTasksQueue.vue', () => {
  it('only renders items with valid status and scheduled date', () => {
    const wrapper = mount(MainTasksQueue, {
      props: {
        items: sampleItems,
      },
    });

    const validItems = sampleItems.filter(
      (item) =>
        ['Ready', 'Started'].includes(item.unitStatusName) &&
        ['Ready', 'Started'].includes(item.taskStatusName) &&
        item.scheduledDate !== null &&
        item.unitPhaseName === item.phaseName &&
        item.assignedWorkerId !== null
    );

    const renderedTaskContainers = wrapper.findAll('.task-container');
    expect(renderedTaskContainers.length).toBe(validItems.length);
  });
});
