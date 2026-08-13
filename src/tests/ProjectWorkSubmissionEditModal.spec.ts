import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ProjectWorkSubmissionEditModal from '@/components/modal/ProjectWorkSubmissionEditModal.vue';

const defaultProps = {
  showModal: true,
  // ⬇️ renamed prop
  editLog: {
    id: 1,
    projectName: 'Test Project',
    scopeTypeName: '',
    submitTypeId: 0,
    submitTypeName: '',
    statusId: 0,
    statusName: '',
    hours: 0,
    quantity: 0,
    hoursArray: [1, 0],
    hoursOverrideArray: [0, 0],
    hoursText: '',
    workerId: 1,
    workerName: 'Test Worker',
    createdAt: '',
    init: vi.fn(),
    toJSON: vi.fn(),
    submissionDate: '',
    submittedBy: '',
    submissionNotes: '',
    managerNotes: '',
    hoursOverride: 0,
    hoursOverrideArr: [1, 0],
    quantityOverride: 0,
    images: [],
    taskStatusId: 0,
  },
  workerDetails: {
    id: 1,
    userId: 1,
    name: 'Test Worker',
    email: 'test@example.com',
  },
  userId: 123,
  userRoles: '',
  taskId: 1,
};

const mockApiFn = vi.fn().mockResolvedValue({});

vi.mock('@/services/installTracker', () => ({
  InstallTrackerService: vi.fn().mockImplementation(() => ({
    workHourSubmissionsUpdateApi: mockApiFn,
  })),
}));

describe('ProjectWorkSubmissionEditModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('shows quantity input when submitTypeName is "Planned Quantity"', () => {
    const wrapper = mount(ProjectWorkSubmissionEditModal, {
      global: {
        plugins: [createTestingPinia()],
        // prevent FileUpload from executing real logic during this render test
        stubs: { FileUpload: true },
      },
      props: {
        ...defaultProps,
        editLog: {
          ...defaultProps.editLog,
          submitTypeName: 'Planned Quantity',
        },
      },
    });

    expect(wrapper.find('.quantity').exists()).toBe(true);
  });

  it('shows quantity input when submitTypeName is "Added Quantity"', () => {
    const wrapper = mount(ProjectWorkSubmissionEditModal, {
      global: {
        plugins: [createTestingPinia()],
        stubs: { FileUpload: true },
      },
      props: {
        ...defaultProps,
        editLog: {
          ...defaultProps.editLog,
          submitTypeName: 'Added Quantity',
        },
      },
    });

    expect(wrapper.find('.quantity').exists()).toBe(true);
  });

  it('does not show quantity input when submitTypeName is "Regular Hours"', () => {
    const wrapper = mount(ProjectWorkSubmissionEditModal, {
      global: {
        plugins: [createTestingPinia()],
        stubs: { FileUpload: true },
      },
      props: {
        ...defaultProps,
        editLog: {
          ...defaultProps.editLog,
          submitTypeName: 'Regular Hours',
        },
      },
    });

    expect(wrapper.find('.quantity').exists()).toBe(false);
  });
});
