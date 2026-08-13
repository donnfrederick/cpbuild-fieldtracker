<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
  import { Modal } from 'bootstrap';
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute } from 'vue-router';
  import 'vue-select/dist/vue-select.css';
  import type { BlockedUnitsResult, ProjectByScopeDetails } from '@/interfaces/installTracker';

  import { InstallTrackerService } from '@/services/installTracker';
  import { unitDataApi } from '@/services/laborManager';
  import type { WorkerDetails } from '@/interfaces/workforce';
  import type { InstallTrackerTaskQueue } from '@/interfaces/installTracker';
  import type { WorkHourSubmissions } from '@/interfaces/workforce';

  import ProjectWorkSubmissionEditModal from '@/components/modal/ProjectWorkSubmissionEditModal.vue';
  import type { UnitData } from '@/interfaces/project';
  import SecondaryTasksQueue from '@/components/SecondaryTasksQueue.vue';
  import ProjectWorkSubmissionCreateModal from '@/components/modal/ProjectWorkSubmissionCreateModal.vue';
  import type { TaskDetails as TaskDetailsType } from '@/interfaces/project';
  import UnitTaskQueueSubmissionLog from '@/components/UnitTaskQueueSubmissionLog.vue';
  import {
    InstallTrackerServiceProxy,
    InstallTrackerTaskQueueDto,
  } from '@/shared/service-proxies/service-proxies';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { ModeTool } from '@/interfaces/common/modeTool';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();

  const isLoading = ref(false);
  const userId = ref<number>(0);
  const userRoleString = ref<string>('');
  const mainTasks = ref<InstallTrackerTaskQueueDto[]>([]);
  const subTasks = ref<InstallTrackerTaskQueue[]>([]);
  const secondaryTasks = ref<InstallTrackerTaskQueue[]>([]);
  const blockedUnits = ref<BlockedUnitsResult[]>([]);

  const currentUnit = ref<UnitData>({
    area: '',
    building: '',
    completionDate: '',
    currentPhaseId: 0,
    currentPhaseName: '',
    fieldTrackerProjectRowId: 0,
    finalCumulativePercent: 0,
    id: 0,
    incrementalWeightPercent: 0,
    initialCumulativePercent: 0,
    level: '',
    projectByScopeId: 0,
    projectScopeTypeId: 0,
    projectScopeTypeName: '',
    unit: '',
    unitProgressPercent: 0,
    unitStatusId: 0,
    unitStatusName: '',
    unitType: '',
    blockingIssues: [],
    quantities: 0,
    mainTasks: [],
    subtasks: [],
  });

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

  const workerDetails = computed<WorkerDetails | undefined>(() => {
    if (!authStore.getWorkerDetails) {
      return undefined;
    }
    return authStore.getWorkerDetails;
  });

  const installTrackerService = new InstallTrackerService();
  const installTrackerServiceProxy = new InstallTrackerServiceProxy();

  const showToast = ref(false);
  const toastMessage = ref('');

  const showToastErr = ref(false);
  const toastErrMessage = ref('');

  // Submission Log
  const editProjectWorkSubmissionModalRef = ref<HTMLElement | null>(null);

  const viewProjectWorkSubmissionModalRef = ref<HTMLElement | null>(null);
  let viewProjectWorkSubmissionModalInstance: Modal | null = null;

  const showProjectWorkSubmissionEditModal = ref<boolean>(false);

  const workHourSubmissions = ref<WorkHourSubmissions[]>([]);

  const onEditLog = ref<any>({
    id: 0,
    projectName: '',
    scopeTypeName: '',
    submitTypeId: 0,
    submitTypeName: '',
    statusId: 0,
    statusName: '',
    hours: '',
    quantity: 0,
    hoursArr: [1, 0],
    submissionDate: '',
    submittedBy: '',
    submissionNotes: '',
    managerNotes: '',
    hoursOverride: 0,
    hoursOverrideArr: [1, 0],
    quantityOverride: 0,
    images: [],
    taskStatusId: 0,
    // Add required properties for TaskSubmissionViewerWorkHourSubmissionDto
    hoursArray: [1, 0],
    hoursOverrideArray: [1, 0],
    workerName: '',
    workerId: 0,
    taskName: '',
    phaseName: '',
    unitName: '',
  });

  const onViewLog = ref<WorkHourSubmissions>({
    id: 0,
    projectName: '',
    scopeTypeName: '',
    submitTypeId: 0,
    submitTypeName: '',
    statusId: 0,
    statusName: '',
    hours: '',
    quantity: 0,
    hoursArr: [1, 0],
    submissionDate: '',
    submittedBy: '',
    submissionNotes: '',
    managerNotes: '',
    hoursOverride: 0,
    hoursOverrideArr: [1, 0],
    quantityOverride: 0,
    images: [],
    taskStatusId: 0,
  });

  const showProjectWorkSubmissionCreateModal = ref<boolean>(false);

  const projectByScopeId = ref<number>(0);

  const taskDetails = ref<TaskDetailsType>({
    taskId: 0,
    unitId: 0,
    parentTaskId: 0,
    parentTaskTypeId: 0,
    parentTaskTypeName: '',
    parentStatusId: 0,
    parentStatusName: '',
    taskTypeId: 0,
    taskTypeName: '',
    phaseId: 0,
    phaseName: '',
    statusId: 0,
    statusName: '',
    imageAcknowledgmentChecked: false,
    imageAcknowledgmentText: '',
    assignedWorkerId: 0,
    assignedWorkerName: '',
    scheduledDate: new Date(),
    scheduledById: 0,
    submittedAt: new Date(),
    submittedBy: 0,
    submissionNotes: '',
    reviewedAt: new Date(),
    reviewedBy: 0,
    reviewNotes: '',
    taskDetails: '',
    createdAt: new Date(),
    createdBy: 0,
    updatedAt: new Date(),
    updatedBy: 0,
    deletedAt: new Date(),
    deletedBy: 0,
    images: [],
    proofImages: [],
    reviewImages: [],
    clearInspection: [],
    subtasks: [],
    rootMainTaskId: null,
    rootTaskTypeId: null,
    secondaryWorkerName: null,
  });
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

  async function getUnitData() {
    try {
      const { data } = await unitDataApi({
        unitByScopeId: Number(route.params.id),
        userRoles: userRoleString.value,
      });

      currentUnit.value = data.result;
    } catch (error) {
      console.error('getUnitsList Error:', error);
    }
  }

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

  async function getWorkHourSubmissions() {
    try {
      const data = await installTrackerService.workHourSubmissionsByWorkerAndProjectScopeApi({
        workerId: workerDetails.value?.id ?? 0,
        projectByScopeId: Number(route.params.id),
      });

      if (data.result != null) {
        workHourSubmissions.value = data.result;

        workHourSubmissions.value.forEach((log: WorkHourSubmissions, key: number) => {
          if (typeof log.hours == 'number') {
            const hrs = Math.floor(log.hours);
            const mins = Math.round((log.hours - hrs) * 60);
            workHourSubmissions.value[key].hours = `${hrs} hrs. ${mins} min.`;
            workHourSubmissions.value[key].hoursArr = [hrs, mins];

            const hrsOv = Math.floor(log.hoursOverride);
            const minsOv = Math.round((log.hoursOverride - hrsOv) * 60);
            workHourSubmissions.value[key].hoursOverrideArr = [hrsOv, minsOv];
          }

          const submissionDate = new Date(log.submissionDate);
          workHourSubmissions.value[key].submissionDate = `${(submissionDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${submissionDate
            .getDate()
            .toString()
            .padStart(2, '0')}-${submissionDate.getFullYear()}`;
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  onMounted(async () => {
    isLoading.value = true;

    const userRoles = authStore.userInfo?.clientPrincipal.allowedRoles || [];
    const allowedRoles = (route.meta?.allowedRoles as string[]) || [];

    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAllowedRole) {
      router.push({ name: 'dashboard' });
      localStorage.setItem('redirectMsg', 'You do not have permission to access this tool.');
      return;
    }

    try {
      await getUnitData();
      await fetchProjectByScopeDetails();
      await getWorkHourSubmissions();

      if (editProjectWorkSubmissionModalRef.value) {
        // Removed unused editProjectWorkSubmissionModalInstance initialization
      }
      if (viewProjectWorkSubmissionModalRef.value) {
        viewProjectWorkSubmissionModalInstance = new Modal(
          viewProjectWorkSubmissionModalRef.value,
          {
            backdrop: 'static',
            keyboard: false,
            focus: true,
          }
        );
      }

      subTasks.value = await installTrackerService.getPendingSubtasks(
        projectByScopeDetails.value.id,
        workerDetails.value?.id ?? 0
      );

      await installTrackerServiceProxy
        .getPendingMainTasks(workerDetails.value?.id ?? 0, projectByScopeDetails.value.id)
        .then((data: InstallTrackerTaskQueueDto[]) => {
          mainTasks.value = data;
        });

      secondaryTasks.value = await installTrackerService.getSecondaryTasks(
        projectByScopeDetails.value.id,
        workerDetails.value?.id ?? 0
      );
      blockedUnits.value = await installTrackerService.getBlockedUnits(
        projectByScopeDetails.value.id,
        workerDetails.value?.id ?? 0
      );
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  });

  const goBack = () => {
    router.push({ name: 'install-tracker-project-scopes' });
  };

  const viewSubmittedUnitTasks = () => {
    router.push({ name: 'install-tracker-main-tasks', params: { id: route.params.id } });
  };

  const goToTaskSubmission = (item: InstallTrackerTaskQueue) => {
    const sessionKey = `taskSubmissionViewer_task_${item.taskId}`;
    sessionStorageService.setItem<ModeTool>(sessionKey, {
      mode: 'submission',
      tool: 'installTracker',
    });

    router.push({
      name: 'task-submission-viewer',
      params: {
        projectId: route.params.id,
        unitId: item.unitByScopeId,
        taskId: item.taskId,
      },
    });
  };

  const openEditWorkSubmissionModal = (log: WorkHourSubmissions) => {
    onEditLog.value = log;

    showProjectWorkSubmissionEditModal.value = true;
  };

  const openViewWorkSubmissionModal = (log: WorkHourSubmissions) => {
    onViewLog.value = log;

    viewProjectWorkSubmissionModalInstance?.show();
  };

  const closeViewProjectWorkSubmissionModal = () => {
    viewProjectWorkSubmissionModalInstance?.hide();
  };

  const deleteProjectWorkSubmission = async (id: number) => {
    const xconf = confirm('Do you want to delete this Submission Log?');
    if (xconf && userId.value != null) {
      isLoading.value = true;

      await installTrackerService.workHourSubmissionDeleteApi({
        workHourSubmissionId: id,
        deletedBy: userId.value,
      });

      await getWorkHourSubmissions();

      showToast.value = true;
      toastMessage.value = 'Submission Log has been deleted';

      setTimeout(() => {
        showToast.value = false;
        toastMessage.value = '';
      }, 5000);

      isLoading.value = false;
    }
  };

  const closeProjectWorkSubmissionEditModal = () => {
    showProjectWorkSubmissionEditModal.value = false;
  };

  const submitProjectWorkSubmissionEditHandler = () => {
    isLoading.value = true;
  };

  const successProjectWorkSubmissionEditHandler = () => {
    window.location.reload();
  };

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };

  const openWorkHoursCreateModal = (item: any) => {
    taskDetails.value = item;
    projectByScopeId.value = Number(route.params.id);
    showProjectWorkSubmissionCreateModal.value = true;
  };

  const closeProjectWorkSubmissionCreateModal = () => {
    showProjectWorkSubmissionCreateModal.value = false;
  };

  const submitProjectWorkSubmissionCreateHandler = () => {
    isLoading.value = true;
  };

  const successProjectWorkSubmissionCreateHandler = async () => {
    await getWorkHourSubmissions();

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

  const disableMainTaskActions = () => {
    if (
      projectByScopeDetails.value.teamLeadUserId === userId.value ||
      userRoleString.value.includes('installmanager')
    )
      return false;

    const distinctCount = new Set(subTasks.value.map((x) => x.unitByScopeId)).size;
    return distinctCount >= 5;
  };

  defineExpose({
    subTasks,
    mainTasks,
    userRoleString,
    userId,
    projectByScopeDetails,
    disableMainTaskActions,
  });
</script>
<template>
  <TopNavWithOverlay :is-loading="isLoading" />

  <div v-if="showToast" class="toast-message">
    {{ toastMessage }}
    <button @click="showToast = false">Close</button>
  </div>

  <div v-if="showToastErr" class="toast-error-message">
    {{ toastErrMessage }}
    <button @click="showToast = false">Close</button>
  </div>

  <div class="body-content ft-project-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Install Tracker / {{ projectByScopeDetails.projectName }} ({{
              projectByScopeDetails.scopeTypeName
            }}) / Unit Task Queue</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="goBack">
            Go Back<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <template v-if="!isLoading">
      <div class="task-queue">
        <h4 class="text-dark fw-bold">
          {{ projectByScopeDetails.projectName }} ({{ projectByScopeDetails.scopeTypeName }})
        </h4>
        <button class="submitted-unit-task" @click="viewSubmittedUnitTasks">
          View Submitted Unit Tasks
        </button>

        <SubTaskQueue
          v-if="subTasks.length > 0"
          :items="subTasks"
          class="mb-4"
          @start-action="goToTaskSubmission"
        />
        <MainTasksQueue
          v-if="mainTasks.length > 0"
          :list-count="2"
          :items="mainTasks"
          :disable-actions="disableMainTaskActions()"
          class="mb-4"
          @start-action="goToTaskSubmission"
        />
        <SecondaryTasksQueue
          v-if="secondaryTasks.length > 0"
          class="mb-4"
          :items="secondaryTasks"
          @start-action="openWorkHoursCreateModal"
        />
        <BlockedUnitsQueue
          v-if="blockedUnits.length > 0 && blockedUnits.some((e: any) => e.blockingIssues.length > 0)"
          :items="blockedUnits"
          class="mb-4"
        />
      </div>
    </template>

    <UnitTaskQueueSubmissionLog
      :work-hour-submissions="workHourSubmissions"
      :project-by-scope-details="projectByScopeDetails"
      :worker-id="workerDetails?.id || 0"
      :project-by-scope-id="Number(route.params.id)"
      @open-edit-modal="openEditWorkSubmissionModal"
      @open-view-modal="openViewWorkSubmissionModal"
      @delete-log="deleteProjectWorkSubmission"
    />

    <ProjectWorkSubmissionCreateModal
      v-if="userId"
      :show-modal="showProjectWorkSubmissionCreateModal"
      :project-by-scope-id="projectByScopeId"
      :user-id="userId"
      :user-roles="userRoleString"
      :task-id="taskDetails.taskId"
      :phase-id="taskDetails.phaseId"
      :task-assist-type-only="true"
      @on-close="closeProjectWorkSubmissionCreateModal"
      @on-submit="submitProjectWorkSubmissionCreateHandler"
      @on-success="successProjectWorkSubmissionCreateHandler"
      @on-failed="failedProjectWorkSubmissionCreateHandler"
    />

    <ProjectWorkSubmissionEditModal
      v-if="userId"
      :show-modal="showProjectWorkSubmissionEditModal"
      :edit-log="onEditLog"
      :worker-details="workerDetails"
      :user-id="userId"
      :user-roles="userRoleString"
      :task-id="0"
      @on-close="closeProjectWorkSubmissionEditModal"
      @on-submit="submitProjectWorkSubmissionEditHandler"
      @on-success="successProjectWorkSubmissionEditHandler"
    />

    <div
      ref="viewProjectWorkSubmissionModalRef"
      class="modal fade"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="pasteModalLabel" class="modal-title">VIEW PROJECT WORK SUBMISSION</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="closeViewProjectWorkSubmissionModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <h5 class="text-dark fw-bold">
                {{ onViewLog.projectName }} ({{ onViewLog.scopeTypeName }})
              </h5>
            </div>
            <div class="form-group">
              <h6 class="text-dark">
                <strong>Work Submission ID: </strong>
                {{ onViewLog.id }}
              </h6>
              <span>
                <strong>Submit Date: </strong>
                {{ onViewLog.submissionDate }},
                <strong>Submitted By: </strong>
                {{ onViewLog.submittedBy }},
                <strong>Type: </strong>
                {{ onViewLog.submitTypeName }},
                <strong>Status: </strong>
                {{ onViewLog.statusName }}
              </span>
            </div>
            <div class="form-group">
              <span>
                <strong>Hrs: </strong>
                {{ onViewLog.hoursArr[0] }},
                <strong>Mns: </strong>
                {{ onViewLog.hoursArr[1] }}
              </span>
            </div>
            <div class="form-group">
              <h6 class="fw-bold text-dark">Image Uploads</h6>
              <div ref="container">
                <a
                  v-for="image in onViewLog.images"
                  :key="image.id || image.fileUrl"
                  data-fancybox="work_hour_submissions"
                  :data-caption="`${image.name} ${
                    image.name != '' && image.description != '' ? '-' : ''
                  } ${image.description}`"
                  :href="image.fileUrl"
                  @click="closeViewProjectWorkSubmissionModal"
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
            <div class="form-group">
              <h6 class="fw-bold text-dark">Submission Notes</h6>
              <p class="text-dark">{{ onViewLog.submissionNotes }}</p>
            </div>
            <hr />
            <h5 class="manager-header-text mt-3 text-dark">Manager Review Notes</h5>
            <div class="form-group">
              <label>Hours Override</label>
              <br />
              <span class="text-dark">
                <strong>Hrs: </strong>
                {{ onViewLog.hoursOverrideArr[0] }},
                <strong>Hrs: </strong>
                {{ onViewLog.hoursOverrideArr[1] }}
              </span>
            </div>
            <div class="form-group">
              <label class="fw-bold">Manager Notes</label>
              <p class="text-dark">{{ onViewLog.managerNotes }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeViewProjectWorkSubmissionModal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .submitted-unit-task {
    color: #19a7af;
    background: transparent;
    font-weight: bold;
    font-size: 18px;
    border: none;
    outline: none;
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
  .breadcrumb-nav {
    font-size: 16px;
    font-weight: 200;
  }
  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
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
