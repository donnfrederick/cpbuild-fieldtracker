<script setup lang="ts">
  import { onMounted, ref, watch, computed } from 'vue';
  import { Modal } from 'bootstrap';
  import type {
    QuantityData,
    WorkerDetails,
    ProjectByScopeDetails,
  } from '@/interfaces/installTracker';
  import type { ProjectLevelWorkSubmissionTypes, TaskDetails } from '@/interfaces/project';
  import FileUpload from '@/components/FileUpload.vue';
  import { useForm, useField } from 'vee-validate';
  import { projectWorkSubmissionSchema } from './validationSchemas/projectWorkSubmissionSchema';
  import { unitsDetailsApi } from '@/services/laborManager';
  import { InstallTrackerService } from '@/services/installTracker';
  import type { WorkHourSubmissionCreateApi } from '@/interfaces/api/installTrackerRequest';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { storeToRefs } from 'pinia';
  import {
    CurrentUnitDto,
    TaskSubmissionViewerServiceProxy,
    WorkHourSubmissionTypeDto,
  } from '@/shared/service-proxies/service-proxies';
  import { IdbWorkHourSubmissionLogService } from '@/shared/offlineDb/services/idbWorkHourSubmissionLogService';
  import type { IWorkHourSubmission } from '@/shared/offlineDb/interfaces/IWorkHourSubmission';
  import { useAuthStore } from '@/stores/useAuthStore';

  const props = defineProps({
    showModal: {
      type: Boolean,
      default: false,
    },
    projectByScopeId: {
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
    taskId: {
      type: Number,
      default: 0,
    },
    taskTypeId: {
      type: Number,
      default: 0,
    },
    phaseId: {
      type: Number,
      default: 0,
    },
    taskAssistTypeOnly: {
      type: Boolean,
      default: false,
    },
    quantityData: {
      type: Object as () => QuantityData,
      default: () => ({
        plannedQuantity: 0,
        installedQuantity: 0,
        remainingQuantity: 0,
        addedQuantity: 0,
      }),
    },
    currentUnit: {
      type: Object as () => CurrentUnitDto,
      default: () => null,
    },
    teamLeadId: {
      type: Number,
      default: null,
    },
  });

  const emit = defineEmits(['onClose', 'onSubmit', 'onSuccess', 'onFailed']);

  const modalRef = ref<HTMLElement | null>(null);
  let modalInstance: Modal | null = null;
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);
  const authStore = useAuthStore();

  const taskDetails = ref<TaskDetails>({
    taskId: 0,
    unitId: 0,
    parentTaskId: 0,
    parentTaskTypeId: 0,
    parentTaskTypeName: '',
    parentStatusId: 0,
    parentStatusName: '',
    taskTypeId: 0,
    taskTypeName: '',
    phaseId: 0,
    phaseName: '',
    statusId: 0,
    statusName: '',
    imageAcknowledgmentChecked: false,
    imageAcknowledgmentText: '',
    assignedWorkerId: 0,
    assignedWorkerName: '',
    scheduledDate: new Date(),
    scheduledById: 0,
    submittedAt: new Date(),
    submittedBy: 0,
    submissionNotes: '',
    reviewedAt: new Date(),
    reviewedBy: 0,
    reviewNotes: '',
    taskDetails: '',
    createdAt: new Date(),
    createdBy: 0,
    updatedAt: new Date(),
    updatedBy: 0,
    deletedAt: new Date(),
    deletedBy: 0,
    images: [],
    proofImages: [],
    reviewImages: [],
    clearInspection: [],
    subtasks: [],
    rootMainTaskId: null,
    rootTaskTypeId: null,
    secondaryWorkerName: null,
  });

  const workerDetails = ref<WorkerDetails>({
    id: 0,
    userId: 0,
    name: '',
    email: '',
  });

  const projectByScopeDetails = ref<ProjectByScopeDetails>({
    id: 0,
    ftProjectId: 0,
    projectId: 0,
    projectName: '',
    scopeTypeId: 0,
    scopeTypeName: '',
    statusId: 0,
    statusName: '',
    teamLeadId: 0,
    teamLeadUserId: 0,
  });

  const projectLevelWorkSubmissionTypes = ref<ProjectLevelWorkSubmissionTypes[]>([]);
  const unitLevelWorkSubmissionTypes = ref<WorkHourSubmissionTypeDto[]>([]);

  const isFormValid = ref<boolean>(false);

  const showQuantity = ref<boolean>(false);

  const submissionTypeId = ref<number>(0);
  const hours = ref<number>(0);
  const minutes = ref<number>(0);
  // Vee-validate form setup
  const { meta, resetForm } = useForm({
    validationSchema: computed(() =>
      projectWorkSubmissionSchema(props.quantityData.remainingQuantity)
    ),
    initialValues: {
      hours: hours.value,
      minutes: minutes.value,
    },
    keepValuesOnUnmount: true,
  });

  const {
    value: quantity,
    errorMessage: quantityError,
    handleBlur: quantityBlur,
  } = useField<number>('quantity');
  const currentTaskTypeId = ref<number>(0);
  const submissionNotes = ref<string>('');

  const submissionId = ref<number>(0);
  const installTrackerService = new InstallTrackerService();
  const taskSubmissionViewerServiceProxy = new TaskSubmissionViewerServiceProxy();
  const isLoadingTaskDetails = ref<boolean>(false);
  const isLoadingProjectByScopeDetails = ref<boolean>(false);
  const currentTeamLeadId = ref<number | null>(null);

  watch(
    () => props.showModal,
    async (newVal) => {
      if (newVal) {
        if (newVal) {
          if (props.currentUnit != null && projectByScopeDetails.value.projectName == '') {
            projectByScopeDetails.value.projectName =
              props.currentUnit.projectName?.toString() ?? 'Unnamed';
            projectByScopeDetails.value.scopeTypeName =
              props.currentUnit.projectScopeTypeName?.toString() ?? 'Unnamed';
          } else if (
            props.currentUnit == null &&
            props.projectByScopeId > 0 &&
            projectByScopeDetails.value.id == 0
          )
            await fetchProjectByScopeDetails();
        }

        modalInstance?.show();
      } else modalInstance?.hide();
    },
    { immediate: true }
  );

  watch(
    () => submissionTypeId.value,
    (newVal) => {
      if (newVal != 0) {
        const unitLevelWorkSubmissionType = unitLevelWorkSubmissionTypes.value.find(
          (type: WorkHourSubmissionTypeDto) => type.id == submissionTypeId.value
        );

        if (
          unitLevelWorkSubmissionType?.name == 'Planned Quantity' ||
          unitLevelWorkSubmissionType?.name == 'Added Quantity'
        ) {
          showQuantity.value = true;

          if (quantity.value != 0) {
            const totalHours = (hours.value + minutes.value / 60).toFixed(2);
            if (Number(totalHours) > 0) isFormValid.value = true;
          } else {
            isFormValid.value = false;
          }
        } else {
          quantity.value = 0;
          showQuantity.value = false;

          const totalHours = (hours.value + minutes.value / 60).toFixed(2);
          if (Number(totalHours) > 0) isFormValid.value = true;
        }
      } else {
        quantity.value = 0;
        isFormValid.value = false;
        showQuantity.value = false;
      }
    }
  );

  watch(
    () => hours.value,
    (newVal) => {
      if (newVal.toString().includes('.')) {
        hours.value = 0;
      } else {
        newVal = parseInt(newVal.toString(), 10) || 0;
        hours.value = newVal < 0 ? 0 : newVal;
      }

      const totalHours = (hours.value + minutes.value / 60).toFixed(2);
      if (Number(totalHours) > 0 && submissionTypeId.value != 0) {
        const unitLevelWorkSubmissionType = unitLevelWorkSubmissionTypes.value.find(
          (type: WorkHourSubmissionTypeDto) => type.id == submissionTypeId.value
        );

        if (
          unitLevelWorkSubmissionType?.name == 'Planned Quantity' ||
          unitLevelWorkSubmissionType?.name == 'Added Quantity'
        ) {
          if (quantity.value > 0) {
            isFormValid.value = true;
          } else isFormValid.value = false;
        } else isFormValid.value = true;
      } else isFormValid.value = false;
    }
  );

  watch(
    () => minutes.value,
    (_newVal) => {
      const totalHours = (hours.value + minutes.value / 60).toFixed(2);
      if (Number(totalHours) > 0 && submissionTypeId.value != 0) {
        const unitLevelWorkSubmissionType = unitLevelWorkSubmissionTypes.value.find(
          (type: WorkHourSubmissionTypeDto) => type.id == submissionTypeId.value
        );

        if (
          unitLevelWorkSubmissionType?.name == 'Planned Quantity' ||
          unitLevelWorkSubmissionType?.name == 'Added Quantity'
        ) {
          if (quantity.value > 0) {
            isFormValid.value = true;
          } else isFormValid.value = false;
        } else isFormValid.value = true;
      } else isFormValid.value = false;
    }
  );

  async function getProjectLevelWorkSubmissionTypes() {
    try {
      const data = await installTrackerService.projectLevelSubmissionTypesApi();

      projectLevelWorkSubmissionTypes.value = data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getWorkHourSubmissionTypes() {
    try {
      await taskSubmissionViewerServiceProxy
        .getUnitLevelWorkHourSubmissionTypesByPhaseId(props.phaseId)
        .then((response: WorkHourSubmissionTypeDto[]) => {
          unitLevelWorkSubmissionTypes.value = response.filter(
            (type: WorkHourSubmissionTypeDto) => type.taskTypeId == currentTaskTypeId.value
          );
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchProjectByScopeDetails() {
    isLoadingProjectByScopeDetails.value = true;
    try {
      const data = await installTrackerService.projectByScopeDetailsApi({
        projectByScopeId: props.projectByScopeId,
      });

      projectByScopeDetails.value = data;
      currentTeamLeadId.value = data.teamLeadId;

      isLoadingProjectByScopeDetails.value = false;
    } catch (error) {
      console.error(error);
      isLoadingProjectByScopeDetails.value = false;
    }
  }

  async function getTaskDetails() {
    isLoadingTaskDetails.value = true;
    try {
      const { data } = await unitsDetailsApi({
        unitTaskId: props.taskId,
        userRoles: props.userRoles,
      });

      currentTaskTypeId.value = data.taskTypeId;
      isLoadingTaskDetails.value = false;
    } catch (error) {
      console.error('getTaskDetails Error:', error);
    } finally {
      isLoadingTaskDetails.value = false;
    }
  }

  onMounted(async () => {
    if (currentTaskTypeId.value == 0) {
      if (props.taskTypeId > 0) currentTaskTypeId.value = props.taskTypeId;
      else await getTaskDetails();
    }

    if (isOffline.value) {
      authStore.useCachedData();
    }

    if (props.phaseId > 0) await getWorkHourSubmissionTypes();

    if (props.teamLeadId != null && props.teamLeadId > 0)
      currentTeamLeadId.value = props.teamLeadId;

    if (authStore.getWorkerDetails != null) {
      workerDetails.value = authStore.getWorkerDetails as WorkerDetails;
    }

    if (props.taskId == 0) await getProjectLevelWorkSubmissionTypes();

    if (modalRef.value) {
      modalInstance = new Modal(modalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (props.taskAssistTypeOnly) {
      submissionTypeId.value = 35; //Equivalent to Task Assist in work_hour_submissions
    }
  });

  const closeModal = () => {
    emit('onClose');
  };

  const uploadSuccess = () => {
    emit('onSuccess');
  };

  const fileUpload = (count: number) => {
    console.error(count);
  };

  const submitNewWorkHourSubmission = async () => {
    const unitLevelWorkSubmissionType = unitLevelWorkSubmissionTypes.value.find(
      (type: WorkHourSubmissionTypeDto) => type.id == submissionTypeId.value
    );

    if (
      unitLevelWorkSubmissionType?.name == 'Planned Quantity' ||
      unitLevelWorkSubmissionType?.name == 'Added Quantity'
    ) {
      if (quantity.value == 0) {
        emit('onFailed', `Quantity must have a value`);
        return;
      }

      if (
        unitLevelWorkSubmissionType?.name == 'Planned Quantity' &&
        quantity.value > props.quantityData.remainingQuantity
      ) {
        emit(
          'onFailed',
          `Quantity should not be greater than the Remaining Quantity (${props.quantityData.remainingQuantity})`
        );
        return;
      }
    }

    if (isOffline.value) {
      const tempId = await IdbWorkHourSubmissionLogService.save({
        taskId: props.taskId,
        projectByScopeId: props.projectByScopeId,
        workerId: workerDetails.value.id,
        submitTypeId: submissionTypeId.value,
        submitTypeName:
          unitLevelWorkSubmissionTypes.value.find(
            (type: WorkHourSubmissionTypeDto) => type.id == submissionTypeId.value
          )?.name ?? '',
        hours: (hours.value + minutes.value / 60).toFixed(2),
        submissionNotes: submissionNotes.value,
        teamLeadId: Number(currentTeamLeadId.value),
        createdBy: props.userId,
        userRoles: props.userRoles,
        quantity: quantity.value.toFixed(2),
      } as IWorkHourSubmission);

      submissionTypeId.value = 0;
      quantity.value = 0;
      hours.value = 0;
      minutes.value = 0;
      submissionNotes.value = '';
      submissionId.value = tempId;
      resetForm();
      closeModal();
      return;
    }

    if (submissionTypeId.value != 0) {
      emit('onSubmit');

      const totalHours = (hours.value + minutes.value / 60).toFixed(2);

      const reqBody: WorkHourSubmissionCreateApi = {
        projectByScopeId: props.projectByScopeId,
        workerId: workerDetails.value.id,
        submitTypeId: submissionTypeId.value,
        hours: totalHours,
        submissionNotes: submissionNotes.value,
        teamLeadId: Number(currentTeamLeadId.value),
        createdBy: props.userId,
        userRoles: props.userRoles,
      };

      if (props.taskId > 0) {
        reqBody.taskId = props.taskId;
        reqBody.quantity = quantity.value.toFixed(2);
      }

      if (Number(totalHours) == 0) {
        emit('onFailed', `Total hours cannot be 0`);
        return;
      }

      try {
        submissionTypeId.value = 0;
        quantity.value = 0;
        hours.value = 0;
        minutes.value = 0;
        submissionNotes.value = '';
        const data = await installTrackerService.workHourSubmissionCreateApi(reqBody);
        submissionId.value = data.submissionId;
        resetForm();
      } catch (error) {
        console.error(error);
      }
    }
  };
</script>
<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 v-if="props.taskId > 0" id="pasteModalLabel" class="modal-title">
            NEW UNIT WORK SUBMISSION
          </h5>
          <h5 v-else id="pasteModalLabel" class="modal-title">NEW PROJECT WORK SUBMISSION</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <h5 class="text-dark fw-bold">
              {{ projectByScopeDetails.projectName }} ({{ projectByScopeDetails.scopeTypeName }})
            </h5>
          </div>
          <div class="form-group mt-3">
            <p
              v-if="
                currentUnit?.building != null &&
                currentUnit?.level != null &&
                currentUnit?.unit != null &&
                currentUnit?.area != null &&
                currentUnit?.unitType != null
              "
            >
              <strong>Building: </strong>{{ currentUnit?.building }}, <strong>Level: </strong
              >{{ currentUnit?.level }}, <strong>Unit: </strong>{{ currentUnit?.unit }},
              <strong>Area: </strong>{{ currentUnit?.area }}, <strong>Unit Type: </strong
              >{{ currentUnit?.unitType }}
            </p>
          </div>
          <div
            v-if="props.taskId > 0 && taskDetails.taskTypeName === 'Main'"
            class="form-group mt-3"
          >
            <p class="text-dark" style="font-size: 16px">
              <strong>Planned Quantity: </strong>
              <span>{{ props.quantityData.plannedQuantity }}</span>
              <br />
              <strong>Installed Quantity: </strong>
              <span>{{ props.quantityData.installedQuantity }}</span>
              <br />
              <strong>Remaining Quantity: </strong>
              <span>{{ props.quantityData.remainingQuantity }}</span>
              <br />
              <strong>Added Quantity: </strong>
              <span>{{ props.quantityData.addedQuantity }}</span>
            </p>
          </div>
          <div v-if="props.taskAssistTypeOnly" class="form-group mt-3">
            <span class="modal-title">
              Submittion Type:
              <strong>Task Assist</strong>
            </span>
          </div>
          <div v-else class="form-group mt-3">
            <label>* Choose Submission Type</label>
            <select v-if="props.taskId > 0" v-model="submissionTypeId" class="form-control">
              <option value="0">Select Types</option>
              <option v-for="type in unitLevelWorkSubmissionTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
            <select v-else v-model="submissionTypeId" class="form-control">
              <option value="0">Select Types</option>
              <option
                v-for="type in projectLevelWorkSubmissionTypes"
                :key="type.id"
                :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
          </div>
          <div v-if="showQuantity" class="form-group mt-3">
            <label>* Quantity</label>
            <input
              v-model="quantity"
              :class="['form-control', quantityError ? 'is-invalid' : '']"
              type="number"
              name="quantity"
              @blur="quantityBlur"
            />
            <span v-if="quantityError" class="text-danger small">{{ quantityError }}</span>
          </div>
          <div class="form-group mt-3 d-flex justify-content-around">
            <div class="col-md-6">
              <label>* Hrs.</label>
              <input
                v-model="hours"
                min="0"
                step="1"
                type="number"
                name="hours"
                class="form-control"
              />
            </div>
            <div class="col-md-6">
              <label>* Min.</label>
              <input
                v-model="minutes"
                min="0"
                step="1"
                type="number"
                name="minutes"
                class="form-control"
              />
            </div>
          </div>
          <div class="form-group mt-3">
            <label>(optional) Include images that would be useful for documentation</label>
            <FileUpload
              id="project-work-submission-create-image-upload"
              :submission-type-id="1"
              :submission-location="'field_tracker.work_hour_submissions'"
              :submission-id="submissionId"
              @upload-success="uploadSuccess"
              @has-changed="fileUpload"
            />
          </div>
          <div class="form-group">
            <label>Submission Notes (optional)</label>
            <textarea
              v-model="submissionNotes"
              class="form-control"
              placeholder="Notes or details from worker can go here."
              rows="2"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!meta.valid && !isFormValid"
            @click="submitNewWorkHourSubmission"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
  .modal-title {
    color: #19a7af;
  }

  .modal label {
    color: #3c3c3c;
    padding-bottom: 8px;
  }

  .is-invalid {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  }
</style>
