<script setup lang="ts">
  import { Modal } from 'bootstrap';
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute } from 'vue-router';
  import 'vue-select/dist/vue-select.css';
  import { Fancybox } from '@fancyapps/ui';
  import TopNavBar from '@/components/TopNavBar.vue';
  import type { WorkHourSubmissions } from '@/interfaces/workforce';
  import type { WorkerDetails } from '@/interfaces/installTracker';
  import InformationModal from '@/components/modal/InformationModal.vue';
  import ProjectWorkSubmissionCreateModal from '@/components/modal/ProjectWorkSubmissionCreateModal.vue';
  import ProjectWorkSubmissionEditModal from '@/components/modal/ProjectWorkSubmissionEditModal.vue';
  import BlockingIssueCreateModal from '@/components/modal/BlockingIssueCreateModal.vue';
  import { InstallTrackerService } from '@/services/installTracker';
  import {
    ActiveProjectAssignmentDto,
    ActiveProjectAssignmentScopesDto,
    InstallTrackerServiceProxy,
  } from '@/shared/service-proxies/service-proxies';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');

  const showToast = ref(false);
  const toastMessage = ref('');

  const showToastErr = ref(false);
  const toastErrMessage = ref('');

  const workerDetails = ref<WorkerDetails>({
    id: 0,
    userId: 0,
    name: '',
    email: '',
  });
  const installTrackerServiceProxy = new InstallTrackerServiceProxy();
  const scopeAssignments = ref<ActiveProjectAssignmentDto[]>([]);

  const showReportBlockedUnitInfoModalPop = ref<boolean>(false);
  const showSubmitHourInfoModal = ref<boolean>(false);
  const showUnitTaskInfoModal = ref<boolean>(false);
  const showProjectWorkSubmissionCreateModal = ref<boolean>(false);

  const viewProjectWorkSubmissionModalRef = ref<HTMLElement | null>(null);
  let viewProjectWorkSubmissionModalInstance: Modal | null = null;

  const showAllactiveProjectScopes = ref<boolean>(false);

  const projectByScopeId = ref<number>(0);
  const projectName = ref<string>('');
  const scopeTypeName = ref<string>('');
  const teamLeadId = ref<number>(0);
  const keyword = ref<string>('');

  const projectLevelWorkSubmissionTypeId = ref<number>(0);

  const isSubmitWorkHourDisabled = ref<boolean>(true);

  const submissionLogExpanded = ref<boolean>(false);

  const workHourSubmissions = ref<WorkHourSubmissions[]>([]);

  const dateNow = ref<string>('');

  const showProjectWorkSubmissionEditModal = ref<boolean>(false);
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
    hoursOverrideArray: [1, 0],
    submissionDate: '',
    submittedBy: '',
    submissionNotes: '',
    managerNotes: '',
    hoursOverride: 0,
    hoursOverrideArr: [1, 0],
    quantityOverride: 0,
    images: [],
    taskStatusId: 0,
    workerName: '',
    workerId: 0,
    // Add any other missing properties required by TaskSubmissionViewerWorkHourSubmissionDto
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

  const container = ref<HTMLElement | null>(null);
  const installTrackerService = new InstallTrackerService();

  const showBlockingIssueCreateModal = ref<boolean>(false);
  const blockingIssueProjectByScopeId = ref<number>(0);

  watch(
    () => projectLevelWorkSubmissionTypeId.value,
    (newVal) => {
      if (newVal == 0) {
        isSubmitWorkHourDisabled.value = true;
      } else {
        isSubmitWorkHourDisabled.value = false;
      }
    }
  );

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

  async function getScopeAssignments() {
    let workerId = -1;
    if (!showAllactiveProjectScopes.value) {
      workerId = workerDetails.value.id;
    }
    try {
      await installTrackerServiceProxy
        .getActiveProjectAssignments(workerId)
        .then((response: ActiveProjectAssignmentDto[]) => {
          scopeAssignments.value = response;
        });
    } catch (error) {
      console.log(error);
    }
  }

  async function getWorkHourSubmissions() {
    try {
      const data = await installTrackerService.workHourSubmissionsProjectLevelListApi({
        workerId: workerDetails.value.id,
      });

      workHourSubmissions.value = data;

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
    } catch (error) {
      console.log(error);
    }
  }

  function bindFancybox(selector: string, options: any) {
    // We assert `any` here to sidestep the broken type definition
    // This keeps the @ts-expect-error or @ts-ignore out of your main logic
    (Fancybox as any).bind(selector, options);
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

    if (authStore.getWorkerDetails != null) {
      workerDetails.value = authStore.getWorkerDetails as WorkerDetails;
    }
    await getScopeAssignments();
    await getWorkHourSubmissions();

    if (viewProjectWorkSubmissionModalRef.value) {
      viewProjectWorkSubmissionModalInstance = new Modal(viewProjectWorkSubmissionModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    const dateToday = new Date();
    dateNow.value = `${(dateToday.getMonth() + 1).toString().padStart(2, '0')}-${dateToday
      .getDate()
      .toString()
      .padStart(2, '0')}-${dateToday.getFullYear()}`;

    if (container.value) {
      bindFancybox('[data-fancybox="work_hour_submissions"]', {
        infinite: false,
      });
    }

    isLoading.value = false;
  });

  const closeTool = () => {
    router.push({ name: 'install-tracker-ready-tasks-summary' });
  };

  const expandProject = (scopeAssignment: ActiveProjectAssignmentDto) => {
    scopeAssignment.expanded = !scopeAssignment.expanded;
  };

  const expandScope = (scope: ActiveProjectAssignmentScopesDto) => {
    scope.expanded = !scope.expanded;
  };

  const reportBlockedUnitInfoModalPop = () => {
    showReportBlockedUnitInfoModalPop.value = true;
  };

  const reportBlockedUnitInfoCloseHandler = () => {
    showReportBlockedUnitInfoModalPop.value = true;
  };

  const submitHoursInfoModalPop = () => {
    showSubmitHourInfoModal.value = true;
  };

  const submitHoursInfoModalCloseHandler = () => {
    showSubmitHourInfoModal.value = false;
  };

  const unitTaskInfoModalPop = () => {
    showUnitTaskInfoModal.value = true;
  };

  const unitTaskInfoModalCloseHandler = () => {
    showUnitTaskInfoModal.value = false;
  };

  const toggleScopeAssignments = async () => {
    showAllactiveProjectScopes.value = !showAllactiveProjectScopes.value;
    await getScopeAssignments();
  };

  const openCreateWorkSubmissionCreateModal = (
    id: number,
    projName: string,
    scopeName: string,
    tlId: number
  ) => {
    projectByScopeId.value = id;
    projectName.value = projName;
    scopeTypeName.value = scopeName;
    teamLeadId.value = tlId;

    if (tlId != null) {
      showProjectWorkSubmissionCreateModal.value = true;
    } else {
      showToastErr.value = true;
      toastErrMessage.value = "This Project Scope doesn't have an assigned Team Lead yet";

      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);
    }
  };

  const closeProjectWorkSubmissionCreateModal = () => {
    showProjectWorkSubmissionCreateModal.value = false;
  };

  const submitProjectWorkSubmissionCreateHandler = () => {
    isLoading.value = true;
  };

  const successProjectWorkSubmissionCreateHandler = async () => {
    scopeAssignments.value.forEach((scopeAssignment: ActiveProjectAssignmentDto) => {
      scopeAssignment.expanded = false;

      scopeAssignment.scopes.forEach((scope: ActiveProjectAssignmentScopesDto) => {
        scope.expanded = false;
      });
    });

    closeProjectWorkSubmissionCreateModal();
    await getWorkHourSubmissions();

    submissionLogExpanded.value = false;

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

  const toggleSubmissionLog = () => {
    submissionLogExpanded.value = !submissionLogExpanded.value;
  };

  const openViewWorkSubmissionModal = (log: WorkHourSubmissions) => {
    onViewLog.value = log;

    viewProjectWorkSubmissionModalInstance?.show();
  };

  const closeViewProjectWorkSubmissionModal = () => {
    viewProjectWorkSubmissionModalInstance?.hide();
  };

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };

  const goToUnitTaskQueue = (projectByScopeId: number) => {
    router.push({ name: 'install-tracker-unit-task-queue', params: { id: projectByScopeId } });
  };

  const openEditWorkSubmissionModal = (log: WorkHourSubmissions) => {
    onEditLog.value = log;

    showProjectWorkSubmissionEditModal.value = true;
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

  const reportBlockingIssue = (unitId: number) => {
    showBlockingIssueCreateModal.value = true;
    blockingIssueProjectByScopeId.value = unitId;
  };

  const closeBlockingIssueCreateModalHandler = () => {
    showBlockingIssueCreateModal.value = false;
  };

  const submitBlockingIssueCreateModalHandler = () => {
    isLoading.value = true;
  };

  const createBlockingIssueSuccessHandler = async () => {
    isLoading.value = false;

    showToast.value = true;
    toastMessage.value = 'Successfully Created';

    showBlockingIssueCreateModal.value = false;

    setTimeout(() => {
      showToast.value = false;
      toastMessage.value = '';
    }, 5000);
  };

  const createBlockingIssueFailHandler = (errMessage: string) => {
    showToastErr.value = true;
    toastErrMessage.value = errMessage;

    showBlockingIssueCreateModal.value = false;

    setTimeout(() => {
      showToastErr.value = false;
      toastErrMessage.value = '';
    }, 5000);
  };

  const redirectToTaskSummary = () => {
    router.push({
      name: 'install-tracker-ready-tasks-summary',
    });
  };

  const filteredScopeAssignments = computed(() => {
    if (!keyword.value) {
      return scopeAssignments.value;
    }

    const search = keyword.value.toLowerCase();

    return scopeAssignments.value.filter((scopeAssignment) => {
      const projectMatch = scopeAssignment.projectName.toLowerCase().includes(search);
      const scopeMatch = scopeAssignment.scopes.some((e) =>
        e.scopeTypeName.toLowerCase().includes(search)
      );

      return projectMatch || scopeMatch;
    });
  });
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

  <div v-if="showToast" class="toast-message">
    {{ toastMessage }}
    <button @click="showToast = false">Close</button>
  </div>

  <div v-if="showToastErr" class="toast-error-message">
    {{ toastErrMessage }}
    <button @click="showToast = false">Close</button>
  </div>

  <div class="body-content install-tracker-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Install Tracker / Active Project Scopes</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeTool">
            Go Back<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <button class="redirect-btn" @click="redirectToTaskSummary">
      <i class="bi bi-eye"></i>
      View Task Summary
    </button>

    <div class="form-group scope-search">
      <div class="d-flex">
        <input v-model="keyword" placeholder="Filter by project name or scope type" />
      </div>
    </div>

    <div class="scope-assignments">
      <div class="col-md-3">
        <h6>Active Project Scopes</h6>
        <div class="d-flex">
          <div class="custom-checkbox">
            <input
              id="show_assigned_task"
              type="checkbox"
              class="checkbox-input"
              :checked="showAllactiveProjectScopes"
              @click="toggleScopeAssignments"
            />
            <label for="show_assigned_task" class="checkbox-label"></label>
          </div>
          <label for="show_assigned_task" class="show-assigned-scope"
            >Show All Active Project Scopes</label
          >
        </div>
        <template v-for="scopeAssignment in filteredScopeAssignments">
          <div
            v-if="
              (!showAllactiveProjectScopes && scopeAssignment.hasReadyUnits) ||
              showAllactiveProjectScopes
            "
            :key="scopeAssignment.fieldTrackerProjectId"
            class="project"
          >
            <button class="expand" @click="expandProject(scopeAssignment)">
              <i
                :class="[
                  'bi',
                  scopeAssignment.expanded ? 'bi-caret-up-fill' : 'bi-caret-down-fill',
                ]"
              ></i>
              {{ scopeAssignment.projectName }}
            </button>
            <div v-if="scopeAssignment.expanded" class="scopes">
              <div
                v-for="scope in scopeAssignment.scopes"
                :key="scope.projectByScopeId"
                style="margin-left: 2rem"
              >
                <button class="expand" @click="expandScope(scope)">
                  <i
                    :class="['bi', scope.expanded ? 'bi-caret-up-fill' : 'bi-caret-down-fill']"
                  ></i>
                  {{ scope.scopeTypeName }}
                </button>
                <div v-if="scope.expanded" class="actions">
                  <div class="d-flex">
                    <button @click="reportBlockingIssue(scope.projectByScopeId)">
                      Report a Blocked Unit
                    </button>
                    <button @click="reportBlockedUnitInfoModalPop">
                      <i class="bi bi-info-circle-fill"></i>
                    </button>
                  </div>
                  <div class="d-flex">
                    <button
                      @click="
                        openCreateWorkSubmissionCreateModal(
                          scope.projectByScopeId,
                          scopeAssignment.projectName,
                          scope.scopeTypeName,
                          scope.teamLeadId
                        )
                      "
                    >
                      Submit Hours for this Scope
                    </button>
                    <button @click="submitHoursInfoModalPop">
                      <i class="bi bi-info-circle-fill"></i>
                    </button>
                  </div>
                  <div v-if="scope.hasTaskAssignment" class="d-flex">
                    <button @click="goToUnitTaskQueue(scope.projectByScopeId)">
                      Go to Unit Task Queue
                    </button>
                    <button @click="unitTaskInfoModalPop">
                      <i class="bi bi-info-circle-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <hr />
          </div>
        </template>
      </div>
    </div>

    <div class="submission-log">
      <button class="extract" @click="toggleSubmissionLog">
        <i :class="['bi', submissionLogExpanded ? 'bi-caret-up-fill' : 'bi-caret-down-fill']"></i>
        Your Project Level Submission Log
      </button>
      <div v-if="submissionLogExpanded" class="logs">
        <div v-for="log in workHourSubmissions" :key="log.id" class="d-flex">
          <h6>
            <strong> {{ log.projectName }} ({{ log.scopeTypeName }}) </strong>
            -
            {{ log.submissionDate }} <span v-if="log.submissionDate == dateNow">(today)</span>
            -
            <strong>
              {{ log.submitTypeName }}
            </strong>
            -
            {{ log.hours }}
          </h6>
          <button v-if="log.submissionDate == dateNow" @click="openEditWorkSubmissionModal(log)">
            Edit
          </button>
          <button @click="openViewWorkSubmissionModal(log)">View</button>
          <button v-if="log.submissionDate == dateNow" @click="deleteProjectWorkSubmission(log.id)">
            Delete
          </button>
        </div>
      </div>
    </div>

    <InformationModal
      :show-modal="showReportBlockedUnitInfoModalPop"
      modal-context="If you encounter a problem that prevents you from staging a specific unit, please use this link to report it"
      @close-modal="reportBlockedUnitInfoCloseHandler"
    />

    <InformationModal
      :show-modal="showSubmitHourInfoModal"
      modal-context="For staging, offloading, forklift operation, and non-productive hours like training and meetings."
      @close-modal="submitHoursInfoModalCloseHandler"
    />

    <InformationModal
      :show-modal="showUnitTaskInfoModal"
      modal-context="Open this project by scope to see your task queue or to see a log of previously submitted unit tasks for this scope."
      @close-modal="unitTaskInfoModalCloseHandler"
    />

    <ProjectWorkSubmissionCreateModal
      v-if="userId"
      :show-modal="showProjectWorkSubmissionCreateModal"
      :project-by-scope-id="projectByScopeId"
      :user-id="userId"
      :user-roles="userRoleString"
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
            <h5 class="manager-header-text mt-3">Manager Review Notes</h5>
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
    <BlockingIssueCreateModal
      v-if="userId"
      :show-modal="showBlockingIssueCreateModal"
      :blocking-issue-unit-id="0"
      :project-by-scope-id="blockingIssueProjectByScopeId"
      :user-id="userId"
      :user-roles="userRoleString"
      @on-close="closeBlockingIssueCreateModalHandler"
      @on-submit="submitBlockingIssueCreateModalHandler"
      @on-success="createBlockingIssueSuccessHandler"
      @on-failed="createBlockingIssueFailHandler"
    />
    />
  </div>
</template>

<style scoped>
  .redirect-btn {
    color: #fff;
    background: #19a7af;
    margin: 2rem 0 0.5rem 2rem;
    padding: 0.7rem 1rem;
    border: none;
    border-radius: 5px;
    outline: none;
  }
  .manager-header-text {
    color: #19a7af;
  }
  .submission-log {
    margin: 3rem;
  }
  .submission-log .extract {
    font-size: 18px;
    font-weight: bold;
    background: transparent;
    border: none;
    outline: none;
  }
  .submission-log .logs {
    padding: 0.5rem 0;
    color: #000;
  }
  .submission-log .logs button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }
  .show-assigned-scope {
    color: #54a6ff;
    cursor: pointer;
  }
  .custom-checkbox {
    display: inline;
    margin-right: 1rem;
  }
  .checkbox-input {
    display: none;
  }
  .checkbox-label {
    width: 20px;
    height: 20px;
    border: 2px solid #c0d9db;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s, border-color 0.3s;
  }
  .checkbox-input:checked + .checkbox-label {
    background-color: #007bff;
    border: 1px solid #007bff;
  }
  .checkbox-input:checked + .checkbox-label::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .scope-assignments {
    margin: 3rem;
    margin-top: 1rem;
  }
  .scope-assignments h6 {
    color: #000;
  }
  .scope-assignments .project {
    margin: 0.5rem 0;
    padding: 0.7rem 0;
  }
  .scope-assignments .project .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 0.7rem;
  }
  .scope-assignments .scopes .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 16px;
    font-weight: 500;
    display: block;
    margin-left: 1rem;
  }
  .scope-assignments .scopes .actions div {
    border-bottom: 1px solid #19a7af;
    padding: 0.3rem;
    margin-left: 2.5rem;
  }
  .scope-assignments .scopes .actions div:last-child {
    border-bottom: none;
  }
  .scope-assignments .scopes .actions button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }

  .install-tracker-viewer {
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
    min-width: 350px;
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

  .bi-plus-circle,
  .bi-table,
  .bi-trash3,
  .bi-clipboard {
    margin-right: 5px;
    color: #7a7a7a;
  }

  input::placeholder {
    color: #d9d9d9;
  }

  hr {
    margin: 0 15px;
    color: #7a7a7a;
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

  .toast-error-message {
    background-color: #dc3545 !important;
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

  .toast-message button,
  .toast-error-message button {
    border: none;
    background: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
  }

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  .form-group {
    margin-bottom: 0.8rem;
  }

  .modal-title {
    color: #19a7af;
  }

  .modal label {
    color: #3c3c3c;
    padding-bottom: 8px;
  }

  .scope-search {
    margin: 1rem 0 0 2rem;
  }
  .scope-search label {
    margin-bottom: 0.5rem;
  }
  .scope-search input {
    border: 1px solid #bcbcbc;
    border-radius: 4px;
    padding: 0.3rem 1.5rem 0.3rem 1rem;
    outline: none;
    width: 300px;
  }
</style>
