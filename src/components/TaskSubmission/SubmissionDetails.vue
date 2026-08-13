<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { Fancybox } from '@fancyapps/ui';
  import type { TaskDetailDto } from '@/shared/service-proxies/service-proxies';

  const props = defineProps({
    taskDetails: {
      type: Object as () => TaskDetailDto,
      default: () => ({}),
    },
    mode: {
      type: String,
      default: 'review',
    },
  });

  const container = ref<HTMLElement | null>(null);

  function bindFancybox(selector: string, options: any) {
    // We assert `any` here to sidestep the broken type definition
    // This keeps the @ts-expect-error or @ts-ignore out of your main logic
    (Fancybox as any).bind(selector, options);
  }

  const checklistItems = computed(() => {
    if (props.mode == 'inspection') {
      return props.taskDetails.clearInspectionRequirements;
    }
    return props.taskDetails.clearInspection ?? [];
  });

  onMounted(() => {
    if (container.value) {
      bindFancybox('[data-fancybox="submission"]', {
        infinite: false,
      });
    }
  });

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };
</script>
<template>
  <div class="submission-details col-md-4">
    <h5 v-if="mode == 'review' || mode == 'preview'">Submission Details</h5>
    <div ref="container" class="image-container">
      <a
        v-for="image in props.taskDetails.proofImages"
        :key="image.url || image.imageName"
        data-fancybox="submission"
        :data-caption="`${image.imageName} ${
          image.imageName != '' && image.imageDescription != '' ? '-' : ''
        } ${image.imageDescription}`"
        :href="image.url"
        class="image-link"
      >
        <img
          class="submission-image"
          :src="image.thumbnailUrl"
          alt="Thumbnail"
          @error="handleImageError"
        />
      </a>
    </div>
    <h7 v-if="taskDetails.submissionNotes" class="text-dark my-3">Submission Notes</h7>
    <p class="text-dark">{{ taskDetails.submissionNotes }}</p>

    <span
      v-if="
        checklistItems.length == 0 &&
        !taskDetails.submissionNotes &&
        props.taskDetails.proofImages.length == 0
      "
      class="text-danger"
    >
      No submission details have been added
    </span>

    <h7
      v-if="taskDetails.taskTypeName === 'Main' && checklistItems!.length > 0"
      class="text-dark my-3"
      >Clear Inspection Requirements Checklist</h7
    >
    <template
      v-if="taskDetails.phaseName !== 'Clear Inspection' && taskDetails.taskTypeName === 'Main'"
    >
      <div v-for="list in checklistItems" :key="list.id || list.itemTypeName" class="d-flex my-3">
        <div class="custom-checkbox">
          <input
            :id="`sd_checklist_${list.id || list.itemTypeName}`"
            type="checkbox"
            class="checkbox-input"
            :checked="list.isChecked"
            disabled="true"
          />
          <label :for="`checklist_${list.id || list.itemTypeName}`" class="checkbox-label"></label>
        </div>
        <span class="text-dark">
          <strong>{{ list.itemTypeName }}</strong>
          :
          {{ list.itemTypeDescription }}
        </span>
      </div>
    </template>
    <template v-if="taskDetails.phaseName === 'Clear Inspection'">
      <div class="py-3">
        <div v-for="list in taskDetails.clearInspection" :key="list.id" class="list d-flex">
          <span v-if="list.selectStatus === 'True'" class="text-check px-3"
            ><i class="bi bi-check-circle-fill"></i
          ></span>
          <span v-else class="text-danger px-3"><i class="bi bi-x-circle-fill"></i></span>
          <div>
            <p class="text-dark">
              <strong>{{ list.itemTypeName }}</strong> : {{ list.itemTypeDescription }}
            </p>
            <p v-if="list.selectStatus === 'False'" class="text-danger">
              <strong>Deficiency Count</strong> : {{ list.deficiencyCount }}
              <strong style="margin-left: 1rem">Severity</strong> : {{ list.deficiencyLevel }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
  .text-check {
    color: rgba(32, 120, 32, 0.715);
  }
  .submission-details {
    background: #f9f9f9;
    border-radius: 3px;
    margin: 2rem 5rem;
    padding: 2rem;
    width: 80vw;
    max-width: 800px;
    min-width: 360px;
  }
  .submission-details h5 {
    color: #19a7af;
    font-weight: bold;
  }
  .submission-details h6 {
    color: #19a7af;
    font-weight: bold;
  }
  .submission-details h7 {
    color: #19a7af;
    font-weight: bold;
  }
  .image-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 1rem;
    width: 100%;
  }

  .image-link {
    flex: 0 0 auto;
    padding: 4px;
  }

  .submission-image {
    width: 120px;
    height: 120px;
    border-radius: 4px;
    object-fit: cover;
  }
  .custom-checkbox {
    display: inline;
    margin-right: 5px;
  }
  .checkbox-input {
    display: none;
  }
  .checkbox-label {
    width: 20px;
    height: 20px;
    border: 2px solid #c0d9db;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s, border-color 0.3s;
  }
  .checkbox-input:checked + .checkbox-label {
    background-color: #007bff7f;
    border: 1px solid #007bff7f;
  }
  .checkbox-input:checked + .checkbox-label::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  @media (max-width: 800px) {
    .submission-details {
      padding: 2rem 2rem;
      margin: 0.25rem;
    }
  }
</style>
