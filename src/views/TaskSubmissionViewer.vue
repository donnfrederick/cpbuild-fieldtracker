<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
  import 'vue-select/dist/vue-select.css';
  import '@fancyapps/ui/dist/fancybox/fancybox.css';
  import { Fancybox } from '@fancyapps/ui';

  import TopNavBar from '@/components/TopNavBar.vue';
  import FileUpload from '@/components/FileUpload.vue';
  import FailedClearInspectionModal from '@/components/modal/FailedClearInspectionModal.vue';
  import ProjectWorkSubmissionCreateModal from '@/components/modal/ProjectWorkSubmissionCreateModal.vue';
  import ProjectWorkSubmissionEditModal from '@/components/modal/ProjectWorkSubmissionEditModal.vue';
  import BlockingIssueCreateModal from '@/components/modal/BlockingIssueCreateModal.vue';
  import {
    clearInspectionChecklistUpdateApi,
    eligibleWorkersListApi,
    roleAssignmentsApi,
  } from '@/services/taskSubmission';
  import {
    activeWorkersByScopeApi,
    parentChildPunchTaskCreateApi,
    unitLevelSubtaskTypesApi,
  } from '@/services/laborManager';
  import { InstallTrackerService } from '@/services/installTracker';
  import { azureBlobDeleteApi } from '@/services/azureBlob';
  import type { WorkerDetails } from '@/interfaces/installTracker';
  import UnitDetails from '@/components/TaskSubmission/UnitDetails.vue';
  import TaskDetails from '@/components/TaskSubmission/TaskDetails.vue';
  import SubmissionDetails from '@/components/TaskSubmission/SubmissionDetails.vue';
  import HoursSubmission from '@/components/TaskSubmission/HoursSubmission.vue';
  import {
    TaskTypeEnum,
    UnitByScopeStatusEnum,
    ImageSubmissionTypeEnum,
    TaskStatusEnum,
  } from '@/enum';
  import type { ActiveWorkers, RoleAssignments, TaskTypes, UnitData } from '@/interfaces/project';
  import {
    CurrentUnitDto,
    TaskDetailDto,
    TasksubmissionUpdateUnitByScopeDto,
    TaskSubmissionUpdateUnitTaskDto,
    TaskSubmissionViewerDto,
    TaskSubmissionViewerServiceProxy,
    TaskSubmissionViewerWorkHourSubmissionDto,
    ClearInspectionServiceProxy,
    UpdateDeficiencyDto,
    PunchWorkTaskCreateDto,
  } from '@/shared/service-proxies/service-proxies';
  import type { ModeTool } from '@/interfaces/common/modeTool';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import { storeToRefs } from 'pinia';
  import MaskingIndicator from '@/components/MaskingIndicator.vue';
  import { getPreviousRoute } from '@/router';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { localStorageHelper } from '@/util/localStorageHelper';
  import { IdbWorkHourSubmissionLogService } from '@/shared/offlineDb/services/idbWorkHourSubmissionLogService';
  import ClearInspectionPunchWorkSubmissionDetails from '@/components/TaskSubmission/ClearInspectionPunchWorkSubmissionDetails.vue';
  import { IdbPunchWorkTaskCreateTSVService } from '@/shared/offlineDb/services/idbPunchWorkTaskCreateTSVService';
  import { featureFlags } from '@/config/featureFlags';
  import { IdbUpdateUnitTaskTSVService } from '@/shared/offlineDb/services/idbUpdateUnitTaskTSVService';
  import { IUpdateUnitTaskTSV } from '@/shared/offlineDb/interfaces/IUpdateUnitTaskTSV';
  import { useNotificationStore } from '@/stores/useNotificationStore';
  import type { Notification } from '@/stores/useNotificationStore';
  import { NotificationType } from '@/enum/notification/notificationType';
  import { ClearInspectionDeficiencyLevelTypesEnum } from '@/enum/clearInspectionDeficiencyLevelTypesEnum';
  import { IdbUpdateDeficiencyTSVService } from '@/shared/offlineDb/services/idbUpdateDeficiencyTSVService';
  import { IUpdateDeficiencyTSV } from '@/shared/offlineDb/interfaces/IUpdateDeficiencyTSV';
  import { tsvOfflineEditLock } from '@/services/tsvOfflineEditLockManager';

  const installTrackerService = new InstallTrackerService();

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const maskingStore = useMaskingStore();
  const { isMasking } = storeToRefs(maskingStore);
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);
  const { updateStatus } = networkStore;
  const notificationStore = useNotificationStore();

  const isLoading = ref(false);
  const isDisabled = ref(true);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');
  const currentUnit = ref<CurrentUnitDto>(new CurrentUnitDto());
  const taskDetails = ref<TaskDetailDto>(new TaskDetailDto());
  const workHourSubmissions = ref<TaskSubmissionViewerWorkHourSubmissionDto[]>([]);
  const unitLevelProjectSubmittedUnit = ref<number>(0);
  const workerDetails = ref<WorkerDetails>({
    id: 0,
    userId: 0,
    name: '',
    email: '',
  });

  const tools = [
    {
      key: 'laborManager',
      text: 'Labor Manager',
    },
    {
      key: 'installTracker',
      text: 'Install Tracker',
    },
    {
      key: 'inspectionTracker',
      text: 'Inspection Tracker',
    },
  ];

  const toolName = ref<string>('');
  const statusId = ref(0);
  const selectedUser = ref(0);
  const reviewNotes = ref('');
  const activeWorkers = ref<ActiveWorkers[]>([]);
  const updateTaskDetails = ref('');
  const updateAssignedWorker = ref<number>(0);

  const fileCount = ref(0);
  const submissionId = ref<any>(0);
  const offlinePunchWorkTaskTempId = ref<number | null>(null);
  const updateFileCount = ref(0);
  const updateSubmissionId = ref<any>(0);
  const showToast = ref(false);
  const toastMessage = ref('');
  const showToastErr = ref(false);
  const toastErrMessage = ref('');
  const taskTypes = ref<TaskTypes[]>([]);
  const currentRoleAssignment = ref<RoleAssignments>();
  const availableUsers: any = ref([]);
  const editSubmissionId = ref<any>(0);
  const editSubmissionNotes = ref<string>('');
  const tlReviewContainer = ref<HTMLElement | null>(null);
  const editContainer = ref<HTMLElement | null>(null);
  const editSubmissionContainer = ref<HTMLElement | null>(null);
  const submissionContainer = ref<HTMLElement | null>(null);
  // For submission mode
  const showProjectWorkSubmissionCreateModal = ref<boolean>(false);
  const projectByScopeId = ref<any>(0);
  const blockingIssueUnitId = ref<number>(0);
  const showBlockingIssueCreateModal = ref<boolean>(false);
  const submissionCheckedRequirements = ref<number[]>([]);
  const submissionImageUploadedCount = ref<number>(0);
  const submissionSubmissionId = ref<number>(0);
  const submissionImageAcknowledgement = ref<boolean>(false);
  const submissionSubmissionNotes = ref<string>('');
  // For Task Work Submissions Log
  const taskWorkSubmissionExpanded = ref<boolean>(false);
  const dateNow = ref<string>('');
  const showProjectWorkSubmissionEditModal = ref<boolean>(false);
  const onEditLog = ref<TaskSubmissionViewerWorkHourSubmissionDto>(
    new TaskSubmissionViewerWorkHourSubmissionDto()
  );

  // For Inspection Mode
  const inspectionSubmissionId = ref<number>(0);

  const showFailedClearInspectionModal = ref<boolean>(false);

  const previousAssignedWorkerId = ref<number>(0);

  const rootMainTaskId = ref<number | null>(null);

  const taskSubmissionDetails = ref<TaskSubmissionViewerDto>(new TaskSubmissionViewerDto());
  const previousTaskDetail = ref<TaskDetailDto>(new TaskDetailDto());
  const taskSubmissionViewerServiceProxy = new TaskSubmissionViewerServiceProxy();
  const clearInspectionServiceProxy = new ClearInspectionServiceProxy();
  const clearInspectionDeficiencyLevelTypes = Object.entries(
    ClearInspectionDeficiencyLevelTypesEnum
  )
    .filter(([, value]) => typeof value === 'number') // keep only forward mapping
    .map(([name, id]) => ({ id, name }));

  const sessionStorageService = new SessionStorageService();
  const config = ref<ModeTool | null>(null);
  const offlineEditRecord = ref<IUpdateUnitTaskTSV | undefined>(undefined);

  onBeforeRouteLeave((to, from, next) => {
    if (isMasking.value && !maskingStore.allowedRoutes.includes(to.name as string)) {
      const answer = window.confirm('Are you sure you want to exit masking mode?');
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });

  window.addEventListener('beforeunload', function (event) {
    if (isMasking.value) {
      event.preventDefault();
      event.returnValue = ' '; // This triggers the native browser prompt
    }
  });

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal !== null ? newVal : 0;
    },
    { immediate: true }
  );

  watch(
    () => selectedUser.value,
    (newVal) => {
      if (statusId.value == 6) {
        if (newVal == 0 || fileCount.value == 0 || reviewNotes.value == '') {
          isDisabled.value = true;
        } else {
          isDisabled.value = false;
        }
      }
    }
  );

  watch(
    () => fileCount.value,
    (newVal) => {
      if (statusId.value == 6) {
        if (selectedUser.value == 0 || newVal == 0 || reviewNotes.value == '') {
          isDisabled.value = true;
        } else {
          isDisabled.value = false;
        }
      }
    }
  );

  watch(
    () => reviewNotes.value,
    (newVal) => {
      if (statusId.value == 5) {
        if (newVal == '') {
          isDisabled.value = true;
        } else {
          isDisabled.value = false;
        }
      } else {
        if (selectedUser.value == 0 || fileCount.value == 0 || newVal == '') {
          isDisabled.value = true;
        } else {
          isDisabled.value = false;
        }
      }
    }
  );

  watch(
    () => editSubmissionNotes.value,
    (newVal) => {
      if (newVal == submissionSubmissionNotes.value) {
        isDisabled.value = true;
      } else {
        isDisabled.value = false;
      }
    }
  );

  watch(
    () => offlineEditRecord.value,
    (newVal) => {
      if (newVal != undefined && !isOffline.value) {
        notificationStore.showNotification({
          type: NotificationType.Error,
          message: `Task ${Number(
            route.params.taskId
          )} will be synced in the background. Please wait...`,
        } as Notification);

        router.push({
          name: 'labor-manager-task-summary',
        });
      }
    }
  );

  watch(
    () => isOffline.value,
    (isOffline) => {
      if (!isOffline) {
        updateStatus(tsvOfflineEditLock.isTaskLocked(Number(route.params.taskId)));
      }
    }
  );

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
    if (isOffline.value && userId.value == 0)
      userId.value = localStorageHelper<number | null>('userId').get();
  });

  async function getWorkerDetails() {
    if (userId.value != null) {
      try {
        const data = await installTrackerService.isIhiWorkerApi({
          userId: userId.value,
        });

        workerDetails.value = data;
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function getWorkHourSubmissions() {
    workHourSubmissions.value = [];
    try {
      await taskSubmissionViewerServiceProxy
        .getWorkHourSubmissions(Number(route.params.taskId))
        .then((result: TaskSubmissionViewerWorkHourSubmissionDto[]) => {
          if (result.length > 0) {
            workHourSubmissions.value = result;
            unitLevelProjectSubmittedUnit.value = 0;
            workHourSubmissions.value.forEach((workHourSubmission) => {
              //reason for parsing this here so that the data will be displayed on the current users machine timezone
              const submissionDate = new Date(workHourSubmission.submissionDate);
              workHourSubmission.submissionDate = `${(submissionDate.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${submissionDate
                .getDate()
                .toString()
                .padStart(2, '0')}-${submissionDate.getFullYear()}`;

              const date = new Date(workHourSubmission.createdAt);
              workHourSubmission.createdAt = `${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date
                .getDate()
                .toString()
                .padStart(2, '0')}-${date.getFullYear()}`;

              if (workHourSubmission.submitTypeName == 'Planned Quantity')
                unitLevelProjectSubmittedUnit.value += workHourSubmission.quantity;
            });

            if (config?.value?.mode == 'submission') {
              workHourSubmissions.value = workHourSubmissions.value.filter(
                (submission) => submission.workerId == workerDetails.value.id
              );
            }
          } else {
            console.log('No unit level project submissions found.');
          }
        })
        .finally(async () => {
          await getOfflineSavedWorkHourSubmission();
        });
    } catch (error) {
      console.error('getWorkHourSubmissions Error:', error);
    }
  }

  async function getActiveWorkersByScope() {
    try {
      const { data } = await activeWorkersByScopeApi({
        scopeTypeId: currentUnit?.value.projectScopeTypeId,
        userRoles: userRoleString.value,
      });

      activeWorkers.value = data;
    } catch (error) {
      console.error('getActiveWorkersByScope Error:', error);
    }
  }

  async function getTaskTypes() {
    try {
      const { data } = await unitLevelSubtaskTypesApi({
        userRoles: userRoleString.value,
      });

      taskTypes.value = data;
    } catch (error) {
      console.error('getTaskTypes Error:', error);
    }
  }

  async function getRoleAssignments() {
    if (currentUnit.value != null) {
      try {
        const { data } = await roleAssignmentsApi({
          scopeTypeId: currentUnit?.value.projectScopeTypeId,
          userRoles: userRoleString.value,
        });

        currentRoleAssignment.value = data.result.roleAssignments.find(
          (assignment: RoleAssignments) => currentUnit.value.currentPhaseId == assignment.phaseId
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function getEligibleWorkers() {
    const roleIds = currentRoleAssignment.value
      ? currentRoleAssignment.value.eligibleRoleIds.join(',')
      : '';

    try {
      if (currentRoleAssignment.value) {
        const { data } = await eligibleWorkersListApi({
          scopeTypeId: currentUnit?.value.projectScopeTypeId,
          roleIds,
          userRoles: userRoleString.value,
        });

        availableUsers.value = data;
      } else {
        const { data } = await activeWorkersByScopeApi({
          scopeTypeId: currentUnit?.value.projectScopeTypeId,
          userRoles: userRoleString.value,
        });

        availableUsers.value = data;
      }
    } catch (error) {
      console.error(error);
    }
  }

  function bindFancybox(selector: string, options: any) {
    // We assert `any` here to sidestep the broken type definition
    // This keeps the @ts-expect-error or @ts-ignore out of your main logic
    (Fancybox as any).bind(selector, options);
  }

  async function init() {
    await taskSubmissionViewerServiceProxy
      .getTaskSubmissionViewerDetails(Number(route.params.taskId))
      .then(async (result) => {
        taskSubmissionDetails.value = result;
        previousTaskDetail.value = result.previousTaskDetails;
        taskDetails.value = result.taskDetail;
        currentUnit.value = result.currentUnit;
        availableUsers.value = result.activeWorkers;
        activeWorkers.value = result.activeWorkers as ActiveWorkers[];
        selectedUser.value = taskDetails.value.assignedWorkerId ?? 0;
        if (config?.value?.mode == 'inspection') {
          let inspectionDeficiencies: IUpdateDeficiencyTSV[] = [];
          if (isOffline.value) {
            const ids = taskDetails.value.clearInspection.map((item) => item.id);
            inspectionDeficiencies =
              await IdbUpdateDeficiencyTSVService.getAllUnsyncedRecordsByDeficiencyIds(ids);
          }
          for (const item of taskDetails.value.clearInspection) {
            const deficiency = inspectionDeficiencies.find((def) => def.deficiencyId === item.id);
            if (deficiency) {
              item.selectStatus = deficiency.request.passed ? 'passed' : 'failed';
              item.deficiencyCount = deficiency.request.deficiencyCount?.toString();
              item.deficiencyLevelTypeId = deficiency.request.deficiencyLevelTypeId?.toString();

              continue;
            }

            item.selectStatus = 'pending';
            item.deficiencyLevelTypeId = '0';
          }
        }

        if (isOffline.value && offlineEditRecord.value) {
          selectedUser.value = Number(
            offlineEditRecord.value.updateUnitTaskRequest.assignedWorkerId
          );
          statusId.value = offlineEditRecord.value.updateUnitTaskRequest.statusId;
          reviewNotes.value = offlineEditRecord.value.updateUnitTaskRequest.reviewNotes ?? '';

          switch (config.value?.mode) {
            case 'inspection':
              inspectionSubmissionId.value = offlineEditRecord.value.taskId;
              break;

            case 'review':
              submissionId.value = offlineEditRecord.value.taskId;
              break;

            case 'edit':
              updateSubmissionId.value = offlineEditRecord.value.taskId;
              break;

            case 'edit-submission':
              editSubmissionId.value = offlineEditRecord.value.taskId;
              break;

            case 'submission':
              submissionSubmissionId.value = offlineEditRecord.value.taskId;
              break;
          }
        }
      });
  }

  async function getOfflineSavedWorkHourSubmission(): Promise<void> {
    await IdbWorkHourSubmissionLogService.getOfflineSavedWorkHourSubmissionByTaskId(
      taskSubmissionDetails.value.taskId
    ).then((records) => {
      workHourSubmissions.value.push(...records);
    });
  }

  onMounted(async () => {
    if (isOffline.value) tsvOfflineEditLock.startEditing(Number(route.params.taskId));
    updateStatus(tsvOfflineEditLock.isTaskLocked(Number(route.params.taskId)));

    const cachedWorkerDetails = localStorageHelper<WorkerDetails | null>('workerDetails').get();
    const sessionKey = ref<string>(`taskSubmissionViewer_task_${Number(route.params.taskId)}`);
    config.value = sessionStorageService.getItem(sessionKey.value);
    toolName.value = tools.find((tool) => tool.key == config.value?.tool)?.text ?? '';

    isLoading.value = true;

    if (featureFlags.laborManagerTaskSubmissionPassFail) {
      await IdbUpdateUnitTaskTSVService.getByTaskId(Number(route.params.taskId)).then(
        async (record) => {
          offlineEditRecord.value = record;

          await IdbPunchWorkTaskCreateTSVService.getByParentTaskId(
            Number(route.params.taskId)
          ).then((punchTask) => {
            if (punchTask != null) offlinePunchWorkTaskTempId.value = Number(punchTask.tempId);
          });
        }
      );
    }

    await init();

    if (config?.value?.mode == 'submission') {
      if (cachedWorkerDetails != null) workerDetails.value = cachedWorkerDetails;
      else await getWorkerDetails();
    }

    await getWorkHourSubmissions();
    await getActiveWorkersByScope();
    await getTaskTypes();

    if (config?.value?.mode == 'edit') {
      await getRoleAssignments();
      await getEligibleWorkers();
    }

    updateTaskDetails.value = taskDetails.value.taskDetails;
    updateAssignedWorker.value =
      taskDetails.value.assignedWorkerId == null ? 0 : taskDetails.value.assignedWorkerId;
    updateFileCount.value = taskDetails.value.images != null ? taskDetails.value.images.length : 0;

    editSubmissionNotes.value = taskDetails.value.submissionNotes ?? '';

    submissionImageAcknowledgement.value = taskDetails.value.imageAcknowledgmentChecked;
    submissionSubmissionNotes.value = taskDetails.value.submissionNotes ?? '';

    const dateToday = new Date();
    dateNow.value = `${(dateToday.getMonth() + 1).toString().padStart(2, '0')}-${dateToday
      .getDate()
      .toString()
      .padStart(2, '0')}-${dateToday.getFullYear()}`;

    if (taskDetails.value.proofImages != null) {
      submissionImageUploadedCount.value =
        submissionImageUploadedCount.value + taskDetails?.value.proofImages?.length;
    }

    if (tlReviewContainer.value) {
      bindFancybox('[data-fancybox="tl-review"]', {
        infinite: false,
      });
    }

    if (editContainer.value) {
      bindFancybox('[data-fancybox="edit"]', {
        infinite: false,
      });
    }

    if (editSubmissionContainer.value) {
      bindFancybox('[data-fancybox="edit-submission"]', {
        infinite: false,
      });
    }

    if (submissionContainer.value) {
      bindFancybox('[data-fancybox="submission"]', {
        infinite: false,
      });
    }

    isLoading.value = false;
  });

  const closeViewer = () => {
    backToUnit();
  };

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };

  const uploadSuccess = () => {
    backToUnit();
  };

  const updateSuccess = () => {
    backToUnit();
  };

  const updateSubmissionSuccess = () => {
    backToUnit();
  };

  const fileChanged = (count: number) => {
    fileCount.value = count;
  };

  const updateFileChanged = (count: number) => {
    updateFileCount.value = count + (taskSubmissionDetails.value?.taskDetail.images?.length | 0);
  };

  const updateSubmissionFileChanged = (count: number) => {
    updateFileCount.value += count;
  };

  const isTaskValidToUpdateUnit = () => {
    const taskTypeId = taskDetails.value.taskTypeId;
    const rootTaskTypeId = taskDetails.value.rootTaskTypeId;
    const parentTaskTypeId = taskDetails.value.parentTaskTypeId ?? 0;

    const isMainTask = taskTypeId === TaskTypeEnum.Main;
    const isPunchWorkWithMainParent =
      taskTypeId === TaskTypeEnum.PunchWork &&
      (rootTaskTypeId === TaskTypeEnum.Main || parentTaskTypeId === TaskTypeEnum.Main);
    return (
      (isMainTask || isPunchWorkWithMainParent) &&
      currentUnit.value.unitStatusId != UnitByScopeStatusEnum.Complete
    );
  };

  const upload = async () => {
    isLoading.value = true;
    submissionId.value = 0; // resetting to 0, to trigger the file upload component
    if (statusId.value == TaskStatusEnum.Passed) {
      if (userId.value != null) {
        try {
          await taskSubmissionViewerServiceProxy.updateUnitTask({
            scheduledDate: taskDetails.value.scheduledDate,
            unitTaskId: Number(route.params.taskId),
            statusId: statusId.value,
            reviewNotes: reviewNotes.value == '' ? null : reviewNotes.value,
            userId: userId.value,
            isReviewed: true,
            assignedWorkerId: selectedUser.value,
          } as TaskSubmissionUpdateUnitTaskDto);

          if (isTaskValidToUpdateUnit()) {
            const unit = currentUnit.value;
            let unitByScopeStatus = unit.unitStatusId;
            let newPhaseId: number = unit.currentPhaseId + 1;

            const nextMainTask = taskSubmissionDetails.value.nextMainTask;
            const hasValidDate =
              nextMainTask?.scheduledDate &&
              !isNaN(new Date(nextMainTask?.scheduledDate).getTime());

            if (
              nextMainTask &&
              nextMainTask.phaseName === 'Clear Inspection' &&
              nextMainTask.statusName === 'Ready'
            )
              unitByScopeStatus = UnitByScopeStatusEnum.Ready;
            else {
              if (hasValidDate && nextMainTask && nextMainTask.assignedWorkerId != null) {
                unitByScopeStatus = UnitByScopeStatusEnum.Ready;
              } else {
                unitByScopeStatus = UnitByScopeStatusEnum.NotReady;
              }
            }

            await taskSubmissionViewerServiceProxy.updateUnitByScope({
              completionDate: unit.completionDate,
              unitId: Number(route.params.unitId),
              newPhaseId,
              statusId: unitByScopeStatus,
              userId: userId.value,
              taskId: Number(route.params.taskId),
            } as TasksubmissionUpdateUnitByScopeDto);
          }

          if (fileCount.value > 0) {
            submissionId.value = route.params.taskId;
          } else {
            backToUnit();
          }
        } catch (error) {
          console.error('upload Error:', error);
        }
      }
    } else {
      if (userId.value != null) {
        try {
          await taskSubmissionViewerServiceProxy.updateUnitTask({
            scheduledDate: taskDetails.value.scheduledDate,
            unitTaskId: Number(route.params.taskId),
            statusId: statusId.value,
            userId: userId.value,
            reviewNotes: reviewNotes.value == '' ? null : reviewNotes.value,
            assignedWorkerId: selectedUser.value,
          } as TaskSubmissionUpdateUnitTaskDto);

          if (isTaskValidToUpdateUnit()) {
            await taskSubmissionViewerServiceProxy.updateUnitByScope({
              completionDate: currentUnit.value?.completionDate,
              unitId: Number(route.params.unitId),
              newPhaseId: currentUnit.value?.currentPhaseId,
              statusId: UnitByScopeStatusEnum.Rework,
              userId: userId.value,
              taskId: Number(route.params.taskId),
            } as TasksubmissionUpdateUnitByScopeDto);
          }

          const punchWorkRequest = {
            parentTaskId: Number(route.params.taskId),
            unitByScopeId: taskSubmissionDetails.value.unitByScopeId,
            assignedWorkerId: selectedUser.value,
            taskDetails: reviewNotes.value,
            createChecklist: false,
            statusId: 2,
            createdBy: userId.value,
            userRoles: userRoleString.value,
            rootMainTaskId: rootMainTaskId.value,
          };

          if (allowForOffline.value) {
            offlinePunchWorkTaskTempId.value = await IdbPunchWorkTaskCreateTSVService.save(
              punchWorkRequest as unknown as PunchWorkTaskCreateDto
            );

            submissionId.value = offlinePunchWorkTaskTempId.value;
          } else {
            const { data } = await parentChildPunchTaskCreateApi(punchWorkRequest);
            submissionId.value = data.submissionId;
          }
        } catch (error) {
          console.error('Upload Error:', error);
        }
      }
    }
  };

  const removeImage = async (image: any) => {
    const xconfirm = confirm('Are you sure you want to delete this image?');

    if (xconfirm && userId.value != null) {
      isLoading.value = true;

      try {
        await azureBlobDeleteApi({
          uploadId: image.uploadId,
          deletedBy: userId.value,
          userRoles: userRoleString.value,
        });

        await init();

        submissionImageUploadedCount.value = submissionImageUploadedCount.value - 1;
        updateFileCount.value = updateFileCount.value - 1;

        isLoading.value = false;
      } catch (error) {
        console.error('removeImage Error:', error);
      }
    }
  };

  const submitUpdate = async () => {
    isLoading.value = true;
    updateSubmissionId.value = 0; // resetting to 0, to trigger the file upload component

    if (userId.value != null) {
      let newStatusId = TaskStatusEnum.Ready;

      if (updateAssignedWorker.value == 0) newStatusId = TaskStatusEnum['Not Ready'];

      try {
        await taskSubmissionViewerServiceProxy.updateUnitTask({
          userId: userId.value,
          assignedWorkerId: Number(updateAssignedWorker.value),
          scheduledDate: taskDetails.value.scheduledDate,
          unitTaskId: Number(route.params.taskId),
          statusId: newStatusId,
          taskDetails: updateTaskDetails.value,
        } as TaskSubmissionUpdateUnitTaskDto);

        if (updateFileCount.value > 0) {
          updateSubmissionId.value = route.params.taskId;
        }

        backToUnit();
      } catch (error) {
        console.error('submitUpdate Error:', error);
      }
    }
  };

  const cancelEdit = () => {
    if (
      (taskDetails.value?.images?.length || 0) < updateFileCount.value ||
      taskDetails.value?.assignedWorkerId != updateAssignedWorker.value ||
      taskDetails.value?.taskDetails != updateTaskDetails.value
    ) {
      const confClose = confirm('Do you want to close? All your changes will be lost');

      if (confClose) backToUnit();
    } else backToUnit();
  };

  const backToUnit = () => {
    tsvOfflineEditLock.stopEditing(Number(route.params.taskId));
    updateStatus();

    const prev = getPreviousRoute();

    if (prev?.name === 'labor-manager-project-scope') {
      router.push({
        name: 'labor-manager-project-scope',
        params: {
          id: route.params.projectId,
        },
        query: {
          view: route.params.unitId,
        },
      });
    } else {
      window.history.back();
    }
  };

  const submitEditSubmission = async () => {
    const xconfirm = confirm('Do you want to save changes?');

    if (xconfirm && userId.value != null) {
      isLoading.value = true;
      editSubmissionId.value = 0;
      try {
        await taskSubmissionViewerServiceProxy.updateUnitTask({
          userId: userId.value,
          scheduledDate: taskDetails.value.scheduledDate,
          unitTaskId: Number(route.params.taskId),
          statusId: taskDetails.value.statusId,
          submissionNotes: editSubmissionNotes.value,
        } as TaskSubmissionUpdateUnitTaskDto);

        if (updateFileCount.value > 0) {
          editSubmissionId.value = route.params.taskId;
        } else {
          backToUnit();
        }
      } catch (error) {
        console.error('submitUpdate Error:', error);
      }
    }
  };

  const openProjectWorkSubmissionCreateModal = () => {
    projectByScopeId.value = route.params.projectId;
    showProjectWorkSubmissionCreateModal.value = true;
  };

  const closeProjectWorkSubmissionCreateModal = async () => {
    await getWorkHourSubmissions();
    showProjectWorkSubmissionCreateModal.value = false;
  };

  const submitProjectWorkSubmissionCreateHandler = () => {
    isLoading.value = true;
  };

  const successProjectWorkSubmissionCreateHandler = async () => {
    if (userId.value != null) {
      await taskSubmissionViewerServiceProxy.updateUnitTask({
        scheduledDate: taskDetails.value?.scheduledDate,
        unitTaskId: Number(route.params.taskId),
        statusId: TaskStatusEnum.Started,
        userId: userId.value,
      } as TaskSubmissionUpdateUnitTaskDto);

      await taskSubmissionViewerServiceProxy.updateUnitByScope({
        unitId: Number(route.params.unitId),
        newPhaseId: currentUnit.value?.currentPhaseId,
        statusId: UnitByScopeStatusEnum.Started,
        completionDate: currentUnit.value?.completionDate,
        userId: userId.value,
        taskId: Number(route.params.taskId),
      } as TasksubmissionUpdateUnitByScopeDto);

      await init();
      // await getTaskDetails();
      await getWorkHourSubmissions();
      showProjectWorkSubmissionCreateModal.value = false;

      showToast.value = true;
      toastMessage.value = 'Unit Level Work Hour Submission have been saved';

      isLoading.value = false;

      setTimeout(() => {
        showToast.value = false;
        toastMessage.value = '';
      }, 5000);
    }
  };

  const failedProjectWorkSubmissionCreateHandler = (errMessage: string) => {
    isLoading.value = false;
    showProjectWorkSubmissionCreateModal.value = false;

    showToastErr.value = true;
    toastErrMessage.value = errMessage;

    setTimeout(() => {
      showToastErr.value = false;
      toastErrMessage.value = '';
    }, 5000);
  };

  const showBlockingIssue = (mode: string, issueId: number) => {
    router.push({
      name: 'labor-manager-blocking-issue',
      params: { id: route.params.projectId, issueId },
      query: { mode },
    });
  };

  const openBlockingIssueCreateModalHandler = () => {
    blockingIssueUnitId.value = Number(route.params.unitId);

    showBlockingIssueCreateModal.value = true;
  };

  const closeBlockingIssueCreateModalHandler = () => {
    showBlockingIssueCreateModal.value = false;
  };

  const submitBlockingIssueCreateModalHandler = () => {
    isLoading.value = true;
  };

  const createBlockingIssueSuccessHandler = async () => {
    await init();

    isLoading.value = false;

    showToast.value = true;
    toastMessage.value = 'Successfully Created';

    setTimeout(() => {
      showToast.value = false;
      toastMessage.value = '';
    }, 5000);
  };

  const createBlockingIssueFailHandler = (errMessage: string) => {
    showToastErr.value = true;
    toastErrMessage.value = errMessage;

    setTimeout(() => {
      showToastErr.value = false;
      toastErrMessage.value = '';
    }, 5000);
  };

  const submissionFileChange = (fileCount: number) => {
    submissionImageUploadedCount.value = fileCount;
  };

  const submissionFileUpload = async () => {
    await init();
  };

  const submitSubmissionMode = async () => {
    const xconf = confirm('Do you want to continue?');

    if (xconf && userId.value != null) {
      isLoading.value = true;
      submissionSubmissionId.value = 0;

      if (taskDetails.value?.clearInspection) {
        for (const item of taskDetails.value.clearInspection) {
          if (submissionCheckedRequirements.value.includes(item.id)) {
            await clearInspectionChecklistUpdateApi({
              itemId: item.id,
              isChecked: true,
              updatedBy: userId.value,
              userRoles: userRoleString.value,
            });
          } else {
            await clearInspectionChecklistUpdateApi({
              itemId: item.id,
              isChecked: false,
              updatedBy: userId.value,
              userRoles: userRoleString.value,
            });
          }
        }
      }

      await taskSubmissionViewerServiceProxy.updateUnitTask({
        scheduledDate: taskDetails.value.scheduledDate,
        unitTaskId: Number(route.params.taskId),
        statusId: TaskStatusEnum.Submitted,
        submissionNotes: submissionSubmissionNotes.value,
        userId: userId.value,
        isSubmitted: true,
      } as TaskSubmissionUpdateUnitTaskDto);

      if (isTaskValidToUpdateUnit()) {
        await taskSubmissionViewerServiceProxy.updateUnitByScope({
          completionDate: currentUnit.value.completionDate,
          unitId: Number(route.params.unitId),
          newPhaseId: currentUnit.value.currentPhaseId,
          statusId: UnitByScopeStatusEnum.Submitted,
          userId: userId.value,
          taskId: Number(route.params.taskId),
        } as TasksubmissionUpdateUnitByScopeDto);
      }

      submissionSubmissionId.value = Number(route.params.taskId);

      backToUnit();
    }
  };

  const expandTaskWorkSubmissionsLog = () => {
    taskWorkSubmissionExpanded.value = !taskWorkSubmissionExpanded.value;
  };

  const openProjectWorkSubmissionEditModal = (log: TaskSubmissionViewerWorkHourSubmissionDto) => {
    onEditLog.value = log;
    showProjectWorkSubmissionEditModal.value = true;
  };

  const closeProjectWorkSubmissionEditModal = async () => {
    await getWorkHourSubmissions();
    showProjectWorkSubmissionEditModal.value = false;
    isLoading.value = false;
  };

  const submitProjectWorkSubmissionEditHandler = () => {
    isLoading.value = true;
  };

  const successProjectWorkSubmissionEditHandler = () => {
    window.location.reload();
  };

  const updateImageAcknowledgement = async () => {
    isLoading.value = true;

    if (userId.value != null) {
      let imageAcknowledgement;

      if (submissionImageAcknowledgement.value) imageAcknowledgement = false;
      else imageAcknowledgement = true;

      await taskSubmissionViewerServiceProxy.updateUnitTask({
        scheduledDate: taskDetails.value.scheduledDate,
        unitTaskId: Number(route.params.taskId),
        statusId: taskDetails.value.statusId,
        imageAcknowledgement,
        userId: userId.value,
      } as TaskSubmissionUpdateUnitTaskDto);

      isLoading.value = false;
    } else {
      console.error('Unable to update: userId is not set');
    }
  };

  const inspectionFileChange = (fileCount: number) => {
    submissionImageUploadedCount.value = fileCount;
  };

  const inspectionFileUpload = async () => {
    backToUnit();
  };

  const submitInspection = async (status: string) => {
    if (status == 'passed') {
      const offlineMessage = 'Resolution Task details will be removed.';
      const xconf = confirm(`${offlineMessage}Do you want to continue?`);
      if (
        xconf &&
        userId.value != null &&
        taskDetails.value.clearInspection.filter((item) => item.selectStatus == 'passed')?.length >=
          taskDetails.value.clearInspection?.length
      ) {
        isLoading.value = true;
        inspectionSubmissionId.value = 0; // resetting to 0, to trigger the file upload component

        for (const item of taskDetails.value.clearInspection) {
          let passed;

          if (item.selectStatus == 'pending') passed = undefined;
          else if (item.selectStatus == 'passed') passed = true;
          else passed = false;

          const updateDeficiencyDto = new UpdateDeficiencyDto();

          updateDeficiencyDto.id = item.id;
          updateDeficiencyDto.passed = passed;
          updateDeficiencyDto.deficiencyCount = undefined;
          updateDeficiencyDto.deficiencyLevelTypeId = undefined;
          updateDeficiencyDto.updatedBy = userId.value;
          updateDeficiencyDto.taskId = Number(route.params.taskId);

          await clearInspectionServiceProxy.updateDeficiency(updateDeficiencyDto);
        }

        await taskSubmissionViewerServiceProxy.updateUnitTask({
          scheduledDate: taskDetails.value.scheduledDate,
          unitTaskId: Number(route.params.taskId),
          statusId: TaskStatusEnum.Passed,
          submissionNotes: reviewNotes.value == '' ? null : reviewNotes.value,
          userId: userId.value,
          isSubmitted: true,
        } as TaskSubmissionUpdateUnitTaskDto);

        await taskSubmissionViewerServiceProxy.updateUnitByScope({
          completionDate: currentUnit.value?.completionDate,
          unitId: Number(route.params.unitId),
          newPhaseId: currentUnit.value?.currentPhaseId + 1,
          statusId: UnitByScopeStatusEnum.Complete,
          userId: userId.value,
          taskId: Number(route.params.taskId),
        } as TasksubmissionUpdateUnitByScopeDto);

        if (allowForOffline.value) {
          IdbPunchWorkTaskCreateTSVService.deleteRecordByParentTaskId(Number(route.params.taskId));
        }

        inspectionSubmissionId.value = Number(route.params.taskId);
        backToUnit();
      }
    } else {
      showFailedClearInspectionModal.value = true;
      previousAssignedWorkerId.value =
        previousTaskDetail.value.assignedWorkerId ?? selectedUser.value;
    }
  };

  const closeInspectionMode = () => {
    backToUnit();
  };

  const cancelEditWSubmissionMode = () => {
    backToUnit();
  };

  const closeFailedClearInspectionModal = () => {
    showFailedClearInspectionModal.value = false;
  };

  const submitFailedClearInspectionModal = () => {
    showFailedClearInspectionModal.value = false;
    isLoading.value = true;
  };

  const successFailedClearInspectionModal = async () => {
    try {
      if (userId.value != null) {
        isLoading.value = true;
        inspectionSubmissionId.value = 0; // resetting to 0, to trigger the file upload component

        for (const item of taskDetails.value.clearInspection) {
          let passed;

          if (item.selectStatus == 'pending') passed = undefined;
          else if (item.selectStatus == 'passed') passed = true;
          else passed = false;

          const updateDeficiencyDto = new UpdateDeficiencyDto();

          updateDeficiencyDto.id = item.id;
          updateDeficiencyDto.passed = passed;
          updateDeficiencyDto.deficiencyCount = Number(item.deficiencyCount);
          updateDeficiencyDto.deficiencyLevelTypeId =
            item.deficiencyLevelTypeId != '0' ? Number(item.deficiencyLevelTypeId) : undefined;
          updateDeficiencyDto.updatedBy = userId.value;
          updateDeficiencyDto.taskId = Number(route.params.taskId);

          await clearInspectionServiceProxy.updateDeficiency(updateDeficiencyDto);
        }

        await taskSubmissionViewerServiceProxy.updateUnitTask({
          scheduledDate: taskDetails.value.scheduledDate,
          unitTaskId: Number(route.params.taskId),
          statusId: TaskStatusEnum.Failed,
          reviewNotes: reviewNotes.value == '' ? null : reviewNotes.value,
          userId: userId.value,
        } as TaskSubmissionUpdateUnitTaskDto);

        await taskSubmissionViewerServiceProxy.updateUnitByScope({
          completionDate: currentUnit.value.completionDate,
          unitId: Number(route.params.unitId),
          newPhaseId: currentUnit.value.currentPhaseId,
          statusId: UnitByScopeStatusEnum.Rework,
          userId: userId.value,
          taskId: Number(route.params.taskId),
        } as TasksubmissionUpdateUnitByScopeDto);

        inspectionSubmissionId.value = Number(route.params.taskId);
        isLoading.value = false;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const failedFailedClearInspectionModal = (message: string) => {
    showFailedClearInspectionModal.value = false;
    isLoading.value = false;

    showToastErr.value = true;
    toastErrMessage.value = message;

    setTimeout(() => {
      showToastErr.value = false;
      toastErrMessage.value = '';
    }, 5000);
  };

  const isTaskNotMainTaskOrMainChildTask = () => {
    if (taskDetails.value.parentTaskTypeId != null && taskDetails.value.parentTaskTypeId != 1) {
      return true;
    }

    if (taskDetails.value.taskTypeId != 1) {
      return true;
    }

    return false;
  };
  const enableWorkSubmissionLogActions = (log: TaskSubmissionViewerWorkHourSubmissionDto) => {
    if (isOffline.value && log.submitTypeName.includes('(Offline)')) return true;

    return (
      dateNow.value == log.submissionDate &&
      !isOffline.value &&
      !log.submitTypeName.includes('(Offline)')
    );
  };

  const isFailedButtonDisabled = computed(() => {
    const items = taskDetails.value.clearInspection ?? [];
    const pending = items.filter((i) => i.selectStatus === 'pending');
    const failed = items.filter((i) => i.selectStatus === 'failed');
    const validFailed = failed.filter(
      (i) =>
        i.deficiencyCount != null &&
        Number(i.deficiencyCount) >= 1 &&
        i.deficiencyLevelTypeId != null &&
        Number(i.deficiencyLevelTypeId) >= 1
    );

    return pending.length > 0 || failed.length === 0 || validFailed.length !== failed.length;
  });

  const isValidInspectionForm = computed(() => {
    const items = taskDetails.value.clearInspection ?? [];
    const passed = items.filter((i) => i.selectStatus === 'passed');
    const failed = items.filter(
      (i) =>
        i.selectStatus === 'failed' &&
        Number(i.deficiencyCount) >= 1 &&
        i.deficiencyLevelTypeId != null &&
        i.deficiencyLevelTypeId !== '0'
    );

    return passed.length + failed.length === items.length;
  });

  const allowForOffline = computed(() => {
    if (!isOffline.value) return true;

    return featureFlags.installTrackerWorkHourSubmission === true;
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

  <div class="body-content task-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / {{ toolName }} / {{ currentUnit?.projectName }} ({{
              currentUnit?.projectScopeTypeName
            }}) / Task Submission Viewer ({{ config?.mode }})
          </span>
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-task link-type-button" @click="closeViewer">
            Close Viewer<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <MaskingIndicator v-if="isMasking" />

    <hr />

    <UnitDetails
      :task-details="taskSubmissionDetails.taskDetail"
      :current-unit="taskSubmissionDetails.currentUnit"
      :task-id="taskSubmissionDetails.taskId"
      :unit-by-scope-id="taskSubmissionDetails.unitByScopeId"
      :hide-assigned-worker="true"
    />
    <div v-if="config?.mode === 'edit'" class="edit-worker col-md-4">
      <h6 class="fw-bold" style="color: #19a7af">Assigned Worker</h6>
      <select v-model="updateAssignedWorker" class="form-control">
        <option value="0">Unassigned</option>
        <template v-for="worker in availableUsers">
          <option
            v-if="worker.workerName != '' && worker.workerName != null"
            :key="worker.workerId"
            :value="worker.workerId"
          >
            {{ worker.workerName }}
          </option>
        </template>
      </select>
    </div>
    <TaskDetails
      v-if="
        taskSubmissionDetails.taskDetail.taskTypeName !== 'Main' &&
        taskSubmissionDetails.taskDetail.taskDetails != null
      "
      :task-details="taskSubmissionDetails.taskDetail"
    />
    <!-- Displaying Previous Phase's Task Detail -->
    <SubmissionDetails
      v-if="
        config?.mode === 'inspection' ||
        (config?.mode === 'submission' && taskDetails.phaseName == 'Clear Inspection')
      "
      :task-details="previousTaskDetail"
      :mode="config?.mode?.toString()"
    />
    <SubmissionDetails
      v-if="config?.mode === 'review' || config?.mode === 'preview'"
      :task-details="taskSubmissionDetails.taskDetail"
      :mode="config?.mode?.toString()"
    />
    <ClearInspectionPunchWorkSubmissionDetails
      v-if="
        config?.mode === 'inspection' &&
        taskSubmissionDetails.taskDetail.taskTypeName == 'Punch Work'
      "
      :task-details="taskSubmissionDetails.taskDetail"
    />
    <HoursSubmission
      v-if="
        config?.mode != 'edit' &&
        config?.mode != 'edit-submission' &&
        config?.mode != 'submission' &&
        config?.mode != 'inspection' &&
        config?.mode == 'preview' &&
        isTaskNotMainTaskOrMainChildTask()
      "
      :submitted-hours="workHourSubmissions"
    />
    <div v-if="taskDetails.statusId < 5 && config?.mode == 'review'" class="tl-review col-md-4">
      <h5>Team Lead Review (required):</h5>
      <div class="form-group my-3">
        <span>Set Status</span>
        <br />
        <select v-model="statusId">
          <option value="0">Select</option>
          <option value="5" class="text-success">Passed</option>
          <option value="6" class="text-danger">Failed</option>
        </select>
      </div>
      <hr v-if="statusId == 5 || statusId == 6" />
      <div v-if="statusId == 6" class="form-group my-3">
        <span>Assigned Worker</span>
        <br />
        <select v-model="selectedUser">
          <option value="0">Select</option>
          <template v-for="worker in activeWorkers">
            <option
              v-if="worker.workerName != null"
              :key="worker.workerId"
              :value="worker.workerId"
            >
              {{ worker.workerName }}
            </option>
          </template>
        </select>
      </div>
      <h6 v-if="statusId == 6" style="margin-top: 1rem">Details and Requirements for Resolution</h6>
      <span v-if="statusId == 5" class="text-muted d-block mt-3">
        <strong>(optional)</strong>
        Upload any relevant images for documentation purposes
      </span>
      <br />
      <div v-if="statusId == 6" class="form-group my-3 info">
        <div :class="[fileCount > 0 ? 'success' : 'danger']">
          <span v-if="fileCount > 0" class="check"><i class="bi bi-check-circle-fill"></i></span>
          <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
          <p>
            <strong>Upload at least 1 image</strong>
            that documents the issue that caused the unit submission to fail.
          </p>
        </div>
      </div>
      <FileUpload
        v-if="statusId == 5 || statusId == 6"
        id="task-review-image-upload"
        :submission-type-id="
          statusId == 5
            ? ImageSubmissionTypeEnum.TaskSubmissionReview
            : ImageSubmissionTypeEnum.TaskRequirements
        "
        :submission-location="'field_tracker.unit_tasks'"
        :submission-id="submissionId"
        :for-punch-work-task="offlinePunchWorkTaskTempId != null"
        @upload-success="uploadSuccess"
        @has-changed="fileChanged"
      />
      <div v-if="statusId == 5 || statusId == 6" class="form-group my-3">
        <span v-if="statusId == 5" style="margin-bottom: 5px"> (required) Task Review Notes </span>
        <span v-if="statusId == 6" style="margin-bottom: 5px">
          (required) What is required to resolve this issue?
        </span>
        <textarea
          v-model="reviewNotes"
          class="form-control"
          rows="3"
          placeholder="Notes or details from Team Lead can go here."
        >
        </textarea>
      </div>
      <div v-if="statusId == 5 || statusId == 6" class="form-group d-flex">
        <button class="btn btn-success" :disabled="isDisabled" @click="upload">Submit</button>
        <button class="btn btn-danger mx-2" @click="closeViewer">Cancel</button>
      </div>
      <div v-if="statusId != 5 && statusId != 6" class="form-group">
        <button class="btn btn-danger" @click="closeViewer">Cancel</button>
      </div>
    </div>
    <div
      v-if="
        config?.mode === 'preview' &&
        taskDetails.phaseName != 'Clear Inspection' &&
        ((taskDetails.statusId === 5 && taskDetails.reviewNotes != null) ||
          (taskDetails.statusId === 6 && taskDetails.taskDetails != null))
      "
      class="tl-review col-md-4"
    >
      <h6>Team Lead Review</h6>
      <p v-if="taskDetails.statusId == 5">{{ taskDetails.reviewNotes }}</p>
      <p v-if="taskDetails.statusId == 6">{{ taskDetails.taskDetails }}</p>
      <div v-if="taskDetails.reviewImages != null" ref="tlReviewContainer">
        <a
          v-for="image in taskDetails.reviewImages"
          :key="image.uploadId || image.url"
          data-fancybox="tl-review"
          :data-caption="`${image.imageName} ${
            image.imageName != '' && image.imageDescription != '' ? '-' : ''
          } ${image.imageDescription}`"
          :href="image.url"
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
      <small v-else class="text-danger">No image uploaded</small>
    </div>
    <div v-if="config?.mode === 'edit'" class="edit-task col-md-4">
      <h6>Update Details</h6>
      <div v-if="taskDetails.images != null" ref="editContainer" class="images">
        <div
          v-for="image in taskDetails.images"
          :key="image.uploadId || image.url"
          class="image-container"
        >
          <a
            data-fancybox="edit"
            :data-caption="`${image.imageName} ${
              image.imageName != '' && image.imageDescription != '' ? '-' : ''
            } ${image.imageDescription}`"
            :href="image.url"
          >
            <img
              class="m-1"
              :src="image.thumbnailUrl"
              alt="Thumbnail"
              width="100"
              @error="handleImageError"
            />
          </a>
          <button @click="removeImage(image)">
            <i class="bi bi-trash"></i>
            Remove
          </button>
        </div>
      </div>
      <div class="form-group my-3">
        <label class="text-muted">Upload Images</label>
        <FileUpload
          id="edit-task-requirements-image-upload"
          :submission-type-id="ImageSubmissionTypeEnum.TaskRequirements"
          :submission-location="'field_tracker.unit_tasks'"
          :submission-id="updateSubmissionId"
          @upload-success="updateSuccess"
          @has-changed="updateFileChanged"
        />
      </div>
      <div class="form-group my-3">
        <label class="text-muted">Task Details</label>
        <textarea
          v-model="updateTaskDetails"
          rows="3"
          class="form-control"
          placeholder="Task Details"
        ></textarea>
      </div>
      <div class="form-group my-3">
        <button
          class="btn btn-success"
          :disabled="
            (taskDetails?.images?.length || 0) == updateFileCount &&
            (taskDetails?.assignedWorkerId || 0) == updateAssignedWorker &&
            taskDetails?.taskDetails == updateTaskDetails
          "
          @click="submitUpdate"
        >
          Submit
        </button>
        <button class="btn btn-secondary" style="margin-left: 0.5rem" @click="cancelEdit()">
          Cancel
        </button>
      </div>
    </div>
    <div v-if="config?.mode === 'edit-submission'" class="edit-task col-md-4">
      <h6>Update Details</h6>
      <div class="form-group my-3">
        <label class="text-muted">Uploaded Images</label>
        <div v-if="taskDetails.proofImages != null" ref="editSubmissionContainer" class="images">
          <div
            v-for="image in taskDetails.proofImages"
            :key="image.uploadId || image.url"
            class="image-container"
          >
            <a
              data-fancybox="edit-submission"
              :data-caption="`${image.imageName} ${
                image.imageName != '' && image.imageDescription != '' ? '-' : ''
              } ${image.imageDescription}`"
              :href="image.url"
            >
              <img
                class="m-1"
                :src="image.thumbnailUrl"
                alt="Thumbnail"
                width="100"
                @error="handleImageError"
              />
            </a>
            <button @click="removeImage(image)">
              <i class="bi bi-trash"></i>
              Remove
            </button>
          </div>
        </div>
        <small v-else class="text-danger d-block">No image uploaded</small>
      </div>
      <div class="form-group my-3">
        <label class="text-muted">Upload More Images (optional)</label>
        <FileUpload
          id="edit-task-submission-image-upload"
          :submission-type-id="ImageSubmissionTypeEnum.TaskSubmission"
          :submission-location="'field_tracker.unit_tasks'"
          :submission-id="editSubmissionId"
          @upload-success="updateSubmissionSuccess"
          @has-changed="updateSubmissionFileChanged"
        />
      </div>
      <div class="form-group my-3">
        <label class="text-muted">Submission Notes (optional)</label>
        <textarea
          v-model="editSubmissionNotes"
          rows="3"
          class="form-control"
          placeholder="Submission Notes"
        ></textarea>
      </div>
      <div class="form-group my-3">
        <button class="btn btn-success" :disabled="isDisabled" @click="submitEditSubmission">
          Submit
        </button>
        <button
          class="btn btn-secondary"
          style="margin-left: 0.5rem"
          @click="cancelEditWSubmissionMode()"
        >
          Cancel
        </button>
      </div>
    </div>
    <template v-if="config?.mode === 'submission'">
      <div class="submission-mode col-md-4">
        <p v-if="taskDetails.taskTypeName === 'Main'" class="text-dark" style="font-size: 16px">
          <strong>Planned Quantity: </strong>
          <span>{{ Number(currentUnit.taskQuantity.setQuantity) }}</span>
          <br />
          <strong>Installed Quantity: </strong>
          <span>{{ unitLevelProjectSubmittedUnit }}</span>
          <br />
          <strong>Remaining Quantity: </strong>
          <span>
            {{ Number(currentUnit.taskQuantity.setQuantity) - unitLevelProjectSubmittedUnit }}
          </span>
          <br />
          <strong>Added Quantity: </strong>
          <span>
            {{ Number(currentUnit.taskQuantity.addedQuantities) }}
          </span>
        </p>
        <button
          v-if="allowForOffline"
          class="submit-work-hour"
          @click="openProjectWorkSubmissionCreateModal"
        >
          Submit Hours for this Task
        </button>
        <div class="blocking-issues mt-4">
          <h6 class="text-dark fw-bold">Blocking Issues</h6>
          <div
            v-for="issue in currentUnit?.blockingIssues"
            :key="issue.id"
            class="issue d-flex justify-content-between"
          >
            <span>
              Blocking Issue ({{ issue.id }}): {{ issue.createdAt }} - {{ issue.statusName }}
            </span>
            <div v-if="!isOffline" class="actions">
              <button @click="showBlockingIssue('preview', issue.id)">View</button>
              <button v-if="issue.statusId == 1" @click="showBlockingIssue('edit', issue.id)">
                Edit
              </button>
              <button v-if="issue.statusId == 1" @click="showBlockingIssue('resolve', issue.id)">
                Resolve
              </button>
            </div>
          </div>
          <button v-if="!isOffline" class="report-new" @click="openBlockingIssueCreateModalHandler">
            Report New Issue
          </button>
        </div>
        <div class="requirements">
          <template v-if="taskDetails.taskTypeName === 'Main'">
            <h6 class="text-dark fw-bold">Task Submission Requirements</h6>
            <div
              :class="[
                'info',
                Number(currentUnit.taskQuantity.setQuantity) - unitLevelProjectSubmittedUnit == 0
                  ? 'success'
                  : 'danger',
              ]"
            >
              <span
                v-if="
                  Number(currentUnit.taskQuantity.setQuantity) - unitLevelProjectSubmittedUnit == 0
                "
                class="check"
                ><i class="bi bi-check-circle-fill"></i
              ></span>
              <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
              <p>
                * Submitted entire planned quantity ({{
                  Number(currentUnit.taskQuantity.plannedQuantities)
                }}) for this task in this unit.
              </p>
            </div>
          </template>
          <template v-if="taskDetails.taskTypeName === 'Punch Work'">
            <h6 class="text-dark fw-bold">Task Submission Requirements</h6>
            <div :class="['info', workHourSubmissions?.length > 0 ? 'success' : 'danger']">
              <span v-if="workHourSubmissions?.length > 0" class="check"
                ><i class="bi bi-check-circle-fill"></i
              ></span>
              <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
              <p>
                * At least one work hour submission is required before this task can be submitted.
              </p>
            </div>
          </template>
          <div v-if="taskDetails.clearInspection?.length > 0" class="form-group">
            <template v-if="taskDetails.taskTypeName === 'Main'">
              <span class="text-muted fw-bold">Clear Inspection Checklist</span>
              <div
                :class="[
                  'info',
                  submissionCheckedRequirements.length == taskDetails.clearInspection?.length
                    ? 'success'
                    : 'danger',
                ]"
              >
                <span
                  v-if="submissionCheckedRequirements.length == taskDetails.clearInspection?.length"
                  class="check"
                  ><i class="bi bi-check-circle-fill"></i
                ></span>
                <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
                <p>* All Inspection Checklist items have been satisfied.</p>
              </div>
              <div
                v-for="(list, key) in taskDetails.clearInspection"
                :key="list.id ?? key"
                class="d-flex my-3"
              >
                <div class="custom-checkbox">
                  <input
                    :id="'checklist_' + (list.id ?? key)"
                    v-model="submissionCheckedRequirements"
                    type="checkbox"
                    class="checkbox-input"
                    :value="list.id"
                  />
                  <label :for="'checklist_' + (list.id ?? key)" class="checkbox-label"></label>
                </div>
                <label
                  class="text-dark"
                  :for="'checklist_' + (list.id ?? key)"
                  style="cursor: pointer"
                >
                  <strong>{{ list.itemTypeName }}</strong>
                  :
                  {{ list.itemTypeDescription }}
                </label>
              </div>
            </template>
          </div>
          <div class="form-group">
            <span class="text-muted fw-bold">Proof of Work</span>
            <div class="image">
              <div :class="['info', submissionImageUploadedCount > 0 ? 'success' : 'danger']">
                <span v-if="submissionImageUploadedCount > 0" class="check"
                  ><i class="bi bi-check-circle-fill"></i
                ></span>
                <span v-else class="check"><i class="bi bi-x-circle-fill"></i></span>
                <p>
                  <strong>Upload at least 1 image </strong>
                  that meets the requirements listed below in the “Photo Requirements
                  Acknowledgment” text.
                </p>
              </div>
              <FileUpload
                id="inspection-image-upload"
                :submission-type-id="ImageSubmissionTypeEnum.TaskSubmission"
                :submission-location="'field_tracker.unit_tasks'"
                :submission-id="submissionSubmissionId"
                @upload-success="submissionFileUpload"
                @has-changed="submissionFileChange"
              />
            </div>
          </div>
          <div class="form-group">
            <div v-if="taskDetails.proofImages != null" ref="submissionContainer" class="images">
              <div
                v-for="image in taskDetails.proofImages"
                :key="image.uploadId || image.url"
                class="image-container"
              >
                <a
                  data-fancybox="submission"
                  :data-caption="`${image.imageName} ${
                    image.imageName != '' && image.imageDescription != '' ? '-' : ''
                  } ${image.imageDescription}`"
                  :href="image.url"
                >
                  <img
                    class="m-1"
                    :src="image.thumbnailUrl"
                    alt="Thumbnail"
                    width="100"
                    @error="handleImageError"
                  />
                </a>
                <button @click="removeImage(image)">
                  <i class="bi bi-trash"></i>
                  Remove
                </button>
              </div>
            </div>
          </div>
          <div class="form-group mt-3">
            <span class="text-muted fw-bold">Photo Requirements Acknowledgement</span>
            <div class="d-flex my-3">
              <div class="custom-checkbox">
                <input
                  id="image_acknowledgement"
                  v-model="submissionImageAcknowledgement"
                  type="checkbox"
                  class="checkbox-input"
                  @click="updateImageAcknowledgement"
                />
                <label for="image_acknowledgement" class="checkbox-label"></label>
              </div>
              <label class="text-dark" for="image_acknowledgement" style="cursor: pointer"
                >I acknowledge that I uploaded photos of each elevation.</label
              >
            </div>
          </div>
          <div class="form-group">
            <span class="text-muted fw-bold">Submission Notes (optional)</span>
            <textarea
              v-model="submissionSubmissionNotes"
              placeholder="Notes or details from worker can go here"
              class="form-control"
            ></textarea>
          </div>
          <div class="form-group">
            <button
              class="submit-submission"
              :disabled="
                (taskDetails.taskTypeName === 'Main' &&
                  Number(currentUnit.taskQuantity.setQuantity) - unitLevelProjectSubmittedUnit >
                    0) ||
                (taskDetails.taskTypeName === 'Main' &&
                  taskDetails.clearInspection?.length > 0 &&
                  submissionCheckedRequirements?.length < taskDetails.clearInspection?.length) ||
                submissionImageUploadedCount < 1 ||
                !submissionImageAcknowledgement ||
                (taskDetails.taskTypeName === 'Punch Work' && workHourSubmissions?.length < 1)
              "
              @click="submitSubmissionMode"
            >
              Submit as Complete
            </button>
            <button class="cancel-submission" @click="closeViewer">Cancel</button>
          </div>
        </div>
      </div>
      <div class="task-work-submission-log">
        <button class="expand-button text-dark" @click="expandTaskWorkSubmissionsLog">
          <i
            :class="{
              bi: true,
              'bi-caret-down-fill': !taskWorkSubmissionExpanded,
              'bi-caret-up-fill': taskWorkSubmissionExpanded,
            }"
          ></i>
          Task Work Submissions Log
        </button>
        <table v-if="taskWorkSubmissionExpanded">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Hours</th>
              <th>Submission Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody v-if="workHourSubmissions && Object.keys(workHourSubmissions).length > 0">
            <tr v-for="list in workHourSubmissions" :key="list.id || list.submissionDate">
              <td>{{ list.submissionDate }}</td>
              <td>{{ list.submitTypeName }}</td>
              <td>{{ list.quantity }}</td>
              <td>{{ list.hoursText }}</td>
              <td>{{ list.submissionNotes }}</td>
              <td>
                <button
                  v-if="enableWorkSubmissionLogActions(list)"
                  class="action-button"
                  @click="openProjectWorkSubmissionEditModal(list)"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td class="text-danger">No work hour submissions yet</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <div v-if="config?.mode == 'inspection'" class="inspection-mode col-md-4">
      <h5>Clear Inspection Details (required):</h5>
      <hr />
      <div v-if="taskDetails.phaseName == 'Clear Inspection'" class="form-group mt-4">
        <span class="text-muted fw-bold">Clear Inspection Checklist</span>
        <div :class="['info', isValidInspectionForm ? 'success' : 'danger']">
          <span v-if="isValidInspectionForm" class="check">
            <i class="bi bi-check-circle-fill"></i>
          </span>
          <span v-else class="check">
            <i class="bi bi-x-circle-fill"></i>
          </span>
          <p>* All inspection checklist items have been satisfied.</p>
        </div>
        <div v-for="list in taskDetails.clearInspection" :key="list.id" class="checklist">
          <div class="list d-flex">
            <span v-if="list.selectStatus == 'passed'" class="text-check px-3"
              ><i class="bi bi-check-circle-fill"></i
            ></span>
            <span v-else class="text-danger px-3"><i class="bi bi-x-circle-fill"></i></span>
            <p class="text-dark">
              <strong>{{ list.itemTypeName }}</strong>
              :
              {{ list.itemTypeDescription }}
            </p>
          </div>
          <form class="d-flex radio-group">
            <div class="form-check form-check-inline">
              <input
                :id="'pending_' + list.id"
                v-model="list.selectStatus"
                class="form-check-input"
                type="radio"
                :name="'status_' + list.id"
                value="pending"
              />
              <label :for="'pending_' + list.id" class="form-check-label" style="color: #212121"
                >Pending</label
              >
            </div>
            <div class="form-check form-check-inline">
              <input
                :id="'passed_' + list.id"
                v-model="list.selectStatus"
                class="form-check-input"
                type="radio"
                :name="'status_' + list.id"
                value="passed"
              />
              <label :for="'passed_' + list.id" class="form-check-label text-success">Passed</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                :id="'failed_' + list.id"
                v-model="list.selectStatus"
                class="form-check-input"
                type="radio"
                :name="'status_' + list.id"
                value="failed"
              />
              <label :for="'failed_' + list.id" class="form-check-label text-danger">Failed</label>
            </div>
          </form>
          <div v-if="list.selectStatus === 'failed'" class="deficiency-severity">
            <div class="row">
              <div class="form-group col-md-3">
                <label :for="'deficiency_count_' + list.id" class="form-label text-dark"
                  >Deficiency Count</label
                >
                <input
                  v-model="list.deficiencyCount"
                  type="number"
                  class="form-control"
                  min="1"
                  placeholder="Deficiency Count"
                />
              </div>
              <div class="form-group col-md-3">
                <label :for="'deficiency_severity_' + list.id" class="form-label text-dark"
                  >Severity</label
                >
                <select
                  :id="'deficiency_severity_' + list.id"
                  v-model="list.deficiencyLevelTypeId"
                  class="form-select"
                >
                  <option value="0">Select Severity</option>
                  <option
                    v-for="item in clearInspectionDeficiencyLevelTypes"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <hr />
        </div>
      </div>
      <div class="form-group mt-3">
        <span class="text-muted fw-bold">(optional) Upload images for documentation purposes.</span>
        <div class="image">
          <FileUpload
            id="inspection-optional-documentation-image-upload"
            :submission-type-id="ImageSubmissionTypeEnum.TaskSubmissionReview"
            :submission-location="'field_tracker.unit_tasks'"
            :submission-id="inspectionSubmissionId"
            @upload-success="inspectionFileUpload"
            @has-changed="inspectionFileChange"
          />
        </div>
      </div>
      <div class="form-group mt-3">
        <div v-if="taskDetails.reviewImages != null" class="images">
          <div
            v-for="image in taskDetails.reviewImages"
            :key="image.uploadId || image.url"
            class="image-container"
          >
            <img
              class="mx-2"
              :src="image.thumbnailUrl"
              alt="Thumbnail"
              width="100"
              @error="handleImageError"
            />
            <button class="image-remove-btn" @click="removeImage(image)">
              <i class="bi bi-trash"></i>
              Remove
            </button>
          </div>
        </div>
      </div>
      <div class="form-group mt-3">
        <span class="text-muted fw-bold">Additional Notes or Details (optional)</span>
        <textarea
          v-model="reviewNotes"
          placeholder="Notes or details from Team Lead can go here."
          class="form-control"
        ></textarea>
      </div>
      <div class="form-group mt-3 d-flex">
        <button
          class="action-button passed"
          :disabled="
            taskDetails.clearInspection?.filter((item) => item.selectStatus === 'passed').length !=
            taskDetails.clearInspection?.length
          "
          @click="submitInspection('passed')"
        >
          Passed
        </button>
        <button
          :disabled="isFailedButtonDisabled"
          class="action-button failed"
          @click="submitInspection('failed')"
        >
          Failed
        </button>
        <button class="action-button close" @click="closeInspectionMode">Close</button>
      </div>
    </div>
    <FailedClearInspectionModal
      v-if="userId"
      :current-unit="(currentUnit as unknown as UnitData)"
      :active-workers="activeWorkers"
      :show-modal="showFailedClearInspectionModal"
      :task-id="Number(route.params.taskId)"
      :unit-id="taskSubmissionDetails.unitByScopeId"
      :user-id="userId"
      :user-roles="userRoleString"
      :root-main-task-id="rootMainTaskId"
      :previous-assigned-worker-id="previousAssignedWorkerId"
      @on-close="closeFailedClearInspectionModal"
      @on-submit="submitFailedClearInspectionModal"
      @on-success="successFailedClearInspectionModal"
      @on-failed="failedFailedClearInspectionModal"
    />
    <ProjectWorkSubmissionCreateModal
      v-if="userId && taskSubmissionDetails.taskId"
      :show-modal="showProjectWorkSubmissionCreateModal"
      :project-by-scope-id="projectByScopeId"
      :user-id="userId"
      :user-roles="userRoleString"
      :task-id="Number(route.params.taskId)"
      :phase-id="taskDetails.phaseId"
      :quantity-data="{
        plannedQuantity: currentUnit.taskQuantity.setQuantity ?? 0,
        installedQuantity: unitLevelProjectSubmittedUnit,
        remainingQuantity: currentUnit.taskQuantity.setQuantity! - unitLevelProjectSubmittedUnit,
        addedQuantity: currentUnit.taskQuantity.addedQuantities!
      }"
      :task-type-id="taskDetails.taskTypeId"
      :current-unit="currentUnit"
      :team-lead-id="taskSubmissionDetails.teamLeadId"
      @on-close="closeProjectWorkSubmissionCreateModal"
      @on-submit="submitProjectWorkSubmissionCreateHandler"
      @on-success="successProjectWorkSubmissionCreateHandler"
      @on-failed="failedProjectWorkSubmissionCreateHandler"
    />
    <BlockingIssueCreateModal
      v-if="userId"
      :show-modal="showBlockingIssueCreateModal"
      :blocking-issue-unit-id="blockingIssueUnitId"
      :project-by-scope-id="0"
      :user-id="userId"
      :user-roles="userRoleString"
      @on-close="closeBlockingIssueCreateModalHandler"
      @on-submit="submitBlockingIssueCreateModalHandler"
      @on-success="createBlockingIssueSuccessHandler"
      @on-failed="createBlockingIssueFailHandler"
    />
    <ProjectWorkSubmissionEditModal
      v-if="userId"
      :show-modal="showProjectWorkSubmissionEditModal"
      :edit-log="onEditLog"
      :worker-details="workerDetails"
      :user-id="userId"
      :user-roles="userRoleString"
      :task-id="1"
      @on-close="closeProjectWorkSubmissionEditModal"
      @on-submit="submitProjectWorkSubmissionEditHandler"
      @on-success="successProjectWorkSubmissionEditHandler"
      @remove-image="removeImage"
    />
  </div>
</template>
<style scoped>
  .text-check {
    color: rgba(32, 120, 32, 0.715);
  }
  .checklist {
    margin-bottom: 1rem;
  }
  form {
    margin-bottom: 1rem;
  }
  .radio-group {
    margin-left: 2.5rem;
  }
  .deficiency-severity {
    margin: 0 0 1rem 2.5rem;
  }
  .form-check-label {
    cursor: pointer;
  }
  .edit-worker {
    background: #f9f9f9;
    border-radius: 3px;
    margin: 2rem 5rem;
    padding: 2rem;
    width: 90vw;
    max-width: 700px;
    min-width: 340px;
  }
  .inspection-mode {
    margin: 2rem 5rem;
  }
  .inspection-mode h5 {
    color: #19a7af;
    margin-bottom: 0.5rem;
  }
  .inspection-mode .action-button {
    color: #fff;
    margin: 0 0.2rem;
    padding: 0.2rem 1.3rem;
    border: none;
    border-radius: 3px;
    position: relative;
    z-index: 1;
    touch-action: manipulation;
    pointer-events: auto;
    user-select: auto;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
  .inspection-mode .action-button.passed {
    background: #19a7af;
  }
  .inspection-mode .action-button.passed:disabled {
    background: #5ebabf;
  }
  .inspection-mode .action-button.failed {
    background: #dc3545;
  }
  .inspection-mode .action-button.failed:disabled {
    background: #f25079;
  }
  .inspection-mode .action-button.close {
    background: #928686;
  }
  .task-work-submission-log {
    margin: 2rem 5rem;
    color: #212121;
  }
  .task-work-submission-log .expand-button {
    background: transparent;
    font-size: 16px;
    font-weight: bold;
    border: none;
    outline: none;
  }
  .task-work-submission-log table .action-button {
    background: transparent;
    color: #19a7af;
    border: none;
    outline: none;
  }
  .submission-mode {
    margin: 2rem 5rem;
  }
  .submission-mode .submit-work-hour {
    background: #19a7af;
    color: #fff;
    padding: 0.2rem 1.3rem;
    border-radius: 4px;
    border: none;
    outline: none;
  }
  .submission-mode h6 {
    font-size: 16px;
  }
  .submission-mode .blocking-issues .issue {
    color: #000;
    padding-left: 0.7rem;
  }
  .submission-mode .blocking-issues .actions button {
    color: #19a7af;
    background: transparent;
    border: none;
    outline: none;
  }
  .submission-mode .blocking-issues .report-new {
    background: #dc3545;
    color: #fff;
    padding: 0.2rem 1.3rem;
    border-radius: 4px;
    border: none;
    outline: none;
    margin-top: 0.7rem;
  }
  .submission-mode .requirements {
    margin-top: 1.5rem;
  }
  .images {
    padding: 1rem 0;
    display: flex;
  }
  .images .image-container {
    display: flex;
    flex-direction: column;
  }
  .images .image-container button {
    background: transparent;
    border: none;
    outline: none;
    color: #dc3545;
  }
  .submission-mode .requirements .submit-submission {
    background: #198754;
    color: #fff;
    padding: 0.2rem 1.3rem;
    border-radius: 4px;
    border: none;
    outline: none;
    margin-top: 0.7rem;
    margin-right: 0.25rem;
  }
  .submission-mode .requirements .submit-submission:disabled {
    background: #58be8f;
  }
  .submission-mode .cancel-submission {
    background: #d84264;
    color: #fff;
    padding: 0.2rem 1.3rem;
    border-radius: 4px;
    border: none;
    outline: none;
    margin-top: 0.7rem;
    margin-left: 0.25rem;
  }
  .modal-title {
    color: #19a7af;
  }
  .bi-x-circle {
    margin-left: 0.35rem;
  }
  .edit-task {
    width: 90vw;
    max-width: 700px;
    min-width: 340px;
    background: #f9f9f9;
    border-radius: 3px;
    padding: 2rem;
    margin: 2rem 5rem;
  }
  .edit-task h6 {
    color: #19a7af;
    font-weight: bold;
  }
  .section-title {
    margin-top: 1rem;
  }
  .text-dark {
    font-size: 0.8rem;
  }
  .tl-review {
    margin: 2rem 5rem;
    color: #212121;
    max-width: 800px;
    min-width: 360px;
  }
  .tl-review h5 {
    color: #19a7af;
    font-weight: bolder;
  }
  .tl-review h6 {
    font-weight: bolder;
  }
  .tl-review span,
  small {
    font-weight: bolder;
  }
  .tl-review select {
    border: none;
    outline: none;
  }
  .tl-review .info div {
    display: flex;
  }
  .tl-review .info .success span {
    margin: 0 6px;
    font-size: 200%;
    color: rgba(32, 120, 32, 0.715);
  }
  .tl-review .info .danger span {
    margin: 0 6px;
    font-size: 200%;
    color: rgb(202, 55, 55);
  }
  .tl-review .info .success p {
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .tl-review .info .danger p {
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  .info {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .info.success .check {
    font-size: 200%;
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .info.danger .check {
    font-size: 200%;
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  .info.success p {
    margin: 0 6px;
    color: rgba(32, 120, 32, 0.715);
  }
  .info.danger p {
    margin: 0 6px;
    color: rgb(202, 55, 55);
  }
  table {
    width: 90vw;
    max-width: 700px;
    min-width: 390px;
  }
  table thead {
    background: #f9f9f9;
  }
  table thead tr {
    border-bottom: 1px solid #858585;
  }
  table thead tr th {
    border-right: 1px solid #858585;
    text-align: center;
    padding: 0.5 0.8rem;
    font-weight: bolder;
  }
  table thead tr th:last-child {
    border-right: none;
  }
  table tbody tr {
    border-bottom: 1px solid #858585;
  }
  table tbody tr:last-child {
    border-bottom: none;
  }
  table tbody tr td {
    border-right: 1px solid #858585;
    text-align: center;
    padding: 0.5rem;
  }
  table tbody tr td:last-child {
    border-right: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 275px;
  }
  .custom-checkbox {
    display: inline;
    margin-right: 5px;
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
    background-color: #007bff7f;
    border: 1px solid #007bff7f;
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
  .breadcrumb-nav {
    font-size: 16px;
    font-weight: 200;
    color: #3c3c3c;
  }
  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
  }
  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }
  .task-viewer {
    overflow-y: auto; /* Enables vertical scrolling if content overflows */
    height: 100vh; /* Optional: Adjust if you want a specific height */
    margin-top: 62px;
    width: 100vw;
    min-width: 390px;
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
    min-width: 390px;
  }
  .breadcrumb-nav {
    font-size: 16px;
    font-weight: 200;
  }
  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
  }
  hr {
    margin: 0 15px;
    color: #7a7a7a;
  }
  @media (max-width: 800px) {
    .task-viewer {
      margin-left: 0.25rem;
    }
    .tl-review {
      margin: 1rem 2rem;
    }
    .subtasks {
      margin: 0 2rem 1rem 2rem;
    }
    .edit-task {
      margin: 1rem;
      padding: 1rem;
      width: 90vw;
      max-width: 640px;
    }
  }
  @media (max-width: 430px) {
    .task-viewer {
      margin-top: 103px;
    }
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
</style>
