<script setup lang="ts">
  import type { InstallTrackerTaskQueue } from '@/interfaces/installTracker';

  defineProps({
    items: {
      type: Object as () => InstallTrackerTaskQueue[],
      required: true,
    },
    title: {
      type: String,
      default: 'Subtask Queue',
    },
    startActionText: {
      type: String,
      default: 'Start',
    },
  });

  const emit = defineEmits(['startAction']);

  const startAction = (item: InstallTrackerTaskQueue) => {
    emit('startAction', item);
  };
</script>

<template>
  <div class="sub-tasks-queue-container col-md-4">
    <span class="title">
      {{ title }}
    </span>
    <div v-for="(item, index) in items" :key="index" class="tasks">
      <div class="task-container">
        <UnitInfo :record="item" />
        <TaskInfo :record="item" />
        <div v-if="item.secondaryWorkerName != null" class="seoncary-worker">
          <span class="text-success">
            <strong>Secondary Worker: </strong>
            {{ item.secondaryWorkerName }}
          </span>
        </div>

        <slot name="actions" :item="item" :index="index">
          <button class="sub-task-action-button" @click="startAction(item)">
            {{ startActionText }}
          </button>
        </slot>
      </div>

      <hr v-if="index != items.length - 1" />
    </div>
  </div>
</template>

<style scoped>
  .secondary-worker {
    margin-bottom: 0.5rem;
  }

  .sub-tasks-queue-container {
    background-color: #fff8f8;
    height: auto;
    padding: 22px;
    box-shadow: 0 2px 3px #0000001f;
  }

  .title {
    color: #dc3545;
    font-weight: 600;
    font-size: 16px;
    line-height: 150%;
  }

  .tasks .task-container {
    background-color: #ffffff;
    width: auto;
    height: auto;
    margin: 10px 0;
    padding: 20px;
  }

  :deep(.task-container span) {
    font-size: 14px;
    line-height: 150%;
  }

  :deep(.task-container hr) {
    margin: 1rem 0;
  }

  .sub-task-action-button {
    min-width: 120px;
    height: 32px;
    border-radius: 3px;
    background-color: #19a7af;
    margin-top: 16px;
    color: #ededed;
    border: none;
  }
</style>
