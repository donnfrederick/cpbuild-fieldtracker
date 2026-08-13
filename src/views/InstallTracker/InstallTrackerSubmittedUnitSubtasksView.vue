<script setup lang="ts">
  import { onMounted, ref, watch, computed } from 'vue';
  import type { BreadcrumbItem, TaskInfo, UnitInfo } from '@/interfaces/common';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/useAuthStore';
  import type { WorkerDetails } from '@/interfaces/workforce';
  import type { UnitData } from '@/interfaces/project';

  const isLoading = ref(false);
  const isLoaded = ref(false);
  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const router = useRouter();
  const route = useRoute();
  const userId = ref<number>(0);
  const authStore = useAuthStore();
  const projectByScopeDetails = ref({ projectName: '', scopeTypeName: '' } as any);
  const parentTaskUnitInfo = ref<UnitInfo>({} as UnitInfo);
  const subTaskInfo = ref<TaskInfo[]>([]);

  const workerDetails = computed<WorkerDetails | null>(() => {
    if (!authStore.getWorkerDetails) {
      return null;
    }
    return authStore.getWorkerDetails;
  });

  const goBack = () => {
    router.push({ name: 'install-tracker-main-tasks', params: { id: route.params.projectId } });
  };

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal ?? 0; // Use nullish coalescing (??) for clarity
    },
    { immediate: true }
  );

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

    const { getSubtasksByUnitByScopeAndWorkerId, getUnitData } = await import(
      '@/services/unitByScope'
    );
    const { getProjectRecord } = await import('@/services/projectScope');

    isLoaded.value = false;

    await getProjectRecord(Number(route.params.projectId)).then((data) => {
      if (data == null) return;

      projectByScopeDetails.value.projectName = data.projectName;
      projectByScopeDetails.value.scopeTypeName = data.scopeTypeName;
      const projectTitle = `${data.projectName} (${data.scopeTypeName})`;

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
          label: projectTitle,
          path: `/install-tracker/main-tasks/${route.params.projectId}`,
        },
        {
          label: 'Submitted Sub Tasks',
        },
      ] as BreadcrumbItem[];
      isLoading.value = false;
      isLoaded.value = true;
    });

    if (workerDetails.value) {
      await getSubtasksByUnitByScopeAndWorkerId(
        Number(route.params.unitByScopeId),
        workerDetails.value.id
      ).then((data) => {
        subTaskInfo.value = data as unknown as TaskInfo[];
      });
    }

    await getUnitData(Number(route.params.unitByScopeId)).then((data: UnitData | null) => {
      if (data != null) {
        parentTaskUnitInfo.value = data as unknown as UnitInfo;
        parentTaskUnitInfo.value.progress = data.unitProgressPercent;
      }
    });
  });
</script>

<template>
  <TopNavWithOverlay :is-loading="isLoading" />

  <div class="body-content ft-project-viewer">
    <Breadcrumb :breadcrumbs="breadcrumbs" :close-page-text="'Go Back'" @return="goBack" />

    <div v-if="!isLoading" class="sub-task-queue">
      <h4 class="text-dark fw-bold mb-4">
        {{ projectByScopeDetails.projectName }} ({{ projectByScopeDetails.scopeTypeName }})
      </h4>
      <UnitInfo :record="parentTaskUnitInfo" />
      <h5 class="text-dark fw-bold mt-4">Submitted Sub Tasks</h5>
      <div class="sub-tasks col-md-4">
        <div v-for="task in subTaskInfo" :key="task.taskId">
          <div class="task">
            <TaskInfo :record="task" />
            <button
              v-if="
                parentTaskUnitInfo.submissionDate != null &&
                task.submissionDate != null &&
                parentTaskUnitInfo.submissionDate == task.submissionDate
              "
              class="task-action-link-button"
            >
              Edit Task Submission
            </button>
            <button v-else class="task-action-link-button">View Task Submission</button>
          </div>
          <hr />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .sub-task-queue {
    padding: 2rem 3rem;
  }

  .sub-tasks .task {
    margin: 2rem;
  }
</style>
