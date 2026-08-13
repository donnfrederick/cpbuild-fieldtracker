<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { Fancybox } from '@fancyapps/ui';
  import type { TaskDetailDto } from '@/shared/service-proxies/service-proxies';

  const props = defineProps({
    taskDetails: {
      type: Object as () => TaskDetailDto,
      default: () => ({}),
    },
  });

  const container = ref<HTMLElement | null>(null);

  function bindFancybox(selector: string, options: any) {
    // We assert `any` here to sidestep the broken type definition
    // This keeps the @ts-expect-error or @ts-ignore out of your main logic
    (Fancybox as any).bind(selector, options);
  }

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
    <h6>Submission Details</h6>
    <div ref="container" class="image-container">
      <a
        v-for="image in props.taskDetails.proofImages"
        :key="image.url || image.imageName"
        data-fancybox="submission"
        :data-caption="`${image.imageName} ${
          image.imageName != '' && image.imageDescription != '' ? '-' : ''
        } ${image.imageDescription}`"
        :href="image.url"
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
    <h7 v-if="taskDetails.submissionNotes" class="text-dark my-3">Submission Notes</h7>
    <p class="text-dark">{{ taskDetails.submissionNotes }}</p>
  </div>
</template>
<style scoped>
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
  .submission-details .image-container {
    margin-bottom: 1rem;
  }
  @media (max-width: 800px) {
    .submission-details {
      padding: 2rem 2rem;
      margin: 0.25rem;
    }
  }
</style>
