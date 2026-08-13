<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import { Modal } from 'bootstrap';
  import FileUpload from '@/components/FileUpload.vue';
  import type { WorkerDetails } from '@/interfaces/installTracker';
  import { InstallTrackerService } from '@/services/installTracker';
  import { Fancybox } from '@fancyapps/ui';
  import {
    TaskSubmissionViewerWorkHourSubmissionDto,
    WorkHourSubmissionImageDto,
  } from '@/shared/service-proxies/service-proxies';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { storeToRefs } from 'pinia';
  import type { IWorkHourSubmission } from '@/shared/offlineDb/interfaces/IWorkHourSubmission';
  import { IdbWorkHourSubmissionLogService } from '@/shared/offlineDb/services/idbWorkHourSubmissionLogService';
  import { IdbImageService } from '@/shared/offlineDb/services/idbImageService';
  import { IStoredImage } from '@/shared/offlineDb/interfaces/IStoredImage';

  const installTrackerService = new InstallTrackerService();

  type EditLogInput = Partial<TaskSubmissionViewerWorkHourSubmissionDto> | Record<string, any>;

  const props = withDefaults(
    defineProps<{
      showModal?: boolean;
      editLog?: EditLogInput; // renamed from onEditLog
      workerDetails?: WorkerDetails;
      userId?: number;
      userRoles?: string;
      taskId?: number;
    }>(),
    {
      showModal: false,
      editLog: () =>
        ({
          id: 0,
          projectName: '',
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
          workerId: 0,
          workerName: '',
          createdAt: '',
          submissionDate: '',
          submittedBy: '',
          submissionNotes: '',
          managerNotes: '',
          hoursOverride: 0,
          quantityOverride: 0,
          images: [],
          taskStatusId: 0,
          taskName: '',
          phaseName: '',
          unitName: '',
        } as EditLogInput),
      workerDetails: () => ({
        id: 0,
        userId: 0,
        name: '',
        email: '',
      }),
      userId: 0,
      userRoles: '',
      taskId: 0,
    }
  );

  const emit = defineEmits(['onClose', 'onSubmit', 'onSuccess', 'removeImage']);

  const modalRef = ref<HTMLElement | null>(null);
  const container = ref<HTMLElement | null>(null);
  let modalInstance: Modal | null = null;

  const editHours = ref<any>(0);
  const editMinutes = ref<any>(0);
  const editSubmissionNotes = ref<string>('');
  const editSubmissionId = ref<number>(0);
  const editQuantity = ref<number>(0);
  const submitDisabled = ref<boolean>(true);
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);
  const previewImages = ref<WorkHourSubmissionImageDto[]>([]);

  watch(
    () => props.showModal,
    async (newVal) => {
      if (newVal) {
        previewImages.value = Array.isArray(props.editLog.images) ? props.editLog.images : [];
        editHours.value = Array.isArray(props.editLog.hoursArray) ? props.editLog.hoursArray[0] : 0;
        editMinutes.value = Array.isArray(props.editLog.hoursArray)
          ? props.editLog.hoursArray[1]
          : 0;
        editSubmissionNotes.value = (props.editLog.submissionNotes as string) || '';
        editQuantity.value = (props.editLog.quantity as number) || 0;

        if (isOffline.value) {
          const storedImages = await IdbImageService.getAllImagesBySubmissionIdWithLocation(
            props.editLog.id,
            'field_tracker.work_hour_submissions'
          );
          storedImages.forEach((image: IStoredImage) => {
            const newFile = IdbImageService.blobToFile(image.blobFile, image.imageName);
            if (newFile) {
              previewImages.value.push({
                id: image.tempId,
                submissionId: Number(image.submissionId),
                fileUrl: URL.createObjectURL(newFile),
                thumbnailUrl: URL.createObjectURL(newFile),
                fileName: image.imageName,
                description: image.imageDescription,
              } as WorkHourSubmissionImageDto);
            }
          });
        }
        modalInstance?.show();
      } else {
        modalInstance?.hide();
        editSubmissionId.value = 0;
      }
    },
    { immediate: true }
  );

  watch(
    () => editHours.value,
    (newVal) => {
      if (newVal.toString().includes('.')) {
        editHours.value = 0;
      } else {
        newVal = parseInt(newVal, 10) || 0;
        editHours.value = newVal < 0 ? 0 : newVal;
      }
      const totalHours = (editHours.value + editMinutes.value / 60).toFixed(2);
      submitDisabled.value = Number(totalHours) <= 0;
    }
  );

  watch(
    () => editMinutes.value,
    () => {
      const totalHours = (editHours.value + editMinutes.value / 60).toFixed(2);
      submitDisabled.value = Number(totalHours) <= 0;
    }
  );

  function bindFancybox(selector: string, options: any) {
    (Fancybox as any).bind(selector, options);
  }

  onMounted(async () => {
    if (modalRef.value) {
      modalInstance = new Modal(modalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
    if (container.value) {
      bindFancybox('[data-fancybox="fancy-preview"]', { infinite: false });
    }
  });

  const closeModal = () => emit('onClose');
  const successEmitter = () => emit('onSuccess');
  const updateFileChanged = (count: number) => console.error(count);

  const submitForm = async () => {
    let updatedQuantity = props.editLog.quantity;
    const confEditChanges = confirm('Do you want to continue?');
    if (confEditChanges && props.userId != null) {
      const totalHours = (editHours.value + editMinutes.value / 60).toFixed(2);

      if (
        props.editLog.submitTypeName === 'Planned Quantity' ||
        props.editLog.submitTypeName === 'Added Quantity'
      ) {
        updatedQuantity = editQuantity.value;
      }

      if (isOffline.value) {
        await IdbWorkHourSubmissionLogService.edit({
          tempId: props.editLog.id,
          hours: totalHours,
          submissionNotes: editSubmissionNotes.value,
          createdBy: props.userId,
          userRoles: props.userRoles,
          quantity: updatedQuantity,
        } as IWorkHourSubmission);

        editSubmissionId.value = props.editLog.id;
        closeModal();
        return;
      }

      emit('onSubmit');

      try {
        const reqBody: any = {
          workHourSubmissionId: props.editLog.id,
          workerId: props.workerDetails.id,
          hours: totalHours,
          submissionNotes: editSubmissionNotes.value,
          updatedBy: props.userId,
          quantity: updatedQuantity,
        };

        await installTrackerService.workHourSubmissionsUpdateApi(reqBody);
        editSubmissionId.value = Number(props.editLog.id) || 0;
        successEmitter();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };

  function blurRoundOff() {
    const raw = String(editMinutes.value).trim();
    if (raw === '') {
      editMinutes.value = '0';
      return;
    }
    const num = parseFloat(editMinutes.value);
    if (isNaN(num)) return;

    let clamped = Math.max(0, num);
    let rounded = Math.ceil(clamped / 5) * 5;
    rounded = Math.min(rounded, 55);
    editMinutes.value = rounded.toString();
  }

  const removeImage = (image: any) => {
    emit('removeImage', { uploadId: image.id });
    previewImages.value = previewImages.value?.filter((img: any) => img.id !== image.id) || [];
  };
</script>

<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 v-if="props.taskId > 0" id="pasteModalLabel" class="modal-title">
            EDIT UNIT WORK SUBMISSION
          </h5>
          <h5 v-else id="pasteModalLabel" class="modal-title">EDIT PROJECT WORK SUBMISSION</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
        </div>

        <div v-if="props.showModal" class="modal-body">
          <div class="form-group">
            <h5 class="text-dark fw-bold">
              {{ props.editLog.projectName }} ({{ props.editLog.scopeTypeName }})
            </h5>
          </div>

          <div class="form-group mt-3">
            <h6 class="text-dark">
              <strong>Work Submission ID: </strong>
              {{ props.editLog.id }}
            </h6>
            <span>
              <strong>Submit Date: </strong>
              {{ props.editLog.submissionDate }},
              <strong>Submitted By: </strong>
              {{ props.editLog.submittedBy }},
              <strong>Type: </strong>
              <span class="data-submit-type"> {{ props.editLog.submitTypeName }}, </span>
              <strong>Status: </strong>
              {{ props.editLog.statusName }}
            </span>

            <div
              v-if="
                props.editLog.submitTypeName === 'Planned Quantity' ||
                props.editLog.submitTypeName === 'Added Quantity'
              "
              class="form-group mt-3 quantity"
            >
              <label>* Quantity</label>
              <input v-model="editQuantity" class="form-control" type="number" />
            </div>
          </div>

          <div class="form-group mt-3 d-flex justify-content-around">
            <div class="col-md-6">
              <label>* Hrs.</label>
              <input v-model="editHours" min="0" step="1" type="number" class="form-control" />
            </div>
            <div class="col-md-6">
              <label>* Min.</label>
              <input
                v-model="editMinutes"
                type="number"
                class="form-control"
                @blur="blurRoundOff"
              />
            </div>
          </div>

          <div class="form-group mt-3">
            <div v-if="previewImages != null" ref="container" class="images">
              <a
                v-for="image in previewImages"
                :key="image.id || image.fileUrl"
                data-fancybox="fancy-preview"
                :data-caption="`${image.fileName} ${
                  image.fileName != '' && image.description != '' ? '-' : ''
                } ${image.description}`"
                :href="image.fileUrl"
                class="image-container"
              >
                <img
                  class="m-1"
                  :src="image.thumbnailUrl"
                  alt="Thumbnail"
                  width="100"
                  @error="handleImageError"
                />

                <button type="button" @click.stop.prevent="removeImage(image)">
                  <i class="bi bi-trash"></i>
                  Remove
                </button>
              </a>
            </div>

            <label>(optional) Include images that would be useful for documentation</label>
            <FileUpload
              id="project-work-submission-edit-image-upload"
              :submission-type-id="1"
              :submission-location="'field_tracker.work_hour_submissions'"
              :submission-id="editSubmissionId"
              @upload-success="successEmitter"
              @has-changed="updateFileChanged"
            />
          </div>

          <div class="form-group mt-3">
            <label>Submission Notes (optional)</label>
            <textarea
              v-model="editSubmissionNotes"
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
            :disabled="submitDisabled"
            @click="submitForm"
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

  .images {
    display: flex;
  }

  .image-container {
    display: flex;
    flex-direction: column;
    text-decoration: none;
  }

  .image-container button {
    background: transparent;
    border: none;
    outline: none;
    color: #dc3545;
  }
</style>
