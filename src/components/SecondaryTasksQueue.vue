<script setup lang="ts">
  import type { InstallTrackerTaskQueue } from '@/interfaces/installTracker';

  const props = defineProps({
    items: {
      type: Object as () => InstallTrackerTaskQueue[],
      required: true,
    },
    startActionText: {
      type: String,
      default: 'Start',
    },
    continueActionText: {
      type: String,
      default: 'Continue',
    },
  });

  const emit = defineEmits(['startAction']);

  const startAction = (item: InstallTrackerTaskQueue) => {
    emit('startAction', item);
  };
</script>

<template>
  <div class="sub-tasks-queue-container col-md-4">
    <span class="title">Secondary Task Queue</span>
    <div
      v-for="(item, index) in props.items.filter((i) => i.scheduledDate)"
      :key="index"
      class="tasks"
    >
      <div class="task-container">
        <UnitInfo :record="item" />
        <TaskInfo :record="item" />

        <div v-if="item.secondaryWorkerName != null" class="secondary-worker">
          <span class="text-success">
            <strong>Primary Worker: </strong>
            {{ item.primaryWorkerName }}
          </span>
        </div>

        <button class="task-action-button" @click="startAction(item)">Submit Hours</button>
      </div>

      <hr v-if="index != props.items.length - 1" />
    </div>
  </div>
</template>

<style scoped>
  .secondary-worker {
    margin-bottom: 0.5rem;
  }

  .sub-tasks-queue-container {
    background-color: #eaf6f6;
    height: auto;
    padding: 22px;
    box-shadow: 0 2px 3px #0000001f;
  }

  .title {
    font-weight: 600;
    font-size: 16px;
    line-height: 150%;
    color: #000;
  }

  .tasks .task-container {
    width: auto;
    height: auto;
    margin: 10px 0;
    padding: 20px;
  }

  .tasks .task-container {
    background-color: #ffffff;
  }

  .tasks .task-container .task-label {
    font-weight: 600;
    font-size: 16px;
    line-height: 150%;
    color: #7a7a7a;
    margin-bottom: 16px;
  }

  :deep(.task-container span) {
    font-size: 14px;
    line-height: 150%;
  }

  :deep(.task-container hr) {
    margin: 1rem 0;
  }
</style>
