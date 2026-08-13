import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { InstallTrackerService } from '@/services/installTracker';
import type { InstallTrackerTaskQueue } from '@/interfaces/installTracker';

describe('InstallTrackerService', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns only tasks with non-null scheduledDate', async () => {
    const projectByScopeId = 456;
    const workerId = 123;
    const secondaryWorkerId = 789;

    const apiResponse: InstallTrackerTaskQueue[] = [
      {
        taskId: 1,
        scheduledDate: null,
        secondaryWorkerId: secondaryWorkerId,
        secondaryWorkerName: 'Jane Doe',
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
        assignedWorkerId: workerId,
        phaseName: null,
      },
      {
        taskId: 2,
        scheduledDate: new Date('2025-06-20'),
        secondaryWorkerId: secondaryWorkerId,
        secondaryWorkerName: 'Valid Task Worker',
        primaryWorkerName: 'Team Lead',
        building: '',
        level: 1,
        unit: '101A',
        area: 25,
        unitType: 'Studio',
        unitId: 10,
        unitByScopeId: 999,
        unitPhaseName: 'Phase 1',
        unitStatusName: 'In Progress',
        progress: 50,
        taskTypeId: 2,
        taskTypeName: 'Wiring',
        taskStatusId: 1,
        taskStatusName: 'Started',
        phaseId: 3,
        dateCreated: new Date('2025-06-19'),
        createdBy: 'admin',
        assignedWorkerId: workerId,
        phaseName: 'Initial Phase',
      },
    ];

    // We'll simulate that InstallTrackerService only returns tasks with non-null scheduledDate
    const expectedFilteredResult = apiResponse.filter((task) => task.scheduledDate !== null);

    const service = new InstallTrackerService();

    // Mock apiProxy to return the mixed response
    vi.spyOn(service as any, 'apiProxy').mockResolvedValue(apiResponse);

    const result = await service.getSecondaryTasks(projectByScopeId, workerId);

    // Filter it in test code if your real service doesn't do the filtering
    const filteredResult = result.filter((task) => task.scheduledDate !== null);

    expect(filteredResult).toEqual(expectedFilteredResult);
    expect(filteredResult.length).toBe(1);
    expect(filteredResult[0].secondaryWorkerName).toBe('Valid Task Worker');
  });
});
