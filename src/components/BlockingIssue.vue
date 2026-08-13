<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import FileUpload from './FileUpload.vue';
  import { getImages } from '@/services/imageService';
  import { Fancybox } from '@fancyapps/ui';
  import '@fancyapps/ui/dist/fancybox/fancybox.css';

  const props = defineProps({
    issue: {
      type: Object,
      default: () => ({}),
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: '',
    },
  });

  const submissionId = ref(0);
  const updateSubmissionId = ref(0);
  const fileSubmitted = ref(0);
  const updateFileSubmitted = ref(0);

  const resolutionDetails = ref<string>('');
  const resolutionStatus = ref<number>(1);

  const showToastErr = ref(false);
  const toastErrMessage = ref('');

  const isDisabled = ref(true);
  const resolutionImages = ref<string[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const updateIssueDetails = ref('');

  const container = ref<HTMLElement | null>(null);
  const resolutionContainer = ref<HTMLElement | null>(null);

  const emit = defineEmits(['close', 'resolved', 'submitted', 'removeImage', 'updated']);

  const closeSection = () => {
    emit('close');
  };

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };

  const uploadSuccess = () => {
    if (resolutionStatus.value == 1) {
      showToastErr.value = true;
      toastErrMessage.value = 'Status is required to set to Resolved';

      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);
    } else if (resolutionDetails.value == '') {
      showToastErr.value = true;
      toastErrMessage.value = 'Resolution Details is required';

      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);
    } else {
      emit('resolved', {
        details: resolutionDetails.value,
        statusId: resolutionStatus.value,
        unitId: props.issue.unitId,
      });
    }
  };

  const handleResolution = () => {
    emit('submitted');
    submissionId.value = props.issue.id;
  };

  const fileChanged = (fileCount: number) => {
    fileSubmitted.value = fileCount;
  };

  watch(
    () => resolutionDetails.value,
    (newVal) => {
      if (newVal != '' && resolutionStatus.value != 1 && fileSubmitted.value > 0) {
        isDisabled.value = false;
      } else isDisabled.value = true;
    }
  );

  watch(
    () => resolutionStatus.value,
    (newVal) => {
      if (resolutionDetails.value != '' && newVal != 1 && fileSubmitted.value > 0) {
        isDisabled.value = false;
      } else isDisabled.value = true;
    }
  );

  watch(
    () => fileSubmitted.value,
    (newVal) => {
      if (resolutionDetails.value != '' && resolutionStatus.value != 1 && newVal > 0) {
        isDisabled.value = false;
      } else isDisabled.value = true;
    }
  );

  const fetchImages = async () => {
    isLoading.value = true;
    error.value = null;
    resolutionImages.value = []; // Reset before fetching

    try {
      // Call getImages and await its result
      const images = await getImages('field_tracker.blocking_issues', props.issue.id);
      resolutionImages.value = images;
    } catch (err: any) {
      // Handle errors
      console.error('Error fetching images:', err);
      error.value = err.message || 'Failed to fetch images. Please try again later.';
    } finally {
      isLoading.value = false;
    }
  };

  function bindFancybox(selector: string, options: any) {
    // We assert `any` here to sidestep the broken type definition
    // This keeps the @ts-expect-error or @ts-ignore out of your main logic
    (Fancybox as any).bind(selector, options);
  }

  onMounted(() => {
    if (props.mode == 'edit' && props.issue.statusId != 1) {
      alert('Issue was already resolved');
      emit('close');
    }
    fetchImages();

    updateIssueDetails.value = props.issue.issueDetails;

    if (container.value) {
      bindFancybox('[data-fancybox="issues"]', {
        infinite: false,
      });
    }

    if (resolutionContainer.value) {
      bindFancybox('[data-fancybox="resolution"]', {
        infinite: false,
      });
    }
  });

  const removeImage = (image: any) => {
    const xconfirm = confirm('Are you sure you want to delete this image?');

    if (xconfirm) {
      emit('removeImage', image.id);
    }
  };

  const handleUpdate = () => {
    emit('updated', updateIssueDetails.value);

    if (updateFileSubmitted.value > 0) {
      updateSubmissionId.value = props.issue.id;
    }
    emit('close');
  };

  const updateFileChanged = (fileCount: number) => {
    updateFileSubmitted.value = fileCount;
  };

  const updateSuccess = () => {
    window.location.reload();
  };
</script>
<template>
  <div v-if="props.isVisible">
    <div v-if="showToastErr" class="toast-error-message">
      {{ toastErrMessage }}
      <button type="button" @click="showToastErr = false">Close</button>
    </div>
    <div v-if="props.mode == 'preview'" class="preview">
      <div class="issue-details">
        <h5>Issue Details</h5>
        <p>{{ props.issue.issueDetails }}</p>
        <div ref="container">
          <a
            v-for="image in props.issue.images"
            :key="image.id || image.fileUrl"
            data-fancybox="issues"
            :data-caption="`${image.name} ${
              image.name != '' && image.description != '' ? '-' : ''
            } ${image.description}`"
            :href="image.fileUrl"
          >
            <img
              class="m-1"
              :src="image.thumbnailUrl"
              alt="Thumbnail"
              width="100"
              @error="handleImageError"
            />
          </a>
        </div>
      </div>
      <div v-if="props.issue.statusId == 2" class="resolution-details">
        <h5>Resolution Details</h5>
        <p>{{ props.issue.resolutionDetails }}</p>
        <div ref="resolutionContainer">
          <a
            v-for="image in props.issue.resolutionImages"
            :key="image.id || image.fileUrl"
            data-fancybox="resolution"
            :data-caption="`${image.name} ${
              image.name != '' && image.description != '' ? '-' : ''
            } ${image.description}`"
            :href="image.fileUrl"
          >
            <img
              class="m-1"
              :src="image.thumbnailUrl"
              alt="Thumbnail"
              width="100"
              @error="handleImageError"
            />
          </a>
        </div>
      </div>
      <button type="button" class="preview-close" @click="closeSection">Close</button>
    </div>
    <div v-if="props.mode == 'resolve'" class="edit">
      <h4>Resolution Details (required):</h4>
      <hr />
      <div class="status">
        <h5>Update Status</h5>
        <select v-model="resolutionStatus">
          <option value="1">Active</option>
          <option value="2">Resolved</option>
          <option value="3">Deleted</option>
        </select>
      </div>
      <div class="image">
        <h5>Details and Requirement for Resolution</h5>
        <div :class="['info', fileSubmitted > 0 ? 'success' : 'danger']">
          <span v-if="fileSubmitted > 0" class="check"
            ><i class="bi bi-check-circle-fill"></i
          ></span>
          <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
          <p>
            <strong>Upload at least 1 image</strong>
            that demonstrates what was done to resolve this issue
          </p>
        </div>
        <FileUpload
          id="blocking-issue-resolution-image-upload"
          :submission-type-id="6"
          :submission-location="'field_tracker.blocking_issues'"
          :submission-id="submissionId"
          @upload-success="uploadSuccess"
          @has-changed="fileChanged"
        />
      </div>
      <div class="resolution">
        <h5>* Resolution Details:</h5>
        <textarea
          v-model="resolutionDetails"
          class="form-control"
          placeholder="Notes or details from Team Lead can go here"
          rows="3"
        >
        </textarea>
      </div>
      <div class="buttons d-flex">
        <button type="button" class="btn btn-danger" @click="closeSection">Cancel</button>
        <button
          type="button"
          class="btn btn-success"
          :disabled="isDisabled"
          @click="handleResolution"
        >
          Submit
        </button>
      </div>
    </div>
    <div v-if="props.mode == 'edit'" class="edit-issue">
      <h4>Edit Issue</h4>
      <div
        v-for="image in props.issue.images"
        :key="image.id || image.fileUrl"
        class="image-container"
      >
        <img
          class="mx-2"
          :src="image.thumbnailUrl"
          alt="Thumbnail"
          width="100"
          @error="handleImageError"
        />
        <button type="button" @click="removeImage(image)">
          <i class="bi bi-trash"></i>
          Remove
        </button>
      </div>
      <div class="form-group my-3">
        <span class="text-muted">Add more images</span>
        <FileUpload
          id="blocking-issue-update-image-upload"
          :submission-type-id="5"
          :submission-location="'field_tracker.blocking_issues'"
          :submission-id="updateSubmissionId"
          @upload-success="updateSuccess"
          @has-changed="updateFileChanged"
        />
      </div>
      <div class="form-group my-3">
        <span class="text-muted">Issue Details</span>
        <textarea v-model="updateIssueDetails" class="form-control"></textarea>
      </div>
      <div class="buttons d-flex">
        <button type="button" class="btn btn-danger" @click="closeSection">Cancel</button>
        <button type="button" class="btn btn-success" @click="handleUpdate">Submit</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
  .edit-issue {
    margin-top: 2rem;
  }
  .edit-issue h4 {
    color: #19a7af;
  }
  .edit-issue .images {
    padding: 1rem 0;
    display: flex;
  }
  .edit-issue .images .image-container {
    display: flex;
    flex-direction: column;
  }
  .edit-issue .images .image-container button {
    background: transparent;
    border: none;
    outline: none;
    color: #dc3545;
  }
  .toast-error-message {
    background-color: #dc3545 !important;
    font-weight: bold;
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    z-index: 1031;
  }

  .toast-error-message button {
    border: none;
    background: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
  }
  .buttons {
    margin-top: 2rem;
  }
  .buttons .btn {
    padding: 4px 2.5rem;
    margin-right: 0.7rem;
    border: none;
  }
  .buttons .btn:last-child {
    background: #19a7af;
    margin: 0;
  }
  .buttons .btn:last-child:hover {
    background: #158f95;
  }
  .image .info {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .image .info.success .check {
    font-size: 200%;
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .image .info.danger .check {
    font-size: 200%;
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  .image .info.success p {
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .image .info.danger p {
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  .edit {
    margin-top: 2rem;
  }
  .edit h4 {
    color: #19a7af;
  }
  .edit .status {
    margin-bottom: 2rem;
  }
  .edit .status select {
    border: none;
    outline: none;
    padding: 0.3rem 0;
  }
  .preview .issue-details,
  .preview .resolution-details {
    background: #f5f5f5;
    border-radius: 4px;
    padding: 1rem;
    margin: 1.5rem auto;
  }
  .preview .issue-details h5,
  .preview .resolution-details h5 {
    color: #19a7af;
  }
  .preview .issue-details img,
  .preview .resolution-details img {
    margin: 2px;
  }
  .preview .preview-close {
    background: #19a7af;
    border-radius: 4px;
    color: #f1f1f1;
    width: 150px;
    padding: 0.3rem 0;
    border: none;
    margin-bottom: 1rem;
  }
</style>
