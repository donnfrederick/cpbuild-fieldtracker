<script setup lang="ts">
  import type { InstallTrackerTaskQueueDto } from '@/shared/service-proxies/service-proxies';
  import { computed } from 'vue';

  const props = defineProps({
    items: {
      type: Object as () => InstallTrackerTaskQueueDto[],
      required: true,
    },
    title: {
      type: String,
      default: 'Main Task Queue',
    },
    disableActions: {
      type: Boolean,
      default: false,
    },
    startActionText: {
      type: String,
      default: 'Start',
    },
    continueActionText: {
      type: String,
      default: 'Continue',
    },
    listCount: {
      type: Number,
      default: 0,
    },
  });

  const emit = defineEmits(['startAction']);

  const startAction = (item: InstallTrackerTaskQueueDto) => {
    if (props.disableActions) return;
    emit('startAction', item);
  };

  // Compute started and non-started tasks
  const startedTasks = computed(() =>
    props.items.filter((item) => item.taskStatusName?.toLowerCase() === 'started')
  );

  const notStartedTasks = computed(() =>
    props.items.filter((item) => item.taskStatusName?.toLowerCase() !== 'started')
  );

  const displayList = computed(() => {
    const result = [...startedTasks.value];

    if (startedTasks.value.length == 0) {
      result.push(...notStartedTasks.value.slice(0, 2));
    } else {
      result.push(notStartedTasks.value[0]);
    }

    return result;
  });
</script>

<template>
  <div class="sub-tasks-queue-container col-md-4">
    <span class="title">
      {{ title }}
    </span>
    <div v-for="(item, index) in displayList" :key="item.taskId" class="tasks">
      <div
        class="task-container"
        :class="{
          current:
            item.taskStatusName?.toLowerCase() === 'started' ||
            (startedTasks.length == 0 && notStartedTasks.length > 0 && index === 0),
          upnext: item.taskStatusName?.toLowerCase() !== 'started',
        }"
      >
        <slot name="taskLabel" :item="item" :index="index">
          <template
            v-if="
              item.taskStatusName?.toLowerCase() === 'started' ||
              (startedTasks.length == 0 && notStartedTasks.length > 0 && index === 0)
            "
          >
            <span class="d-block task-label">Current</span>
          </template>
          <template v-else-if="item.taskStatusName?.toLowerCase() !== 'started'">
            <span class="d-block task-label">Up Next</span>
          </template>
        </slot>

        <UnitInfo :record="item" />
        <TaskInfo :record="item" />

        <div v-if="item.secondaryWorkerName" class="secondary-worker">
          <span class="text-success">
            <strong>Secondary Worker: </strong>
            {{ item.secondaryWorkerName }}
          </span>
        </div>

        <slot name="actions" :item="item" :index="index">
          <template
            v-if="
              item.taskStatusName?.toLowerCase() === 'started' ||
              (startedTasks.length == 0 && notStartedTasks.length > 0 && index === 0)
            "
          >
            <button
              class="task-action-button"
              :disabled="disableActions"
              @click="startAction(item)"
            >
              <template v-if="item.taskStatusName?.toLowerCase() === 'started'">
                {{ continueActionText }}
              </template>
              <template v-else>
                {{ startActionText }}
              </template>
            </button>
          </template>
        </slot>
      </div>
      <hr v-if="index != displayList.length - 1" />
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
    color: #19a7af;
  }

  .tasks .task-container {
    width: auto;
    height: auto;
    margin: 10px 0;
    padding: 20px;
  }

  .tasks .task-container.current {
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
