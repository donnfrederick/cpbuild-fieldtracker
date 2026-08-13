<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute } from 'vue-router';
  import 'vue-select/dist/vue-select.css';
  import type { BreadcrumbItem, KeyValuePair } from '@/interfaces/common';
  import type {
    CompletedInspection,
    MainTaskDetail,
  } from 'api/interfaces/inspectionTracker/completedInspections';
  import { InspectionTrackerService } from '@/services/inspectionTracker';
  import dateParse from '@/util/dateParse';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { ModeTool } from '@/interfaces/common/modeTool';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const keyword = ref('');
  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');
  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const inspectionTrackerService = new InspectionTrackerService();
  const completedInspections = ref<CompletedInspection | null>(null);
  const expandedResolutionTasks = ref<KeyValuePair<number, boolean>[]>([]);
  const sessionStorageService = new SessionStorageService();

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

  onMounted(async () => {
    isLoading.value = true;

    await inspectionTrackerService
      .getCompletedInspections(Number(route.params.projectScopeId))
      .then((data) => {
        completedInspections.value = data;
      })
      .finally(() => {
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
            label: 'Inspection Tracker',
          },
          {
            label: `${completedInspections.value?.projectDetail.projectName} (${completedInspections.value?.projectDetail.scopeName})`,
          },
          {
            label: 'Completed Inspections',
          },
        ] as BreadcrumbItem[];
      });
  });

  const goBack = () => {
    router.push({
      name: 'inspection-tracker-inspection-queue',
      params: {
        projectScopeId: route.params.projectScopeId,
      },
    });
  };

  const toggleResolutionTasks = (key: number): void => {
    const existingProject = expandedResolutionTasks.value.find((p) => p.key === key);

    if (existingProject) {
      existingProject.value = !existingProject.value;
      return;
    }

    expandedResolutionTasks.value.push({ key, value: true });
  };

  const isTaskExpanded = (key: number): boolean => {
    const existingProject = expandedResolutionTasks.value.find((p) => p.key === key);

    if (existingProject) {
      return existingProject.value;
    }
    return false;
  };

  const openTaskSubmission = (unitByScopeId: number, taskId: number, mode: string) => {
    const sessionKey = `taskSubmissionViewer_task_${taskId}`;
    sessionStorageService.setItem<ModeTool>(sessionKey, {
      mode,
      tool: 'inspectionTracker',
    });

    router.push({
      name: 'task-submission-viewer',
      params: {
        projectId: completedInspections.value?.projectDetail.projectScopeById,
        unitId: unitByScopeId,
        taskId,
      },
    });
  };

  const matchesQuery = (item: any, keyword: string) => {
    const q = keyword.toLowerCase();
    return Boolean(
      item.taskId.toString().includes(q) ||
        item.taskTypeName.toLowerCase().includes(q) ||
        item.taskStatusName.toLowerCase().includes(q) ||
        dateParse(item.dateCreated).includes(q) ||
        item.createdBy?.toLowerCase().includes(q) ||
        item.parentTaskTypeName?.toLowerCase().includes(q) ||
        item.parentTaskStatusName?.toLowerCase().includes(q) ||
        item.inspectedBy?.toLowerCase().includes(q) ||
        dateParse(item.inspectionDate).includes(q) ||
        item.building?.toLowerCase().includes(q) ||
        item.level?.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q) ||
        item.area?.toLowerCase().includes(q) ||
        item.unitType?.toLowerCase().includes(q) ||
        item.unitPhaseName?.toLowerCase().includes(q) ||
        item.unitStatusName?.toLowerCase().includes(q)
    );
  };

  const filteredRecord = computed(() => {
    if (!keyword.value) return completedInspections.value;

    if (completedInspections.value == null) return;

    const keywordVal = keyword.value.toLowerCase().trim();
    const original = completedInspections.value;

    if (!keywordVal) return original;

    const filteredTasks = original.tasks
      .map((task) => {
        const matchedChildren =
          task.resolutionTasks?.filter((child) => matchesQuery(child, keywordVal)) ?? [];
        const parentIsMatch = matchesQuery(task, keywordVal);

        if (parentIsMatch || matchedChildren.length > 0) {
          return { ...task, resolutionTasks: matchedChildren } as MainTaskDetail;
        }
        return null;
      })
      .filter((task) => task !== null); // Remove null values

    return {
      projectDetail: original.projectDetail,
      tasks: filteredTasks,
    };
  }) as unknown as CompletedInspection;
</script>
<template>
  <TopNavWithOverlay :is-loading="isLoading" />

  <div v-if="completedInspections != null" class="body-content ft-project-viewer">
    <Breadcrumb :breadcrumbs="breadcrumbs" :close-page-text="'Go Back'" @return="goBack" />
    <hr />

    <div v-if="!isLoading" class="completed-inspections">
      <h4 class="text-dark fw-bold">
        {{ completedInspections.projectDetail.projectName }} ({{
          completedInspections.projectDetail.scopeName
        }}) - Install
      </h4>
      <h6 class="text-dark">Completed Inspections</h6>

      <div class="form-group unit-search">
        <label class="text-muted">Filter by Keywords</label>
        <br />
        <div class="d-flex">
          <input v-model="keyword" placeholder="Filter by unit details" />
        </div>
      </div>

      <div class="main-tasks col-md-4">
        <div v-for="(task, index) in filteredRecord!.tasks" :key="index">
          <div class="task">
            <UnitInfo :record="task" />
            <TaskInfo :record="task" />

            <button
              class="task-action-link-button"
              @click="openTaskSubmission(task.unitByScopeId, task.taskId, 'preview')"
            >
              View Inspection
            </button>

            <template v-if="task.taskStatusName.toLowerCase() == 'passed'">
              <button
                class="task-action-link-button"
                @click="openTaskSubmission(task.unitByScopeId, task.taskId, 'edit')"
              >
                Edit Inspection
              </button>
            </template>

            <template v-if="task.resolutionTasks.length > 0">
              <button class="expand" @click="toggleResolutionTasks(index)">
                <i
                  :class="['bi', isTaskExpanded(index) ? 'bi-caret-up-fill' : 'bi-caret-down-fill']"
                ></i>
                Resolution Tasks
              </button>

              <div v-if="isTaskExpanded(index)" class="resolution-tasks">
                <div
                  v-for="(resolutionTask, resolutionTaskIndex) in task.resolutionTasks"
                  :key="resolutionTaskIndex"
                  style="margin-left: 2rem"
                >
                  <TaskInfo :record="resolutionTask" />

                  <template
                    v-if="
                      resolutionTask.taskStatusName.toLowerCase() == 'passed' ||
                      resolutionTask.taskStatusName.toLowerCase() == 'failed' ||
                      resolutionTask.taskStatusName.toLowerCase() == 'ready'
                    "
                  >
                    <button
                      class="task-action-link-button"
                      @click="
                        openTaskSubmission(task.unitByScopeId, resolutionTask.taskId, 'preview')
                      "
                    >
                      View Task
                    </button>
                  </template>

                  <template
                    v-if="
                      resolutionTask.taskStatusName.toLowerCase() == 'passed' ||
                      resolutionTask.taskStatusName.toLowerCase() == 'ready'
                    "
                  >
                    <button
                      class="task-action-link-button"
                      @click="openTaskSubmission(task.unitByScopeId, resolutionTask.taskId, 'edit')"
                    >
                      Edit Task
                    </button>
                  </template>

                  <template v-if="resolutionTask.taskStatusName.toLowerCase() == 'submitted'">
                    <button
                      class="task-action-link-button"
                      @click="
                        openTaskSubmission(task.unitByScopeId, resolutionTask.taskId, 'inspection')
                      "
                    >
                      Review Submission
                    </button>
                  </template>

                  <hr v-if="resolutionTaskIndex != task.resolutionTasks.length - 1" />
                </div>
              </div>
            </template>
          </div>
          <hr />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
  .completed-inspections {
    padding: 2rem 3rem;
  }

  .main-tasks div:last-of-type hr {
    display: none;
  }

  .main-tasks .task {
    margin: 2rem;
  }

  i.bi-caret-down-fill,
  i.bi-caret-up-fill {
    margin-right: 5px;
    color: #19a7af;
  }

  .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 15px;
    font-weight: bold;
    margin-bottom: 0.7rem;
    color: #3c3c3c;
  }
</style>
