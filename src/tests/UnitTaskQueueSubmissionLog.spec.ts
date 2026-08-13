import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import UnitTaskQueueSubmissionLog from '@/components/UnitTaskQueueSubmissionLog.vue';
import type { WorkHourSubmissions } from '@/interfaces/workforce';

function getTodayMMDDYYYY() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

describe('UnitTaskQueueSubmissionLog', () => {
  it('shows "Edit" button if submission is today and taskStatusId <= 3', async () => {
    const today = getTodayMMDDYYYY();

    const wrapper = mount(UnitTaskQueueSubmissionLog, {
      props: {
        workerId: 1,
        projectByScopeId: 1,
        projectByScopeDetails: {
          id: 1,
          ftProjectId: 1,
          projectId: 2,
          projectName: 'Test Project',
          scopeTypeId: 1,
          scopeTypeName: 'Scope',
          statusId: 1,
          statusName: 'Active',
          teamLeadId: 1,
          teamLeadUserId: 1,
        },
        workHourSubmissions: [
          {
            id: 123,
            submissionDate: today,
            submitTypeName: 'Manual',
            taskTypeName: 'Install',
            payTypeName: 'Hourly',
            hours: 8,
            taskStatusId: 3,
          },
        ] as WorkHourSubmissions[],
      },
    });

    await wrapper.find('button.extract').trigger('click');

    const buttons = wrapper.findAll('button');
    const editButton = buttons.find((btn) => btn.text() === 'Edit');
    expect(editButton).toBeTruthy();
  });
});
