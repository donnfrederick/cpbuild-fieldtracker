<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute } from 'vue-router';
  import 'vue-select/dist/vue-select.css';
  import TopNavBar from '@/components/TopNavBar.vue';
  import type { BreadcrumbItem } from '@/interfaces/common';
  import {
    InstallTrackerReadyTaskSummaryByUserDto,
    InstallTrackerReadyUnitTaskByUserDto,
    InstallTrackerServiceProxy,
    TaskSubmissionViewerServiceProxy,
  } from '@/shared/service-proxies/service-proxies';
  import { featureFlags } from '@/config/featureFlags';
  import { TaskStatusEnum } from '@/enum';
  import { localStorageHelper } from '@/util/localStorageHelper';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { storeToRefs } from 'pinia';
  import { IdbGetTaskSubmissionViewerDetailsService } from '@/shared/offlineDb/services/idbGetTaskSubmissionViewerDetailsService';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const userId = ref<number | null>(0);
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);

  const currentUnit = ref<any>({});

  const isLoading = ref(false);
  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const readyTasks = ref<InstallTrackerReadyTaskSummaryByUserDto[]>([]);
  const selectedTask = ref<InstallTrackerReadyUnitTaskByUserDto>(
    {} as InstallTrackerReadyUnitTaskByUserDto
  );

  const installTrackerServiceProxy = new InstallTrackerServiceProxy();

  const taskSubmissionViewerServiceProxy = new TaskSubmissionViewerServiceProxy();

  const showProjectWorkSubmissionCreateModal = ref<boolean>(false);
  const userRoleString = ref<string>('');
  const showToast = ref(false);
  const toastMessage = ref('');
  const showToastErr = ref(false);
  const toastErrMessage = ref('');
  const offlineModeEnabled = ref<boolean>(featureFlags.offlineMode as boolean);

  const init = async () => {
    await installTrackerServiceProxy
      .getReadyTaskSummaryByUser(Number(userId.value))
      .then((response: InstallTrackerReadyTaskSummaryByUserDto[]) => {
        readyTasks.value = response;
        processPendingMainTasks();
        isLoading.value = false;
      })
      .catch((error) => {
        console.error('Error fetching ready tasks:', error);
      })
      .finally(async () => {
        if (!offlineModeEnabled.value) {
          return;
        }

        const taskIds = readyTasks.value.flatMap((r: InstallTrackerReadyTaskSummaryByUserDto) =>
          ['pendingMainTasks', 'pendingSubTasks'].flatMap(
            (key) =>
              (r as any)[key]?.map((t: InstallTrackerReadyUnitTaskByUserDto) => t.taskId) ?? []
          )
        );

        if (taskIds.length) {
          await taskSubmissionViewerServiceProxy.getTaskSubmissionViewerDetailsBulkForOffline(
            taskIds
          );
        }
      });
  };

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal !== null ? newVal : 0;
    },
    { immediate: true }
  );

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';

    if (isOffline.value && userId.value == 0)
      userId.value = localStorageHelper<number | null>('userId').get();
  });

  onMounted(async () => {
    isLoading.value = true;

    const userRoles = authStore.userInfo?.clientPrincipal.allowedRoles || [];
    const allowedRoles = (route.meta.allowedRoles as string[]) || [];

    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAllowedRole) {
      router.push({ name: 'dashboard' });
      localStorage.setItem('redirectMsg', 'You do not have permission to access this tool.');
      return;
    }

    await init();

    isLoading.value = false;
    breadcrumbs.value = [
      {
        label: 'Dashboard',
        path: '/dashboard',
      },
      {
        label: 'IHI Tools',
      },
      {
        label: 'Install Tracker',
      },
      {
        label: 'Ready Task Summary',
      },
    ] as BreadcrumbItem[];
  });

  const goBack = () => {
    router.push({ name: 'dashboard' });
  };

  const redirectToActiveProjectScopes = () => {
    router.push({
      name: 'install-tracker-project-scopes',
    });
  };

  const expandScope = (scope: InstallTrackerReadyTaskSummaryByUserDto, mode: string) => {
    if (mode == 'projectScope') {
      scope.expanded = !scope.expanded;
    } else if (mode == 'mainTask') {
      scope.mainTaskExpanded = !scope.mainTaskExpanded;
    } else if (mode == 'subTask') {
      scope.subTaskExpanded = !scope.subTaskExpanded;
    } else if (mode == 'assistAssignment') {
      scope.assistAssignmentExpanded = !scope.assistAssignmentExpanded;
    }
  };

  const closeProjectWorkSubmissionCreateModal = () => {
    showProjectWorkSubmissionCreateModal.value = false;
  };

  const submitProjectWorkSubmissionCreateHandler = () => {
    isLoading.value = true;
  };

  const successProjectWorkSubmissionCreateHandler = async () => {
    await init();

    closeProjectWorkSubmissionCreateModal();

    isLoading.value = false;

    showToast.value = true;
    toastMessage.value = 'A new Work Hour Submission has been created';

    setTimeout(() => {
      showToast.value = false;
      toastMessage.value = '';
    }, 5000);
  };

  const failedProjectWorkSubmissionCreateHandler = (errMessage: string) => {
    showProjectWorkSubmissionCreateModal.value = false;

    isLoading.value = false;

    showToastErr.value = true;
    toastErrMessage.value = errMessage;

    setTimeout(() => {
      showToastErr.value = false;
      toastErrMessage.value = '';
    }, 5000);
  };

  const openWorkHoursCreateModal = async (item: any) => {
    await getCurrentUnit(item.taskId);

    selectedTask.value = item;
    showProjectWorkSubmissionCreateModal.value = true;
  };

  const startedMainTasks = (tasks: InstallTrackerReadyUnitTaskByUserDto[]) => {
    return (
      tasks.filter(
        (task: InstallTrackerReadyUnitTaskByUserDto) =>
          TaskStatusEnum[task.statusId].toString().toLowerCase() === 'started'
      ) ?? []
    );
  };

  const notStartedMainTasks = (tasks: InstallTrackerReadyUnitTaskByUserDto[]) => {
    return tasks
      .filter(
        (task: InstallTrackerReadyUnitTaskByUserDto) =>
          TaskStatusEnum[task.statusId].toString().toLowerCase() !== 'started'
      )
      .splice(0, 1);
  };

  const processPendingMainTasks = () => {
    readyTasks.value.forEach((readyTask) => {
      const started = startedMainTasks(readyTask.pendingMainTasks ?? []);
      const nonStarted = notStartedMainTasks(readyTask.pendingMainTasks ?? []);
      readyTask.pendingMainTasks = started;
      if (nonStarted.length > 0) {
        readyTask.pendingMainTasks?.push(...nonStarted);
      }
    });
  };

  const getCurrentUnit = async (taskId: number) => {
    try {
      currentUnit.value = await IdbGetTaskSubmissionViewerDetailsService.getDetails(taskId);
    } catch (error) {
      console.error('Error fetching current unit from IndexedDB:', error);
    }
  };
</script>
<template>
  <div class="top-nav-bar">
    <TopNavBar />
  </div>

  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
  <div class="body-content ft-project-viewer">
    <Breadcrumb :breadcrumbs="breadcrumbs" :close-page-text="'Close Tool'" @return="goBack" />

    <hr />

    <button class="redirect-btn" @click="redirectToActiveProjectScopes">
      <i class="bi bi-eye"></i>
      View Project Scopes
    </button>

    <div class="ready-tasks col-md-4 mb-5">
      <template v-if="readyTasks.length > 0">
        <div v-for="(scope, index) in readyTasks" :key="index" class="project-scope">
          <button class="scope-header" @click="expandScope(scope, 'projectScope')">
            <i
              :class="{
                bi: true,
                'bi-caret-down-fill': !scope.expanded,
                'bi-caret-up-fill': scope.expanded,
              }"
            ></i>
            <span class="text-dark fw-bold">
              {{ scope.projectName }} ({{ scope.scopeTypeName }})
            </span>
          </button>
          <div v-if="scope.expanded" class="types">
            <div
              v-if="scope.pendingMainTasks != undefined && scope.pendingMainTasks?.length > 0"
              class="type"
            >
              <button class="type-header" @click="expandScope(scope, 'mainTask')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.mainTaskExpanded,
                    'bi-caret-up-fill': scope.mainTaskExpanded,
                  }"
                ></i>
                Pending Main Tasks ({{ scope.pendingMainTasks?.length }})
              </button>
              <div v-if="scope.mainTaskExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.pendingMainTasks != undefined"
                  :tasks="scope.pendingMainTasks"
                  tool="installTracker"
                  mode="submission"
                />
                <strong v-if="scope.pendingMainTasks?.length == 0" class="text-danger no-task"
                  >No Pending Main Task</strong
                >
              </div>
            </div>
            <div
              v-if="scope.pendingSubTasks != undefined && scope.pendingSubTasks?.length > 0"
              class="type"
            >
              <button class="type-header" @click="expandScope(scope, 'subTask')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.subTaskExpanded,
                    'bi-caret-up-fill': scope.subTaskExpanded,
                  }"
                ></i>
                Pending Subtasks ({{ scope.pendingSubTasks?.length }})
              </button>
              <div v-if="scope.subTaskExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.pendingSubTasks != undefined"
                  :tasks="scope.pendingSubTasks"
                  :project-id="index"
                  tool="installTracker"
                  mode="submission"
                />
                <strong v-if="scope.pendingSubTasks?.length == 0" class="text-danger no-task"
                  >No Pending Subtask</strong
                >
              </div>
            </div>
            <div
              v-if="scope.assistAssignments != undefined && scope.assistAssignments?.length > 0"
              class="type"
            >
              <button class="type-header" @click="expandScope(scope, 'assistAssignment')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.assistAssignmentExpanded,
                    'bi-caret-up-fill': scope.assistAssignmentExpanded,
                  }"
                ></i>
                Assist Assignment ({{ scope.assistAssignments?.length }})
              </button>
              <div v-if="scope.assistAssignmentExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.assistAssignments != undefined"
                  :tasks="scope.assistAssignments"
                  :project-id="index"
                  :use-custom-action="true"
                  tool="installTracker"
                  mode="submission"
                  @custom-action="openWorkHoursCreateModal($event)"
                />
                <strong v-if="scope.assistAssignments?.length == 0" class="text-danger no-task"
                  >No Assist Assignment</strong
                >
              </div>
            </div>
          </div>
        </div>
      </template>
      <span v-else class="no-result"
        >No pending tasks to perform. If you feel this is not correct, please reach our to your team
        lead.</span
      >
    </div>
  </div>

  <ProjectWorkSubmissionCreateModal
    v-if="userId"
    :show-modal="showProjectWorkSubmissionCreateModal"
    :project-by-scope-id="selectedTask.projectId"
    :user-id="userId"
    :user-roles="userRoleString"
    :task-id="selectedTask.taskId"
    :phase-id="selectedTask.phaseId"
    :task-assist-type-only="true"
    :current-unit="currentUnit"
    @on-close="closeProjectWorkSubmissionCreateModal"
    @on-submit="submitProjectWorkSubmissionCreateHandler"
    @on-success="successProjectWorkSubmissionCreateHandler"
    @on-failed="failedProjectWorkSubmissionCreateHandler"
  />
</template>

<style scoped>
  .redirect-btn {
    color: #fff;
    background: #19a7af;
    margin: 2.5rem 0 0.5rem 2rem;
    padding: 0.7rem 1rem;
    border: none;
    border-radius: 5px;
    outline: none;
  }
  .ready-tasks {
    padding: 1rem;
  }
  .ready-tasks .project-scope {
    margin-bottom: 1rem;
  }
  .ready-tasks .project-scope .scope-header {
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    width: 100%;
    justify-content: flex-start;
    margin-bottom: 0.25rem; /* spacing row */
  }
  .ready-tasks .project-scope .scope-header .text-dark {
    display: inline-block;
    text-align: left;
    flex: 1 1 auto;
  }
  .ready-tasks .project-scope .types {
    padding: 0.5rem 2rem;
  }
  .ready-tasks .project-scope .types .type-header {
    width: 100%;
    color: #000;
    background: #d8f0f1;
    border: none;
    outline: none;
    text-align: left;
    margin-bottom: 0.7rem;
    font-weight: bolder;
    padding: 0.4rem 0.6rem;
    font-size: 14px;
  }
  .ready-tasks .project-scope .types .tasks .no-task {
    display: block;
    margin-bottom: 0.7rem;
    margin-left: 1rem;
  }

  .bi-x-circle {
    margin-left: 5px;
  }

  i.bi-caret-down-fill,
  i.bi-caret-up-fill {
    margin-right: 5px;
    color: #19a7af;
  }

  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }
</style>
