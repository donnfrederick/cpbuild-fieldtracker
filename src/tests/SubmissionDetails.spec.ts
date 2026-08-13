import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SubmissionDetails from '@/components/TaskSubmission/SubmissionDetails.vue';
import type {
  TaskDetailDto,
  TaskSubmissionClearInspectionItemDto,
} from '@/shared/service-proxies/service-proxies';

describe('SubmissionDetails.vue', () => {
  it('renders correctly when phaseName is "Clear Inspection"', () => {
    const wrapper = mount(SubmissionDetails, {
      props: {
        taskDetails: {
          unitId: 1,
          parentTaskId: 1,
          parentTaskTypeId: 1,
          parentTaskTypeName: '',
          parentStatusId: 1,
          parentStatusName: '',
          taskTypeId: 1,
          taskTypeName: 'Main',
          phaseId: 1,
          phaseName: 'Clear Inspection',
          statusId: 1,
          statusName: '',
          imageAcknowledgmentChecked: false,
          imageAcknowledgmentText: '',
          assignedWorkerId: 1,
          assignedWorkerName: '',
          scheduledDate: new Date(),
          scheduledById: 1,
          submittedAt: new Date(),
          submittedBy: 1,
          submissionNotes: 'Some notes',
          reviewedAt: new Date(),
          reviewedBy: 1,
          reviewNotes: '',
          taskDetails: '',
          createdAt: new Date(),
          createdBy: 1,
          updatedAt: new Date(),
          updatedBy: 1,
          deletedAt: null,
          deletedBy: null,
          images: [],
          proofImages: [],
          reviewImages: [],
          rootMainTaskId: undefined,
          rootTaskTypeId: undefined,
          secondaryWorkerName: undefined,
          clearInspection: [
            {
              id: 1,
              itemTypeName: 'Checklist Item 1',
              itemTypeDescription: 'Check this one',
              isChecked: true,
            } as TaskSubmissionClearInspectionItemDto,
          ],
          subtasks: [],
        } as unknown as TaskDetailDto,
      },
    });

    // Assert checklist section appears
    expect(wrapper.text()).toContain('Clear Inspection Requirements Checklist');
    expect(wrapper.text()).toContain('Checklist Item 1');
  });

  it('does not render checklist section if taskTypeName is not "Main"', () => {
    const wrapper = mount(SubmissionDetails, {
      props: {
        taskDetails: {
          ...defaultTaskDetails,
          taskTypeName: 'Other',
        } as TaskDetailDto,
      },
    });

    expect(wrapper.text()).not.toContain('Clear Inspection Requirements Checklist');
  });
});

const defaultTaskDetails = {
  taskId: 1,
  unitId: 1,
  parentTaskId: 1,
  parentTaskTypeId: 1,
  parentTaskTypeName: '',
  parentStatusId: 1,
  parentStatusName: '',
  taskTypeId: 1,
  taskTypeName: 'Main',
  phaseId: 1,
  phaseName: '',
  statusId: 1,
  statusName: '',
  imageAcknowledgmentChecked: false,
  imageAcknowledgmentText: '',
  assignedWorkerId: 1,
  assignedWorkerName: '',
  scheduledDate: new Date(),
  scheduledById: 1,
  submittedAt: new Date(),
  submittedBy: 1,
  submissionNotes: '',
  reviewedAt: new Date(),
  reviewedBy: 1,
  reviewNotes: '',
  taskDetails: '',
  createdAt: new Date(),
  createdBy: 1,
  updatedAt: new Date(),
  updatedBy: 1,
  deletedAt: null,
  deletedBy: null,
  images: [],
  proofImages: [],
  reviewImages: [],
  rootMainTaskId: null,
  rootTaskTypeId: null,
  secondaryWorkerName: null,
  clearInspection: [],
  subtasks: [],
} as unknown as TaskDetailDto;
