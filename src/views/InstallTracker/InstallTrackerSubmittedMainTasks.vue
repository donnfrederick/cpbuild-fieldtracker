<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute } from 'vue-router';
  import 'vue-select/dist/vue-select.css';

  import TopNavBar from '@/components/TopNavBar.vue';
  import type {
    WorkerDetails,
    ProjectByScopeDetails,
    MainTasks,
  } from '@/interfaces/installTracker';
  import type { BreadcrumbItem } from '@/interfaces/common';
  import { InstallTrackerService } from '@/services/installTracker';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { ModeTool } from '@/interfaces/common/modeTool';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');
  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const sessionStorageService = new SessionStorageService();

  const projectByScopeDetails = ref<ProjectByScopeDetails>({
    id: 0,
    ftProjectId: 0,
    projectId: 0,
    projectName: '',
    scopeTypeId: 0,
    scopeTypeName: '',
    statusId: 0,
    statusName: '',
    teamLeadId: 0,
    teamLeadUserId: 0,
  });

  const workerDetails = computed<WorkerDetails | null>(() => {
    if (!authStore.getWorkerDetails) {
      return null;
    }
    return authStore.getWorkerDetails;
  });

  const mainTasks = ref<MainTasks[]>([]);
  const installTrackerService = new InstallTrackerService();

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal !== null ? newVal : 0;
    },
    { immediate: true }
  );

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  async function fetchProjectByScopeDetails() {
    try {
      const data = await installTrackerService.projectByScopeDetailsApi({
        projectByScopeId: Number(route.params.id),
      });

      projectByScopeDetails.value = data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getMainTasks() {
    try {
      const data = await installTrackerService.mainTaskSubmissionsApi({
        projectByScopeId: Number(route.params.id),
        workerId: workerDetails.value?.id ?? 0,
      });

      mainTasks.value = data.filter(
        (task: MainTasks) =>
          task.submittedBy != null ||
          task.taskStatusName == 'Passed' ||
          task.taskStatusName == 'Failed'
      );

      mainTasks.value.forEach((task: MainTasks, key: number) => {
        if (task.scheduledDate != null) {
          const scheduledDate = new Date(task.scheduledDate);
          mainTasks.value[key].scheduledDate = `${(scheduledDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${scheduledDate
            .getDate()
            .toString()
            .padStart(2, '0')}-${scheduledDate.getFullYear()}`;
        } else {
          mainTasks.value[key].scheduledDate = '--';
        }

        if (task.submissionDate != null) {
          const submissionDate = new Date(task.submissionDate);
          mainTasks.value[key].submissionDate = `${(submissionDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${submissionDate
            .getDate()
            .toString()
            .padStart(2, '0')}-${submissionDate.getFullYear()}`;
        } else {
          mainTasks.value[key].submissionDate = '--';
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

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

    await fetchProjectByScopeDetails();
    await getMainTasks();

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
        label: `${projectByScopeDetails.value.projectName} (${projectByScopeDetails.value.scopeTypeName})`,
      },
      {
        label: 'Submitted Main Tasks',
      },
    ] as BreadcrumbItem[];
  });

  const goBack = () => {
    router.push({ name: 'install-tracker-unit-task-queue', params: { id: route.params.id } });
  };

  const goToTaskSubmission = (projectId: number, unitId: number, taskId: number, mode: string) => {
    const sessionKey = `taskSubmissionViewer_task_${taskId}`;
    sessionStorageService.setItem<ModeTool>(sessionKey, {
      mode,
      tool: 'installTracker',
    });

    router.push({
      name: 'task-submission-viewer',
      params: { projectId, unitId, taskId },
      query: {
        mode,
        tool: 'installTracker',
      },
    });
  };

  const viewSubTasks = (projectId: number, unitByScopeId: number) => {
    router.push({
      name: 'install-tracker-sub-tasks',
      params: { projectId, unitByScopeId },
    });
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
    <Breadcrumb :breadcrumbs="breadcrumbs" :close-page-text="'Go Back'" @return="goBack" />
    <hr />

    <div class="task-queue">
      <h4 class="text-dark fw-bold">
        {{ projectByScopeDetails.projectName }} ({{ projectByScopeDetails.scopeTypeName }})
      </h4>
      <h5 class="text-dark fw-bold">Submitted Main Tasks (by unit)</h5>
      <div class="main-tasks col-md-4">
        <div v-for="task in mainTasks" :key="task.taskId">
          <div class="task">
            <UnitInfo :record="task" />
            <TaskInfo :record="task" />
            <button
              v-if="task.reviewedAt == null && task.taskStatusName == 'Submitted'"
              class="task-action-link-button"
              @click="
                goToTaskSubmission(
                  task.projectByScopeId,
                  task.unitByScopeId,
                  task.taskId,
                  'edit-submission'
                )
              "
            >
              Edit Task Submission
            </button>
            <button
              class="task-action-link-button"
              @click="
                goToTaskSubmission(
                  task.projectByScopeId,
                  task.unitByScopeId,
                  task.taskId,
                  'preview'
                )
              "
            >
              View Task Submission
            </button>
            <button
              v-if="task.hasSubTasks"
              class="task-action-link-button"
              @click="viewSubTasks(task.projectByScopeId, task.unitByScopeId)"
            >
              View Submitted Subtasks for this Unit
            </button>
          </div>
          <hr />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main-tasks div:last-of-type hr {
    display: none;
  }
  .main-tasks .task {
    margin: 2rem;
  }
  .task-queue {
    padding: 2rem 3rem;
  }
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }
  .ft-project-viewer {
    overflow-y: auto; /* Enables vertical scrolling if content overflows */
    height: 100vh; /* Optional: Adjust if you want a specific height */
    margin-top: 62px;
  }
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1070; /* Ensure it's above other content including modals */
  }
  .header-body {
    width: 100%;
    padding: 10px 30px;
    min-width: 400px;
  }
  i.bi-caret-down-fill,
  i.bi-caret-up-fill {
    margin-right: 5px;
    color: #19a7af;
  }
  .bi-x-circle {
    margin-left: 5px;
  }
  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }
  hr {
    margin: 0 15px;
    color: #7a7a7a;
    min-width: 400px;
  }
  .error-message {
    color: #dc3545;
    padding: 10px 30px;
    text-align: center;
    width: 100%;
    background-color: #f8d7da;
  }
  .toast-message {
    background-color: #19a7af !important;
    /* color: #19A7AF !important; */
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
  .toast-message button {
    border: none;
    background: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
  }
  :deep(span) {
    color: rgb(60, 60, 60);
  }
  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }
  }
</style>
