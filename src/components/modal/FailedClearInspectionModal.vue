<script setup lang="ts">
  import { computed, onMounted, ref, watch, type PropType } from 'vue';
  import { Modal } from 'bootstrap';
  import { parentChildPunchTaskCreateApi } from '@/services/laborManager';
  import FileUpload from '@/components/FileUpload.vue';
  import { ImageSubmissionTypeEnum } from '@/enum';
  import type { ActiveWorkers, UnitData } from '@/interfaces/project';
  import { featureFlags } from '@/config/featureFlags';
  import { storeToRefs } from 'pinia';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { IdbPunchWorkTaskCreateTSVService } from '@/shared/offlineDb/services/idbPunchWorkTaskCreateTSVService';
  import { PunchWorkTaskCreateDto } from '@/shared/service-proxies/service-proxies';

  const props = defineProps({
    showModal: Boolean,
    currentUnit: {
      type: Object as () => UnitData,
      default: () => ({} as UnitData),
    },
    activeWorkers: {
      type: Array as PropType<ActiveWorkers[]>,
      default: () => [],
    },
    taskId: {
      type: Number,
      default: 0,
    },
    unitId: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Number,
      default: 0,
    },
    userRoles: {
      type: String,
      default: '',
    },
    rootMainTaskId: {
      type: [Number, null] as PropType<number | null>,
      default: null,
    },
    previousAssignedWorkerId: {
      type: Number,
      default: 0,
    },
  });

  const emit = defineEmits(['onClose', 'onSubmit', 'onSuccess', 'onFailed']);

  const modalRef = ref<HTMLElement | null>(null);
  let modalInstance: Modal | null = null;

  const uploadCount = ref<number>(0);

  const submissionId = ref<number>(0);

  const assignedWorkerId = ref<number>(0);
  const reviewNotes = ref<string>('');
  const { isOffline } = storeToRefs(useNetworkStore());

  const getPunchWorkTaskStoredOffline = async () => {
    const punchWorkTask = await IdbPunchWorkTaskCreateTSVService.getByParentTaskId(props.taskId);
    if (!punchWorkTask) return;

    reviewNotes.value = punchWorkTask.taskDetails ?? '';
    assignedWorkerId.value = punchWorkTask?.assignedWorkerId ?? props.previousAssignedWorkerId;
    submissionId.value = punchWorkTask.parentTaskId;
  };

  onMounted(async () => {
    if (modalRef.value) {
      modalInstance = new Modal(modalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
  });

  watch(
    () => props.previousAssignedWorkerId,
    (newVal) => {
      if (isOffline.value) return;
      assignedWorkerId.value = newVal;
    }
  );

  watch(
    () => props.showModal,
    (newVal) => {
      if (newVal) {
        modalInstance?.show();

        if (isOffline.value) {
          getPunchWorkTaskStoredOffline();
        }
      } else modalInstance?.hide();
    },
    { immediate: true }
  );

  const closeModal = () => {
    emit('onClose');
  };

  const uploadSuccess = () => {
    emit('onSuccess');
  };

  const hasChanged = (count: number) => {
    uploadCount.value = count;
  };

  const allowForOffline = computed(() => {
    if (!isOffline.value) return true;

    return featureFlags.installTrackerWorkHourSubmission === true;
  });

  const submit = async () => {
    try {
      emit('onSubmit');

      const punchWorkRequest = {
        parentTaskId: props.taskId,
        unitByScopeId: props.unitId,
        assignedWorkerId: assignedWorkerId.value,
        taskDetails: reviewNotes.value,
        createChecklist: false,
        statusId: 2,
        createdBy: props.userId,
        userRoles: props.userRoles,
        rootMainTaskId: props.rootMainTaskId,
      };

      if (allowForOffline.value) {
        const offlinePunchWorkTaskTempId = await IdbPunchWorkTaskCreateTSVService.save(
          punchWorkRequest as unknown as PunchWorkTaskCreateDto
        );
        submissionId.value = offlinePunchWorkTaskTempId;
        return;
      }
      const { data } = await parentChildPunchTaskCreateApi(punchWorkRequest);

      submissionId.value = data.submissionId;
    } catch (error) {
      console.error(error);
    }
  };
</script>
<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">Failed Clear Inspection</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <h5 class="text-dark fw-bold">Create Resolution Task</h5>
          </div>
          <div class="form-group">
            <p class="mb-3 text-dark">
              <strong>Unit ID: </strong>{{ currentUnit?.id }}
              <br />
              <strong>Building: </strong>{{ currentUnit?.building }}, <strong>Level: </strong
              >{{ currentUnit?.level }}, <strong>Unit: </strong>{{ currentUnit?.unit }},
              <strong>Unit Type: </strong>{{ currentUnit?.unitType }}
            </p>
          </div>
          <div class="form-group mt-4">
            <h6 class="fw-bold text-dark">Assigned Worker</h6>
            <select v-model="assignedWorkerId" class="assigned-worker">
              <option value="0">Select</option>
              <option
                v-for="worker in activeWorkers"
                :key="worker.workerId"
                :value="worker.workerId"
              >
                {{ worker.workerName }}
              </option>
            </select>
          </div>
          <div class="form-group mt-3">
            <h6 class="fw-bold text-dark">Details and Requirements for Solution</h6>
            <div :class="['info', uploadCount > 0 ? 'success' : 'danger']">
              <span v-if="uploadCount > 0" class="check"
                ><i class="bi bi-check-circle-fill"></i
              ></span>
              <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
              <p>
                <strong>Upload at least 1 image </strong>
                that meets the requirements listed below in the “Photo Requirements Acknowledgment”
                text.
              </p>
            </div>
            <FileUpload
              id="failed-clear-inspection-image-upload"
              :submission-type-id="ImageSubmissionTypeEnum.TaskRequirements"
              :submission-location="'field_tracker.unit_tasks'"
              :submission-id="submissionId"
              :for-punch-work-task="true"
              @upload-success="uploadSuccess"
              @has-changed="hasChanged"
            />
          </div>
          <div class="form-group mt-3">
            <h6 class="fw-bold text-dark">* What is required to resolve this issue?</h6>
            <textarea
              v-model="reviewNotes"
              class="form-control"
              placeholder="Notes or Details from Team Lead can go here"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="assignedWorkerId == 0 || uploadCount == 0 || reviewNotes == ''"
            @click="submit"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
  .assigned-worker {
    padding: 0 0.4rem;
    border: none;
    outline: none;
  }
  .info {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .info.success .check {
    font-size: 200%;
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .info.danger .check {
    font-size: 200%;
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  .info.success p {
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .info.danger p {
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  .modal-title {
    color: #19a7af;
  }
  .modal label {
    color: #3c3c3c;
    padding-bottom: 8px;
  }
</style>
