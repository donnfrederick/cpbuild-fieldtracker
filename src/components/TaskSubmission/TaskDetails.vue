<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { Fancybox } from '@fancyapps/ui';
  import type { TaskDetailDto } from '@/shared/service-proxies/service-proxies';

  defineProps({
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
      bindFancybox('[data-fancybox="task"]', {
        infinite: false,
      });
    }
  });

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };
</script>
<template>
  <div class="task-details col-md-4">
    <h6>Task Details</h6>
    <p class="text-dark">{{ taskDetails?.taskDetails }}</p>
    <div ref="container">
      <a
        v-for="image in taskDetails?.images"
        :key="image.url"
        data-fancybox="task"
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
  </div>
</template>
<style scoped>
  .task-details {
    background: #f9f9f9;
    border-radius: 3px;
    margin: 2rem 5rem;
    padding: 2rem;
    width: 90vw;
    max-width: 700px;
    min-width: 340px;
  }
  .task-details h6 {
    color: #19a7af;
    font-weight: bold;
  }
  @media (max-width: 800px) {
    .task-details.col-md-4 {
      padding: 1rem;
      margin: 1rem;
      width: 90vw;
      max-width: 640px;
    }
  }
</style>
