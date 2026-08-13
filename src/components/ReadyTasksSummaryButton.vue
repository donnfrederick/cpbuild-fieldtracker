<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { UnitTasksAndProjectRowDto } from '@/shared/service-proxies/service-proxies';
  import { TaskStatusEnum, TaskTypeEnum } from '@/enum';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { ModeTool } from '@/interfaces/common/modeTool';
  import { formatDate } from '@/util/dateFormatter';
  import { ref, watch } from 'vue';
  import { IdbUpdateUnitTaskTSVService } from '@/shared/offlineDb/services/idbUpdateUnitTaskTSVService';
  import { IUpdateUnitTaskTSV } from '@/shared/offlineDb/interfaces/IUpdateUnitTaskTSV';
  import { storeToRefs } from 'pinia';
  import { useNetworkStore } from '@/stores/useNetworkStore';

  const router = useRouter();
  const isInstallTrackerReadyTasksRoute = computed(
    () => router.currentRoute.value.name === 'install-tracker-ready-tasks-summary'
  );

  const subTasksTypes = [
    TaskTypeEnum.Modification,
    TaskTypeEnum.TradeDamageRepair,
    TaskTypeEnum.PunchWork,
  ];
  const isMainInstallTask = (task: UnitTasksAndProjectRowDto) =>
    task.taskTypeId && !subTasksTypes.includes(task.taskTypeId);
  const offlineTasks = ref<IUpdateUnitTaskTSV[]>([]);
  const { isOffline } = storeToRefs(useNetworkStore());

  const props = defineProps({
    tasks: {
      type: Object as () => UnitTasksAndProjectRowDto[],
      required: true,
    },
    tool: {
      type: String,
      default: 'laborManager',
    },
    mode: {
      type: String,
      default: 'review',
    },
    useCustomAction: {
      type: Boolean,
      default: false,
    },
  });

  const sessionStorageService = new SessionStorageService();

  const goToTask = (task: UnitTasksAndProjectRowDto) => {
    const sessionKey = `taskSubmissionViewer_task_${task.taskId}`;
    sessionStorageService.setItem<ModeTool>(sessionKey, {
      mode: props.mode,
      tool: props.tool,
    });

    router.push({
      name: 'task-submission-viewer',
      params: {
        projectId: task.projectId,
        unitId: task.unitByScopeId,
        taskId: task.taskId,
      },
    });
  };

  const emit = defineEmits(['customAction']);

  const customAction = (task: any) => {
    emit('customAction', task);
  };

  const action = (task: UnitTasksAndProjectRowDto) => {
    if (!isOffline.value && isEditedOffline(task.taskId)) return;

    if (props.useCustomAction) customAction(task);
    else goToTask(task);
  };

  const getOfflineSyncingTasks = async (tasks: UnitTasksAndProjectRowDto[]) => {
    const taskIds = tasks.map((t) => t.taskId);
    offlineTasks.value = await IdbUpdateUnitTaskTSVService.getByTaskIds(taskIds);
  };

  const isEditedOffline = (taskId: number): boolean => {
    return offlineTasks.value?.some((t) => t.taskId === taskId) ?? false;
  };

  watch(
    () => props.tasks,
    async (newTasks) => {
      await getOfflineSyncingTasks(newTasks);
    },
    { immediate: true }
  );
</script>
<template>
  <button v-for="task in props.tasks" :key="task.taskId" @click="action(task)">
    <i class="bi bi-arrow-right-square-fill"></i>
    <div class="details">
      <span class="upper">
        <strong>Building: </strong>
        {{ task.building }},
        <strong>Level: </strong>
        {{ task.level }},
        <strong>Unit: </strong>
        {{ task.unit }},
        <strong>Area: </strong>
        {{ task.area }},
        <strong>Unit Type: </strong>
        {{ task.unitType }}
      </span>
      <span class="lower">
        <strong>Task Id: </strong>
        {{ task.taskId }},
        <strong>Phase: </strong>
        {{ task.phaseName }},
        <strong>Task Type: </strong>
        {{ task.taskTypeName }},
        <strong>Status: </strong>
        {{ TaskStatusEnum[task.statusId].toString() }},
        <span v-if="isInstallTrackerReadyTasksRoute && isMainInstallTask(task)">
          <strong>Scheduled Date: </strong>{{ formatDate(task.scheduledDate) }},
        </span>
        <span v-else-if="!isInstallTrackerReadyTasksRoute">
          <strong>Submission Date: </strong>{{ formatDate(task.submittedAt) }},
        </span>
        <strong v-if="isEditedOffline(task.taskId)" style="color: orange">Syncing...</strong>
      </span>
    </div>
  </button>
</template>
<style scoped>
  button {
    display: flex;
    align-items: center;
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    margin-bottom: 1rem;
    color: #19a7af;
  }
  button .details .upper {
    display: block;
    color: #19a7af;
    text-align: left;
    margin-left: 0.7rem;
    font-size: 15px;
  }
  button .details .lower {
    display: block;
    text-align: left;
    margin-left: 0.7rem;
    font-size: 13px;
  }
</style>
