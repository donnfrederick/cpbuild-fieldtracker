<script setup lang="ts">
  import axios from 'axios';
  import { Modal } from 'bootstrap';
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
  import 'vue-select/dist/vue-select.css';

  import TopNavBar from '@/components/TopNavBar.vue';
  import BlockingIssue from '@/components/BlockingIssue.vue';
  import FileUpload from '@/components/FileUpload.vue';
  import type { RoleAssignments, Units, UnitTask, WorkersList } from '@/interfaces/project';
  import BlockingIssueCreateModal from '@/components/modal/BlockingIssueCreateModal.vue';
  import { LaborManagerService } from '@/services/laborManagerService';
  import {
    TaskStatusEnum,
    TaskTypeEnum,
    UnitByScopeStatusEnum,
    ImageSubmissionTypeEnum,
  } from '@/enum';
  import type { UpdateUnitsByScopeApiRequest } from '@/interfaces/api/laborManagerRequest';
  import {
    ActionNeededDto,
    ActiveWorkerDto,
    BlockingIssueDto,
    CreateUnitTaskRequestDto,
    LaborManagerServiceProxy,
    PresetOptionDto,
    ProjectScopeViewerDto,
    SetUnitTaskScheduleDateRequestDto,
    SubTaskTypeDto,
    UnitByScopeServiceProxy,
    UnitByScopeStatusTypeDto,
    UnitByScopeUpdateRequestDto,
    UnitPhaseByScopeDto,
    UnitRoleAssignmentRequestDto,
    UnitTaskDto,
    UnitTasksAndAssignmentsDto,
    UnitTaskServiceProxy,
    UnreviewedWorkHourSubmissionDto,
    WorkerDto,
    WorkForceServiceProxy,
    WorkerRoleTypeDto,
    ByRolesDto,
  } from '@/shared/service-proxies/service-proxies';
  import { localStorageHelper } from '@/util/localStorageHelper';
  import type { UnitListStorage } from '@/interfaces/common/unitListStorage';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { ModeTool } from '@/interfaces/common/modeTool';
  import type { IUnitDetailFilter } from '@/interfaces/common/unitDetailFilter';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import { storeToRefs } from 'pinia';
  import MaskingIndicator from '@/components/MaskingIndicator.vue';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const maskingStore = useMaskingStore();
  const { isMasking } = storeToRefs(maskingStore);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');
  const localStorageKey = ref<string>(`unitListStorage_${route.params.id}`);
  const unitListStorage = localStorageHelper<UnitListStorage>(localStorageKey.value);

  const actionExpanded = ref(false);

  const workForceServiceproxy = new WorkForceServiceProxy();

  const unreviewedWorkHourSubmissionsData: any = ref<UnreviewedWorkHourSubmissionDto[]>([]);

  const actionNeeded = ref<ActionNeededDto[]>([]);
  const blockingIssues = ref<ActionNeededDto[]>([]);
  const units = ref<Units[]>([]);

  const currentUnitIdForSubtask = ref<number | null>(null);
  const currentUnitForSubtask = ref<Units | null>(null);

  const taskDetails = ref<UnitTask>({
    taskId: 0,
    unitId: 0,
    parentTaskId: 0,
    parentTaskTypeId: 0,
    parentTaskTypeName: '',
    parentStatusId: 0,
    parentStatusName: '',
    taskTypeId: 0,
    taskTypeName: '',
    scopeTypeId: 0,
    scopeTypeName: '',
    phaseId: 0,
    phaseName: '',
    statusId: 0,
    statusName: '',
    imageAcknowledgmentChecked: false,
    imageAcknowledgmentText: '',
    assignedWorkerId: 0,
    assignedWorkerName: '',
    workerUserId: 0,
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
    images: {},
    clearInspection: {},
    unitByScopeId: 0,
  });

  const keyword = ref('');

  const roleAssignments = ref<RoleAssignments[]>([]);

  // Add Subtask Modal
  const addSubtaskModalRef = ref<HTMLElement | null>(null);
  let addSubtaskModalInstance: Modal | null = null;

  const subTaskTypes = ref<SubTaskTypeDto[]>([]);
  const selectedSubTaskType = ref(0);
  const subtaskAssignedWorker = ref(0);
  const subtaskTaskDetails = ref('');
  const subtaskSubmissionId = ref(0);
  const subtaskFileCount = ref(0);
  const phaseIdForSubtask = ref(0);

  const assignWorkerModalRef = ref<HTMLElement | null>(null);
  let assignWorkerModalInstance: Modal | null = null;

  const completionDateModalRef = ref<HTMLElement | null>(null);
  let completionDateModalInstance: Modal | null = null;

  const showToast = ref(false);
  const toastMessage = ref('');

  const showToastErr = ref(false);
  const toastErrMessage = ref('');

  const updateFileCount = ref(0);
  const updateTaskDetails = ref('');
  const activeWorkers = ref<ActiveWorkerDto[]>([]);

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

  const isSubtaskFormValid = computed(() => {
    return (
      selectedSubTaskType.value !== 0 &&
      subtaskAssignedWorker.value !== 0 &&
      phaseIdForSubtask.value !== 0 &&
      subtaskTaskDetails.value.trim() !== '' &&
      subtaskFileCount.value > 0
    );
  });

  const isStagingDatePickerDisabled = (unit: Units) =>
    computed(() => {
      const hasRestrictedStatus =
        unit.unitStatusId === 4 ||
        unit.unitStatusId === 5 ||
        unit.unitStatusId === 6 ||
        unit.unitStatusId === 8 ||
        unit.unitStatusId === 9;

      return hasRestrictedStatus || shouldDisableStagingDatePicker(unit);
    });

  const updateSubmissionId = ref<any>(0);

  const selectedUnits = ref<number[]>([]);

  const availableUsers: any = ref([]);

  const presetOptions = ref<PresetOptionDto>({
    unitPhases: [] as UnitPhaseByScopeDto[],
    unitScopeStatusTypes: [] as UnitByScopeStatusTypeDto[],
  } as PresetOptionDto);

  const presetExpanded = ref<boolean>(false);
  const selectedPhases = ref<number[]>([]);
  const selectedStatusTypes = ref<number[]>([]);

  const subtaskPhaseOptions = ref<UnitPhaseByScopeDto[]>([]);

  const workers = ref<WorkersList[]>([]);
  const workerRoleTypes = ref<ByRolesDto[]>([]);
  const workersNeeded = ref<WorkersList[]>([]);
  const selectedAssignedWorkerId = ref<number>(0);
  const selectedCompletionDate = ref<string>('');
  const selectedPhaseId = ref<number>(0);

  const blockingIssueUnitId = ref<number>(0);
  const showBlockingIssueCreateModal = ref<boolean>(false);
  const selectedAssignment = ref<RoleAssignments | null>(null);
  const laborManagerService = new LaborManagerService();

  const expandedUnit = ref<number>(0);

  const unitByScopeServiceProxy = new UnitByScopeServiceProxy();
  const laborManagerServiceProxy = new LaborManagerServiceProxy();

  const projectName = ref<string | undefined>('');
  const scopeTypeId = ref<number>(0);
  const scopeTypeName = ref<string | undefined>('');

  const unitTaskServiceProxy = new UnitTaskServiceProxy();

  const sessionStorageService = new SessionStorageService();

  const unitDetailPresetFilters = ref<IUnitDetailFilter[]>([
    { key: 'bldg', displayName: 'Building', checked: false },
    { key: 'lvl', displayName: 'Level', checked: false },
    { key: 'unit', displayName: 'Unit', checked: false },
    { key: 'unit-type', displayName: 'Unit Type', checked: false },
  ]);
  const uncheckedUnitDetailFilterCount = computed(
    () => unitDetailPresetFilters.value.filter((e) => !e.checked).length
  );
  const selectAllUnitDetailsFilter = () => {
    unitDetailPresetFilters.value.forEach((f) => (f.checked = true));
  };

  const deselectAllUnitDetailsFilter = () => {
    unitDetailPresetFilters.value.forEach((f) => (f.checked = false));
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
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  async function getUnreviewedWorkHourSubmissions() {
    try {
      await laborManagerServiceProxy
        .getUnreviewedWorkHourSubmissions(Number(route.params.id))
        .then((result: UnreviewedWorkHourSubmissionDto[]) => {
          unreviewedWorkHourSubmissionsData.value = result;
        });
    } catch (error) {
      console.error('Error fetching unreviewed work hour submissions:', error);
    }
  }

  async function getUnitTaskwithActionNeeded() {
    try {
      await laborManagerServiceProxy
        .getActionsNeededByProjectByScopeId(Number(route.params.id))
        .then((result: ActionNeededDto[]) => {
          actionNeeded.value = result;

          const blockedIssue = actionNeeded.value.find((list: any) => list.id == -1);

          if (blockedIssue) blockingIssues.value.push(blockedIssue);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function getPresetOptions() {
    try {
      await laborManagerServiceProxy.getPresetOption(scopeTypeId.value).then((result) => {
        presetOptions.value = result as PresetOptionDto;
      });

      subtaskPhaseOptions.value = presetOptions.value.unitPhases as UnitPhaseByScopeDto[];
      subtaskPhaseOptions.value = subtaskPhaseOptions.value.slice(1);
      activeWorkers.value = presetOptions.value.activeWorkers;
      subTaskTypes.value = presetOptions.value.subTaskTypes;
      roleAssignments.value = presetOptions.value.roleAssignments as RoleAssignments[];
    } catch (error) {
      console.error(error);
    }
  }

  async function getWorkersList() {
    try {
      await workForceServiceproxy.getWorkersList().then((result: WorkerDto[]) => {
        workers.value = result;

        workers.value.forEach((worker: WorkersList, key: number) => {
          if (typeof worker.roleTypes === 'string') {
            workers.value[key].roleTypes = worker.roleTypes.split(', ');
          }

          if (typeof worker.scopeTypes === 'string') {
            workers.value[key].scopeTypes = worker.scopeTypes.split(', ');
          }

          if (typeof worker.workerRoleTypeIds === 'string') {
            workers.value[key].workerRoleTypeIds = worker.workerRoleTypeIds.split(', ');
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function getWorkerRoleTypesList() {
    try {
      await workForceServiceproxy.getWorkerRoleTypesList().then((result: WorkerRoleTypeDto) => {
        workerRoleTypes.value = result.roles.filter(
          (row: ByRolesDto) => row.scopeTypeId === scopeTypeId.value
        );
      });
    } catch (error) {
      console.error(error);
    }
  }

  const getProjectDetailsAndUnits = async () => {
    await laborManagerServiceProxy
      .getProjectDetailsAndUnits(Number(route.params.id))
      .then((result: ProjectScopeViewerDto) => {
        projectName.value = result.projectName;
        scopeTypeName.value = result.scopeTypeName;
        scopeTypeId.value = result.scopeTypeId;
        units.value = result.unitTasks as Units[];
        units.value.forEach((e) => {
          e.subtasks = [];
          e.mainTasks = [];
        });
      });
  };

  const setUnitListStorage = () => {
    unitListStorage.set({
      projectByScopeId: Number(route.params.id),
      keyword: keyword.value,
      selectedPhases: selectedPhases.value,
      selectedStatusTypes: selectedStatusTypes.value,
      unitDetailPresetFilters: unitDetailPresetFilters.value,
    });
  };

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

    const getUnitListStorage = unitListStorage.get();
    if (getUnitListStorage) {
      keyword.value = getUnitListStorage?.keyword || '';
      selectedPhases.value = getUnitListStorage?.selectedPhases || [];
      selectedStatusTypes.value = getUnitListStorage?.selectedStatusTypes || [];

      if (getUnitListStorage?.unitDetailPresetFilters.length > 0)
        unitDetailPresetFilters.value = getUnitListStorage.unitDetailPresetFilters;
    }

    await getProjectDetailsAndUnits();
    isLoading.value = false;

    await getPresetOptions();
    await getUnitTaskwithActionNeeded();

    //#region + TODOs
    await getWorkersList();
    await getWorkerRoleTypesList();
    //#endregion

    if (assignWorkerModalRef.value) {
      assignWorkerModalInstance = new Modal(assignWorkerModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (completionDateModalRef.value) {
      completionDateModalInstance = new Modal(completionDateModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (addSubtaskModalRef.value) {
      addSubtaskModalInstance = new Modal(addSubtaskModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (route.query.view != undefined) {
      for (const unit of filteredUnits.value) {
        if (unit.id == Number(route.query.view)) {
          await getUnitTasks(unit);
          unit.expanded = true;
        }
      }

      const el = document.getElementById('filteredUnits_' + route.query.view);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  const closeProject = () => {
    router.push({ name: 'labor-manager-assigned-projects-active' });
  };

  const expandActionNeedSection = async () => {
    actionExpanded.value = !actionExpanded.value;

    if (actionExpanded.value) await getUnreviewedWorkHourSubmissions();
  };

  const updateSuccess = () => {
    window.location.reload();
  };

  const updateFileChanged = (count: number) => {
    updateFileCount.value = count;
  };

  const showBlockingIssue = (mode: string, issueId: number) => {
    router.push({
      name: 'labor-manager-blocking-issue',
      params: { id: route.params.id, issueId },
      query: { mode },
    });
  };

  const closeBlockingIssue = () => {
    router.push({ name: 'labor-manager-project-scope-viewer', params: { id: route.params.id } });
  };

  const getSelectedBlockingIssue = computed<BlockingIssueDto | undefined>(() => {
    const selectedUnit = units.value.find((unit) => unit.id === Number(route.params.id));
    return selectedUnit?.blockingIssues?.find(
      (issue: BlockingIssueDto) => issue.id === Number(route.params.issueId)
    );
  });

  const expandUnit = async (unit: Units, reloadUnit = false) => {
    unit.expanded = !unit.expanded;

    if (unit.mainTasks && unit.mainTasks.length > 0 && !reloadUnit) {
      return;
    }

    await getUnitTasks(unit);
  };

  const getUnitTasks = async (unit: Units) => {
    const unitTasks = await laborManagerServiceProxy.getUnitTasksAndAssignment(
      unit.id,
      scopeTypeId.value
    );

    const newUnit = units.value.find((e) => e.id == unit.id) as Units;

    newUnit.mainTasks = unitTasks.mainTasks;
    newUnit.subtasks = unitTasks.subTasks;
    newUnit.roleAssignments = unitTasks.roleAssignments as RoleAssignments[];
  };

  const editAssignment = async (assignment: RoleAssignments, editPrimaryWorker: boolean) => {
    if (editPrimaryWorker) assignment.editing = !assignment.editing;
    else assignment.editingSecondaryWorker = !assignment.editingSecondaryWorker;

    if (assignment.editingSecondaryWorker || assignment.editing) {
      if (assignment.eligibleRoleIds.length > 0 && scopeTypeId.value != null) {
        const roleIds = assignment.eligibleRoleIds.join(',');

        try {
          const { data } = await axios.post(
            `${apiBaseUrl}/api-proxy`,
            {
              userRoles: userRoleString.value,
              targetUrl: `${apiBaseUrl}/scope-task/${scopeTypeId.value}/eligible-workers/list?roleIds=${roleIds}`,
              targetMethodType: 'GET',
            },
            {
              timeout: 120000,
            }
          );

          availableUsers.value = data;
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const shouldDisableRoleAssignmentEditing = (
    currentPhaseId: number,
    assignment: RoleAssignments
  ) =>
    assignment.mainTask
      ? assignment.mainTask.statusId > TaskStatusEnum.Started ||
        (assignment.mainTask.phaseId != undefined && assignment.mainTask.phaseId < currentPhaseId)
      : false;

  const roleAssign = async (
    unit: Units,
    assignment: any,
    event: Event,
    assignPrimaryWorker = true
  ) => {
    const target = event.target as HTMLSelectElement | null;
    if (target == null) return;

    isLoading.value = true;

    try {
      await unitByScopeServiceProxy
        .unitRoleAssignment({
          unitByScopeId: unit.id,
          phaseId: assignment.phaseId,
          assignPrimaryWorker,
          scopeTypeId: scopeTypeId.value,
          userId: userId.value,
          workerId: target.value == '0' ? undefined : target.value,
        } as UnitRoleAssignmentRequestDto)
        .then((result: UnitTasksAndAssignmentsDto) => {
          unit.currentPhaseId = Number(result.unitByScopePhaseId);
          unit.currentPhaseName = result.unitByScopePhaseName?.toString() ?? '';
          unit.unitStatusId = Number(result.statusId);
          unit.unitStatusName = result.statusName?.toString() ?? '';

          unit.mainTasks = result.mainTasks;
          unit.subtasks = result.subTasks;
          unit.roleAssignments = result.roleAssignments as RoleAssignments[];
        })
        .finally(() => {
          unit.expanded = true;
          isLoading.value = false;
        });
    } catch (error) {
      console.error('Error creating new blocking issue:', error);
    }
  };

  const openTaskSubmission = (task: UnitTaskDto) => {
    let mode = '';

    if (task.taskTypeId === TaskTypeEnum.Main) {
      const phaseName = task.phaseName?.toLowerCase();
      if (phaseName === 'clear inspection') {
        switch (task.statusId) {
          case TaskStatusEnum.Submitted:
          case TaskStatusEnum.Ready:
            mode = 'inspection';
            break;
          case TaskStatusEnum.Passed:
          case TaskStatusEnum.Failed:
          case TaskStatusEnum.Started:
            mode = 'preview';
            break;
        }
      } else {
        switch (task.statusId) {
          case TaskStatusEnum.Submitted:
            mode = 'review';
            break;
          case TaskStatusEnum.Passed:
          case TaskStatusEnum.Failed:
          case TaskStatusEnum.Started:
            mode = 'preview';
            break;
        }
      }
    } else if (
      task.taskTypeId === TaskTypeEnum.Modification ||
      task.taskTypeId === TaskTypeEnum.TradeDamageRepair ||
      task.taskTypeId === TaskTypeEnum.PunchWork
    ) {
      // There's also a inspection for Punch Work tasks or subtasks
      if (task.phaseName == 'Clear Inspection' && task.statusId == TaskStatusEnum.Submitted)
        mode = 'inspection';
      else {
        switch (task.statusId) {
          case TaskStatusEnum['Not Ready']:
          case TaskStatusEnum.Ready:
            mode = 'edit';
            break;
          case TaskStatusEnum.Submitted:
            mode = 'review';
            break;
          case TaskStatusEnum.Passed:
          case TaskStatusEnum.Failed:
          case TaskStatusEnum.Started:
            mode = 'preview';
            break;
        }
      }
    }

    const sessionKey = `taskSubmissionViewer_task_${task.taskId}`;
    sessionStorageService.setItem<ModeTool>(sessionKey, {
      mode,
      tool: 'laborManager',
    });

    router.push({
      name: 'task-submission-viewer',
      params: {
        projectId: route.params.id,
        unitId: task.unitByScopeId,
        taskId: task.taskId,
      },
      query: {
        mode,
        tool: 'laborManager',
      },
    });
  };
  const hasNoActiveFilter = computed(() => {
    return (
      selectedPhases.value.length === 0 &&
      selectedStatusTypes.value.length === 0 &&
      uncheckedUnitDetailFilterCount.value === unitDetailPresetFilters.value.length
    );
  });

  watch(hasNoActiveFilter, (newVal) => {
    if (!newVal) presetExpanded.value = true;
  });

  const filteredUnits = computed(() => {
    if (
      !keyword.value &&
      selectedPhases.value.length === 0 &&
      selectedStatusTypes.value.length === 0 &&
      uncheckedUnitDetailFilterCount.value === unitDetailPresetFilters.value.length
    ) {
      return units.value;
    }

    return units.value.filter((unit) => {
      const search = keyword.value?.toLowerCase() || '';

      const matchesKeyword =
        !keyword.value ||
        (() => {
          const activeFilters = unitDetailPresetFilters.value.filter((f) => f.checked);

          if (activeFilters.length === 0) {
            // No filters checked → search in all properties
            return (
              unit.building.toLowerCase().includes(search) ||
              unit.level.toLowerCase().includes(search) ||
              unit.unit.toLowerCase().includes(search) ||
              unit.unitType.toLowerCase().includes(search)
            );
          }

          // Filters are checked → search only in checked properties
          return activeFilters.some((f) => {
            switch (f.key) {
              case 'bldg':
                return unit.building.toLowerCase().includes(search);
              case 'lvl':
                return unit.level.toLowerCase().includes(search);
              case 'unit':
                return unit.unit.toLowerCase().includes(search);
              case 'unit-type':
                return unit.unitType.toLowerCase().includes(search);
              default:
                return false;
            }
          });
        })();

      const matchesPhase =
        selectedPhases.value.length === 0 ||
        selectedPhases.value.includes(Number(unit.currentPhaseId));

      const matchesStatus =
        selectedStatusTypes.value.length === 0 ||
        selectedStatusTypes.value.includes(Number(unit.unitStatusId));

      return matchesKeyword && matchesPhase && matchesStatus;
    });
  });

  watch(
    () => keyword.value,
    (_) => {
      selectedUnits.value = [];
    },
    { immediate: true }
  );

  watch(
    () => selectedPhases.value,
    (_) => {
      selectedUnits.value = [];
    },
    { immediate: true }
  );

  watch(
    () => selectedStatusTypes.value,
    (_) => {
      selectedUnits.value = [];
    },
    { immediate: true }
  );

  watch(
    [keyword, selectedPhases, selectedStatusTypes, unitDetailPresetFilters],
    () => {
      setUnitListStorage();
    },
    { deep: true }
  );

  const selectVisible = () => {
    selectedUnits.value = [];

    filteredUnits.value.forEach((unit: Units) => {
      selectedUnits.value.push(unit.id);
    });
  };

  const deselectVisible = () => {
    selectedUnits.value = [];
  };

  const expandPreset = () => {
    presetExpanded.value = !presetExpanded.value;
  };

  const selectAllPhaseFilter = () => {
    selectedPhases.value = [];

    presetOptions.value.unitPhases.forEach((phase: UnitPhaseByScopeDto) => {
      selectedPhases.value.push(phase.id);
    });
  };

  const deselectAllPhaseFilter = () => {
    selectedPhases.value = [];
  };

  const selectAllStatusTypesFilter = () => {
    selectedStatusTypes.value = [];

    presetOptions.value.unitScopeStatusTypes.forEach((statusType: UnitByScopeStatusTypeDto) => {
      selectedStatusTypes.value.push(statusType.id);
    });
  };

  const deselectAllStatusTypesFilter = () => {
    selectedStatusTypes.value = [];
  };

  const openSubtaskModal = (unitId: number, unit: Units) => {
    expandedUnit.value = unit.id;
    if (unit.mainTasks.length > 0) {
      currentUnitIdForSubtask.value = unitId;
      currentUnitForSubtask.value = unit;
      if (!addSubtaskModalInstance) {
        console.warn('Subtask modal instance is not initialized');
        return;
      }
      addSubtaskModalInstance.show();
    }
  };

  const subtaskUploadSuccess = async () => {
    const selectedUnit = units.value.find((e) => e.id == currentUnitIdForSubtask.value) as Units;
    await getUnitTasks(selectedUnit);

    addSubtaskModalInstance?.hide();

    isLoading.value = false;
    resetAddSubTaskModal();

    toastMessage.value = 'Subtask successfully added';
    showToast.value = true;

    setTimeout(() => {
      toastMessage.value = '';
      showToast.value = false;
    }, 1000);
  };

  const resetAddSubTaskModal = () => {
    selectedSubTaskType.value = 0;
    subtaskAssignedWorker.value = 0;
    phaseIdForSubtask.value = 0;
    subtaskTaskDetails.value = '';
    subtaskFileCount.value = 0;
  };

  const subtaskChangedFile = (fileCount: number) => {
    subtaskFileCount.value = fileCount;
  };

  const submitSubTask = async () => {
    if (
      selectedSubTaskType.value == 0 ||
      subtaskAssignedWorker.value == 0 ||
      subtaskTaskDetails.value == '' ||
      subtaskFileCount.value == 0
    ) {
      if (addSubtaskModalInstance) {
        addSubtaskModalInstance.hide();
      }

      showToastErr.value = true;
      toastErrMessage.value = 'All fields are required';

      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = ``;
      }, 1000);
    } else {
      isLoading.value = true;

      try {
        await unitTaskServiceProxy
          .createSubTask({
            unitByScopeId: currentUnitIdForSubtask.value,
            parentTaskId: Number(route.params.taskId),
            taskTypeId: selectedSubTaskType.value,
            phaseId: phaseIdForSubtask.value,
            statusId: 2,
            assignedWorkerId: subtaskAssignedWorker.value,
            taskDetails: subtaskTaskDetails.value,
            createdBy: userId.value,
          } as CreateUnitTaskRequestDto)
          .then((result) => {
            subtaskSubmissionId.value = result;
          })
          .catch((error) => {
            console.error(error);
          });
      } catch (error) {
        console.log('submitSubtask Error:', error);

        // Stop loading
        isLoading.value = false;

        // Close modal if open
        if (addSubtaskModalInstance) {
          addSubtaskModalInstance.hide();
        }

        showToastErr.value = true;
        toastErrMessage.value = 'Unable to create subtask. Please try again.';

        setTimeout(() => {
          showToastErr.value = false;
          toastErrMessage.value = '';
        }, 1000);
      }
    }
  };

  const handleImageError = (event: any) => {
    event.target.src = '/thumbnail.png';
  };

  async function getTaskDetails() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/unit-task/${route.params.taskId}/details`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      taskDetails.value = data;
    } catch (error) {
      console.log('getTaskDetails Error:', error);
    }
  }

  const removeImage = async (image: any) => {
    const xconfirm = confirm('Are you sure you want to delete this image?');

    if (xconfirm) {
      isLoading.value = true;

      const reqBody = {
        deletedBy: userId.value,
        userRoles: userRoleString.value,
        targetUrl: `${apiBaseUrl}/blob/${image.uploadId}/delete`,
        targetMethodType: 'PATCH',
      };

      try {
        await axios.post(`${apiBaseUrl}/api-proxy`, reqBody, {
          timeout: 120000,
        });

        await getTaskDetails();
        isLoading.value = false;
      } catch (error) {
        console.log('removeImage Error:', error);
      }
    }
  };

  const submitUpdate = async () => {
    isLoading.value = true;

    const reqBody = {
      scheduledDate: taskDetails.value.scheduledDate,
      statusId: taskDetails.value.statusId,
      taskDetails: updateTaskDetails.value,
      updatedBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/unit-task/${route.params.taskId}/update`,
      targetMethodType: 'PATCH',
    };

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, reqBody, {
        timeout: 120000,
      });

      if (updateFileCount.value > 0) {
        updateSubmissionId.value = route.params.taskId;
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.log('submitUpdate Error:', error);
    }
  };

  const openAssignerModal = (assignment: RoleAssignments) => {
    selectedAssignedWorkerId.value = 0;
    selectedAssignment.value = assignment;

    const roleTypeId = workerRoleTypes.value.find(
      (roleType: ByRolesDto) => assignment.roleDisplayName === roleType.roleTypeName
    )?.id;

    selectedPhaseId.value = Number(assignment.phaseId);

    if (roleTypeId) {
      workersNeeded.value = workers.value.filter((worker: WorkersList) => {
        const roleIds = Array.isArray(worker.workerRoleTypeIds)
          ? worker.workerRoleTypeIds.map((id) => Number(id))
          : [Number(worker.workerRoleTypeIds)];

        return roleIds.includes(roleTypeId);
      });

      if (assignWorkerModalInstance) {
        assignWorkerModalInstance.show();
      }
    } else {
      alert("There's no available worker for this role yet");
    }
  };

  const fetchUnitTaskIdByUnitScopeAndPhaseId = async (unitByScopeId: number, phaseId: number) => {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/unit-task/by-scope-phase/${unitByScopeId}/${phaseId}`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      return data.taskId;
    } catch (error) {
      console.error(error);
    }
  };

  const createMainTasks = async (unitId: number) => {
    const reqBody = {
      createdBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/unit-by-scope/${unitId}/main-tasks/create`,
      targetMethodType: 'POST',
    };

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, reqBody, {
        timeout: 120000,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const assignWorker = async (taskId: number) => {
    let task: any;

    filteredUnits.value.forEach((unit: any) => {
      task = unit.mainTasks.find((mainTask: any) => mainTask.taskId == taskId);
    });

    let newStatusId: number;

    if (selectedAssignedWorkerId.value == 0) newStatusId = 1;
    else newStatusId = 2;

    const reqBody = {
      statusId: newStatusId,
      assignedWorkerId: selectedAssignedWorkerId.value,
      scheduledDate: task?.scheduledDate,
      updatedBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/unit-task/${taskId}/update`,
      targetMethodType: 'PATCH',
    };

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, reqBody, {
        timeout: 120000,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const assignWorkerBulk = async () => {
    const xconfirm = confirm('Do you want to continue?');

    if (xconfirm) {
      isLoading.value = true;
      for (const unit of selectedUnits.value) {
        const unitDetails = units.value.find((unitData) => unitData.id == unit);
        if (unitDetails && unitDetails.unitStatusId < 4) {
          try {
            if (selectedAssignment.value != null) {
              selectedAssignment.value.mainTask = unitDetails.mainTasks.find(
                (e) => e.phaseName == selectedAssignment.value?.taskName
              ) as UnitTaskDto;

              if (
                shouldDisableRoleAssignmentEditing(
                  unitDetails.currentPhaseId,
                  selectedAssignment.value as RoleAssignments
                )
              )
                return window.location.reload();

              await createMainTasks(unit);
              const taskId = await fetchUnitTaskIdByUnitScopeAndPhaseId(
                unit,
                selectedPhaseId.value
              );
              await assignWorker(taskId);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
      window.location.reload();
    }
  };

  const closeAssignWorkerModal = () => {
    if (assignWorkerModalInstance) {
      selectedAssignment.value = null;
      assignWorkerModalInstance.hide();
    }
  };

  const openCompletionDateModal = () => {
    if (completionDateModalInstance) {
      completionDateModalInstance.show();
    }
  };

  const completionDateBulk = async () => {
    const xconfirm = confirm(
      'Are you sure you want to set the staging date to ' + selectedCompletionDate.value + '?'
    );
    if (!xconfirm) return;

    isLoading.value = true;
    let hasError = false;

    for (const unitId of selectedUnits.value) {
      const unit = units.value.find((u) => u.id === unitId);

      // Skip if unit is locked
      if (!unit || isStagingDatePickerDisabled(unit).value) continue;

      let newPhaseId: number;
      let newStatusId: number;
      let completionDate: string | null = selectedCompletionDate.value.trim();

      const wasPreviouslyUnset = unit.completionDate === null || unit.completionDate === '';

      if (completionDate === '') {
        // User is clearing the date
        completionDate = null;
        newPhaseId = presetOptions.value.unitPhases[0].id;
        newStatusId = hasActiveBlockingIssue(unit) ? 7 : 3;
      } else {
        // User is setting a date (or updating it)

        // Only advance to second phase if it was previously unset (even if user re-cleared it and set it again)
        if (wasPreviouslyUnset) {
          newPhaseId = presetOptions.value.unitPhases[1].id; // Second phase
        } else {
          newPhaseId = unit.currentPhaseId; // Keep current phase
        }

        const newPhaseTask = unit.mainTasks.find((task) => task.phaseId === newPhaseId);

        if (hasActiveBlockingIssue(unit)) {
          newStatusId = 7;
        } else if (newPhaseTask && newPhaseTask.assignedWorkerId === null) {
          newStatusId = 1;
        } else if (
          newPhaseTask &&
          newPhaseTask.assignedWorkerId !== null &&
          newPhaseTask.scheduledDate === null
        ) {
          newStatusId = 2;
        } else if (
          newPhaseTask &&
          newPhaseTask.assignedWorkerId !== null &&
          newPhaseTask.scheduledDate !== null
        ) {
          newStatusId = 3;
        } else {
          newStatusId = 1;
        }
      }

      try {
        await updateUnitsByScopeRequest(unit.id, completionDate, newPhaseId, newStatusId);

        // Update frontend in-place
        unit.completionDate = completionDate ?? '';
        unit.currentPhaseId = newPhaseId;
        unit.currentPhaseName =
          presetOptions.value.unitPhases.find((phase) => phase.id === newPhaseId)?.phaseName ?? '';
        unit.initialCumulativePercent =
          presetOptions.value.unitPhases.find((phase) => phase.id === newPhaseId)
            ?.initialCumulativePercent ?? '';
        unit.unitStatusId = newStatusId;
        unit.unitStatusName =
          presetOptions.value.unitScopeStatusTypes.find((status) => status.id === newStatusId)
            ?.statusName ?? '';

        // Call createMainTasks
        createMainTasks(unit.id).catch((err) => {
          console.error('Error creating main tasks:', err);
        });
      } catch (error) {
        console.error(`Failed to update unit ${unit.id}:`, error);
        hasError = true;
        break; // Exit loop on first error
      }
    }

    closeCompletionDateModal();
    isLoading.value = false;

    if (hasError) {
      showToastErr.value = true;
      toastErrMessage.value = 'One or more staging dates failed to update.';
      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);
    } else {
      showToast.value = true;
      toastMessage.value = 'Staging dates updated successfully.';
      setTimeout(() => {
        showToast.value = false;
        toastMessage.value = '';
      }, 5000);
    }
  };

  const closeCompletionDateModal = () => {
    if (completionDateModalInstance) {
      completionDateModalInstance.hide();
    }
  };

  const shouldDisableStagingDatePicker = (unit: Units) => {
    let result;
    const unitMainTasks = unit.mainTasks;
    const hasStagingDateSet = unit.completionDate !== null;
    const currentPhaseId = unit.currentPhaseId;
    const secondPhaseId = presetOptions.value.unitPhases[1]?.id;
    const currentPhaseStatusId = unit.mainTasks?.find(
      (task) => task.phaseId === currentPhaseId
    )?.statusId;
    const isSecondPhase = unit.currentPhaseId === secondPhaseId;
    const greaterThanSecondPhase = unit.currentPhaseId > presetOptions.value.unitPhases[1]?.id;
    const hasMainTasks = unitMainTasks && unitMainTasks?.length > 0;

    if (!hasStagingDateSet || !hasMainTasks) {
      result = false;
    } else if (hasStagingDateSet && hasMainTasks) {
      if (isSecondPhase && currentPhaseStatusId && currentPhaseStatusId < 3) {
        result = false;
      }
      if (isSecondPhase && currentPhaseStatusId && currentPhaseStatusId > 2) {
        result = true;
      }
      if (greaterThanSecondPhase) {
        result = true;
      }
    } else result = true;
    return result;
  };

  const hasActiveBlockingIssue = (unit: Units) => {
    return (
      (unit.blockingIssues && unit.blockingIssues?.some((issue) => issue.statusId === 1)) ?? false
    );
  };

  const updateStagingDate = async (unit: Units, ogVal: string, event: Event) => {
    const input = event.target as HTMLInputElement;
    let newValue: string | null = input.value.trim();

    const newDateValue = new Date(newValue);
    const thresholdDate = new Date('1970-01-01');

    if (newValue != '' && newDateValue < thresholdDate) {
      return;
    }

    const xconfirm = confirm(
      'Are you sure you want to set the staging date to ' + (newValue ?? 'blank') + '?'
    );
    if (!xconfirm) {
      input.value = ogVal;
      return;
    }

    isLoading.value = true;

    try {
      await unitByScopeServiceProxy
        .setStagingDateAndReturnUnitTasks({
          unitByScopeId: unit.id,
          scopeTypeId: scopeTypeId.value,
          completionDate: !newValue ? null : newValue,
          userId: userId.value,
        } as UnitByScopeUpdateRequestDto)
        .then((result: UnitTasksAndAssignmentsDto) => {
          const selectedUnit = units.value.find((e) => e.id == result.unitByScopeId) as Units;
          selectedUnit.mainTasks = result.mainTasks;
          unit.currentPhaseId = Number(result.unitByScopePhaseId);
          unit.currentPhaseName = result.unitByScopePhaseName?.toString() ?? '';
          unit.unitStatusId = Number(result.statusId);
          unit.unitStatusName = result.statusName ? result.statusName.toString() : '';
          selectedUnit.subtasks = result.subTasks;
          selectedUnit.roleAssignments = result.roleAssignments as RoleAssignments[];
        })
        .finally(() => {
          isLoading.value = false;
          unit.completionDate = !newValue ? '' : newValue.toString();
        });
    } catch (error) {
      console.error('Failed to update the staging date:', error);

      showToastErr.value = true;
      toastErrMessage.value = 'Failed to update the staging date';
      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);

      input.value = ogVal; // restore input value
    }
  };

  const updateScheduleDate = async (unit: Units, task: UnitTaskDto, event: Event) => {
    const input = event.target as HTMLInputElement;
    let newValue: string = input.value.trim();

    const newDateValue = new Date(newValue);
    const thresholdDate = new Date('1970-01-01');

    if (newValue != '' && newDateValue < thresholdDate) {
      return;
    }

    const xconfirm = confirm(
      'Are you sure you want to set the Scheduled date to ' + (newValue ?? 'blank') + '?'
    );
    if (!xconfirm) {
      if (task.scheduledDate != null) input.value = task.scheduledDate.toString();
      else input.value = '';
      return;
    }

    isLoading.value = true;

    // let taskStatus; // Removed unused variable

    // The following assignments are not needed since taskStatus is never used
    // if (newValue == '') taskStatus = TaskStatusEnum['Not Ready'];
    // else {
    //   if (task.assignedWorkerId == null) taskStatus = TaskStatusEnum['Not Ready'];
    //   else taskStatus = TaskStatusEnum.Ready;
    // }

    expandedUnit.value = unit.id;
    try {
      await unitTaskServiceProxy
        .setUnitTaskScheduleDateAndReturnTasks({
          userId: userId.value,
          unitTaskId: task.taskId,
          scheduleDate: !newValue ? null : newValue,
          scopeTypeId: scopeTypeId.value,
        } as SetUnitTaskScheduleDateRequestDto)
        .then((result: UnitTasksAndAssignmentsDto) => {
          const selectedUnit = units.value.find((e) => e.id == result.unitByScopeId) as Units;
          selectedUnit.mainTasks = result.mainTasks;
          unit.currentPhaseId = Number(result.unitByScopePhaseId);
          unit.currentPhaseName = result.unitByScopePhaseName?.toString() ?? '';
          unit.unitStatusId = Number(result.statusId);
          unit.unitStatusName = result.statusName ? result.statusName.toString() : '';
          selectedUnit.subtasks = result.subTasks;
          selectedUnit.roleAssignments = result.roleAssignments as RoleAssignments[];
        })
        .finally(() => {
          isLoading.value = false;
          task.scheduledDate = !newValue ? '' : newValue;
        });
    } catch (error) {
      console.error(error);
      console.error('Failed to update the Scheduled date:', error);

      showToastErr.value = true;
      toastErrMessage.value = 'Failed to update the Scheduled date';
      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);

      input.value = task.scheduledDate; // restore input value
    }
  };

  const openBlockingIssueCreateModalHandler = (unitId: number) => {
    blockingIssueUnitId.value = unitId;

    showBlockingIssueCreateModal.value = true;
  };

  const closeBlockingIssueCreateModalHandler = () => {
    showBlockingIssueCreateModal.value = false;
  };

  const submitBlockingIssueCreateModalHandler = () => {
    isLoading.value = true;
  };

  const createBlockingIssueSuccessHandler = async () => {
    await getProjectDetailsAndUnits();

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

  const updateUnitsByScopeRequest = async (
    unitId: number,
    completionDate: string | null,
    newPhaseId: number,
    statusId: UnitByScopeStatusEnum
  ) => {
    await laborManagerService.updateUnitsByScope(unitId, {
      completionDate,
      newPhaseId,
      statusId,
      updatedBy: userId.value,
    } as UpdateUnitsByScopeApiRequest);
  };

  const isClearInspectionReady = (task: UnitTaskDto, unit: Units) =>
    unit.currentPhaseName?.toLowerCase() === 'clear inspection' &&
    task.phaseName?.toLowerCase() === 'clear inspection' &&
    task.statusId === TaskStatusEnum.Ready;

  const disableActionButton = (task: UnitTaskDto, unit: Units) => {
    if (isClearInspectionReady(task, unit)) return false;

    return (
      task.submittedAt === '---' ||
      [TaskStatusEnum['Not Ready'], TaskStatusEnum.Ready].includes(task.statusId)
    );
  };

  const actionButtonClass = (task: UnitTaskDto, unit: Units) => {
    if (isClearInspectionReady(task, unit)) return true;

    return (
      task.submittedAt !== '---' &&
      ![TaskStatusEnum['Not Ready'], TaskStatusEnum.Ready].includes(task.statusId)
    );
  };

  const addSecondaryWorker = (assignment: RoleAssignments) => {
    assignment.hasSecondaryWorker = true;
  };

  const getAvailableSecondaryUsers = (assignedWorkerName: string | undefined) => {
    if (assignedWorkerName == undefined) return availableUsers.value;

    return availableUsers.value.filter((e: any) => e.workerName != assignedWorkerName);
  };

  defineExpose({
    userRoleString,
    userId,
    units,
    selectedPhases,
    selectedStatusTypes,
    filteredUnits,
    unitDetailPresetFilters,
    keyword,
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

  <div class="body-content ft-project-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Labor Manager / {{ projectName }} ({{ scopeTypeName }}) / Project Scope
            Viewer</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeProject">
            Close Project<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <MaskingIndicator v-if="isMasking" />

    <hr />

    <div class="col-md-12 action-needed" style="padding: 2rem">
      <h6 class="text-dark fw-bold">{{ projectName }} ({{ scopeTypeName }})</h6>
      <button class="expand-button fw-bold" @click="expandActionNeedSection">
        <i
          :class="{
            bi: true,
            'bi-caret-down-fill': !actionExpanded,
            'bi-caret-up-fill': actionExpanded,
          }"
        ></i>
        Action Needed
      </button>
      <div :class="{ 'action-box': true, 'd-none': !actionExpanded }">
        <h6>Hours Needing Review</h6>
        <hr />
        <ul v-if="unreviewedWorkHourSubmissionsData.length > 0" class="hours-needing-review">
          <li
            v-for="data in unreviewedWorkHourSubmissionsData"
            :key="data.workHourSubmissionTypeId"
          >
            <span class="text-danger">{{ data.hours }}</span> -
            {{ data.workHourSubmissionTypeName }}
          </li>
        </ul>
        <button
          class="review-hours-btn"
          @click="
            () => {
              router.push({
                name: 'labor-manager-hours-submitted',
                params: { id: route.params.id },
              });
            }
          "
        >
          Review Hour Submissions
        </button>
        <div class="phases">
          <template v-for="list in actionNeeded">
            <div v-if="list.id > 0" :key="list.id">
              <h6>{{ list.name }}</h6>
              <hr />
              <!-- Staging Phase -->
              <p v-if="list.completionDateNeeded > 0 && list.order == 1">
                <span>{{ list.completionDateNeeded }} unit(s)</span>
                - need staging completion date
              </p>
              <p v-if="list.completionDateNeeded == 0 && list.order == 1" class="caught-up">
                <i class="bi bi-check-circle-fill" style="color: #19af79"></i>
                All Caught Up
              </p>

              <!-- Other Phases -->
              <p v-if="list.workerAssignmentNeeded > 0 && list.order > 1">
                <span>{{ list.workerAssignmentNeeded }} unit(s)</span>
                - needs a worker assignment
              </p>
              <p v-if="list.schedulingNeeded > 0 && list.order > 1">
                <span>{{ list.schedulingNeeded }} unit(s)</span>
                - needs a scheduled date
              </p>
              <p v-if="list.reviewNeeded > 0 && list.order > 1">
                <span>{{ list.reviewNeeded }} unit(s)</span>
                - have submissions in need of review
              </p>
              <p v-if="list.resubmissionsNeedingReview > 0 && list.order > 1">
                <span>{{ list.resubmissionsNeedingReview }} unit(s)</span>
                - have resubmissions from previously failed {{ list.name }} task needing review
              </p>
              <p v-if="list.punchWorkSubmissionsNeedingReview > 0 && list.order > 1">
                <span>{{ list.punchWorkSubmissionsNeedingReview }} unit(s)</span>
                - have punch work submissions needing review
              </p>
              <p v-if="list.modificationSubmissionsNeedingReview > 0 && list.order > 1">
                <span>{{ list.modificationSubmissionsNeedingReview }} unit(s)</span>
                - have modification submissions needing review
              </p>
              <p v-if="list.tradeDamageRepairSubmissionsNeedingReview > 0 && list.order > 1">
                <span>{{ list.tradeDamageRepairSubmissionsNeedingReview }} unit(s)</span>
                - have trade damage repair submissions needing review
              </p>
              <p
                v-if="
                  list.reviewNeeded === 0 &&
                  list.workerAssignmentNeeded == 0 &&
                  list.schedulingNeeded == 0 &&
                  list.reviewNeeded == 0 &&
                  list.resubmissionsNeedingReview == 0 &&
                  list.punchWorkSubmissionsNeedingReview == 0 &&
                  list.modificationSubmissionsNeedingReview == 0 &&
                  list.tradeDamageRepairSubmissionsNeedingReview == 0 &&
                  list.order > 1
                "
                class="caught-up"
              >
                <i class="bi bi-check-circle-fill" style="color: #19af79"></i>
                All Caught Up
              </p>
            </div>
          </template>
          <div>
            <h6>Blocking Issues</h6>
            <hr />
            <template v-if="blockingIssues.length > 0">
              <div v-for="list in blockingIssues" :key="list.id || list.name">
                <p v-if="list.name == 'Blocked Units' && list.unitsWithBlockingIssue > 0">
                  <span>{{ list.unitsWithBlockingIssue }} unit(s)</span>
                  - have blocking issue(s)
                </p>
              </div>
            </template>
            <template v-else>
              <p class="caught-up">
                <i class="bi bi-check-circle-fill" style="color: #19af79"></i>
                All Caught Up
              </p>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div>
      <h6 style="color: #19a7af; margin-left: 2rem; font-weight: bold">UNITS LIST</h6>
      <hr />
      <div class="form-group unit-search">
        <label class="text-muted">Filter by Unit Keywords</label>
        <br />
        <div class="d-flex">
          <div class="input-with-clear">
            <input v-model="keyword" placeholder="Filter by unit detail, role, or task" />
            <i v-if="keyword" class="bi bi-x-circle clear-icon" @click="keyword = ''"></i>
          </div>
          <button
            v-if="selectedUnits.length < filteredUnits.length"
            class="select-visible"
            @click="selectVisible"
          >
            Select All Visible
          </button>
          <button v-else class="select-visible" @click="deselectVisible">
            Deselect All Visible
          </button>
        </div>
        <label class="text-muted" style="font-size: 12px; margin-left: 12px"
          >to further narrow results, see advanced filters</label
        >
      </div>
      <div class="form-group unit-preset">
        <div class="d-flex">
          <button class="preset" @click="expandPreset">
            <i
              :class="{
                bi: true,
                'bi-caret-down-fill': !presetExpanded,
                'bi-caret-up-fill': presetExpanded,
              }"
            ></i>
            Advanced Filters
          </button>
          <span v-if="!hasNoActiveFilter" class="text-danger">
            -
            {{
              selectedPhases.length +
              selectedStatusTypes.length +
              (unitDetailPresetFilters.length - uncheckedUnitDetailFilterCount)
            }}
            Active</span
          >
        </div>
        <div v-if="presetExpanded" class="filters col-md-4">
          <div class="d-flex justify-content-between">
            <h6>Unit Keyword Filter Categories</h6>
            <button v-if="uncheckedUnitDetailFilterCount != 0" @click="selectAllUnitDetailsFilter">
              Select All
            </button>
            <button v-else @click="deselectAllUnitDetailsFilter">Deselect All</button>
          </div>
          <hr />
          <div class="checklist d-flex flex-wrap">
            <div v-for="filter in unitDetailPresetFilters" :key="filter.key" class="item">
              <div class="custom-checkbox">
                <input
                  :id="'filter_' + filter.key"
                  v-model="filter.checked"
                  type="checkbox"
                  class="checkbox-input"
                />
                <label :for="'filter_' + filter.key" class="checkbox-label"></label>
              </div>
              <label :for="'filter_' + filter.key">{{ filter.displayName }}</label>
            </div>
          </div>

          <div class="d-flex justify-content-between">
            <h6>Unit Phase</h6>
            <button
              v-if="selectedPhases.length != presetOptions.unitPhases.length"
              @click="selectAllPhaseFilter"
            >
              Select All
            </button>
            <button v-else @click="deselectAllPhaseFilter">Deselect All</button>
          </div>
          <hr />
          <div class="checklist d-flex flex-wrap">
            <div v-for="phase in presetOptions.unitPhases" :key="phase.id" class="item">
              <div class="custom-checkbox">
                <input
                  :id="'phase_' + phase.id"
                  v-model="selectedPhases"
                  type="checkbox"
                  class="checkbox-input"
                  :value="phase.id"
                />
                <label :for="'phase_' + phase.id" class="checkbox-label"></label>
              </div>
              <label :for="'phase_' + phase.id">{{ phase.phaseName }}</label>
            </div>
          </div>
          <div class="d-flex justify-content-between">
            <h6>Unit Phase Status</h6>
            <button
              v-if="selectedStatusTypes.length != presetOptions.unitScopeStatusTypes.length"
              @click="selectAllStatusTypesFilter"
            >
              Select All
            </button>
            <button v-else @click="deselectAllStatusTypesFilter">Deselect All</button>
          </div>
          <hr />
          <div class="checklist d-flex flex-wrap">
            <div
              v-for="statusType in presetOptions.unitScopeStatusTypes"
              :key="statusType.id"
              class="item"
            >
              <div class="custom-checkbox">
                <input
                  :id="'status_' + statusType.id"
                  v-model="selectedStatusTypes"
                  type="checkbox"
                  class="checkbox-input"
                  :value="statusType.id"
                />
                <label :for="'status_' + statusType.id" class="checkbox-label"></label>
              </div>
              <label :for="'status_' + statusType.id">{{ statusType.statusName }}</label>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group unit-count col-md-4">
        <div class="counter">
          <h6>
            Total Units:
            <span>{{ units.length }}</span>
          </h6>
        </div>
        <div class="counter">
          <h6>
            Filtered Units:
            <span
              v-if="keyword != '' || selectedPhases.length > 0 || selectedStatusTypes.length > 0"
              >{{ filteredUnits.length }}</span
            >
            <span v-else>0</span>
          </h6>
        </div>
        <div class="counter">
          <h6>
            Selected Units:
            <span>{{ selectedUnits.length }}</span>
          </h6>
        </div>
      </div>
      <div v-if="selectedUnits.length > 0" class="bulk-actions col-md-4">
        <h6 class="fw-bold">
          Bulk Actions
          <span>(apply to all selected units)</span>
        </h6>
        <div class="section">
          <h6>
            <i class="bi bi-person-add"></i>
            Assign Worker
          </h6>
          <div class="buttons">
            <button
              v-for="assignment in roleAssignments"
              :key="assignment.roleDisplayName"
              @click="openAssignerModal(assignment)"
            >
              {{ assignment.roleDisplayName }}
            </button>
          </div>
        </div>
        <div class="section">
          <h6>
            <i class="bi bi-calendar2-date"></i>
            Set Completion Date
          </h6>
          <div class="buttons">
            <button @click="openCompletionDateModal">Staging</button>
          </div>
        </div>
      </div>
      <div class="units">
        <div v-for="(unit, key) in filteredUnits" :key="key">
          <div :id="'filteredUnits_' + unit.id" class="unit">
            <div class="custom-checkbox">
              <input
                :id="'check_' + unit.id"
                v-model="selectedUnits"
                type="checkbox"
                class="checkbox-input"
                :value="unit.id"
              />
              <label :for="'check_' + unit.id" class="checkbox-label"></label>
            </div>
            <div class="unit-data">
              <p class="mb-3">
                <span>Building: </span
                ><span style="font-weight: normal">{{ unit.building }}, </span> <span>Level: </span
                ><span style="font-weight: normal">{{ unit.level }}, </span> <span>Unit: </span
                ><span style="font-weight: normal">{{ unit.unit }}, </span> <span>Unit Type: </span
                ><span style="font-weight: normal">{{ unit.unitType }} </span>
              </p>
              <p class="mb-3">
                <span>Unit ID: </span><span style="font-weight: normal">{{ unit.id }}, </span>
                <span>Phase: </span
                ><span style="font-weight: normal">{{ unit.currentPhaseName }}, </span>
                <span>Phase ID: </span
                ><span style="font-weight: normal">{{ unit.currentPhaseId }}, </span>
                <span>Status: </span
                ><span style="font-weight: normal">{{ unit.unitStatusName }}, </span>
                <span>Status ID: </span
                ><span style="font-weight: normal">{{ unit.unitStatusId }}, </span>
                <span>Progress: </span
                ><span style="font-weight: normal">{{ unit.initialCumulativePercent + '%' }} </span>
              </p>
              <p>
                <span>Planned Qty: </span>
                <template v-if="unit.taskQuantity != null && unit.taskQuantity.setQuantity != 0">
                  {{ unit.taskQuantity.setQuantity }}
                </template>
                - <span>Assembled: </span>0, <span>Installed: </span>0
              </p>
              <p class="mb-3">
                <span>Added Qty: </span>
                <template
                  v-if="unit.taskQuantity != null && unit.taskQuantity.addedQuantities != 0"
                >
                  {{ unit.taskQuantity.addedQuantities }}
                </template>
                - <span>Assembled: </span>0, <span>Installed: </span>0
              </p>
              <p>
                Blocking Issues:
                <template v-if="unit.blockingIssues != null">
                  <div
                    v-for="blockingIssue in unit.blockingIssues"
                    :key="blockingIssue.id"
                    class="blocking-issues"
                  >
                    <br />
                    <span>Issue ID: </span>{{ blockingIssue.id }}, <span>Created: </span
                    >{{ blockingIssue.createdAt }}, <span>Status: </span
                    >{{ blockingIssue.statusName }}

                    <button
                      class="edit-issue"
                      @click="showBlockingIssue('preview', blockingIssue.id)"
                    >
                      Preview
                    </button>
                    <button
                      v-if="blockingIssue.statusId == 1"
                      class="edit-issue"
                      @click="showBlockingIssue('edit', blockingIssue.id)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="blockingIssue.statusId == 1"
                      class="edit-issue"
                      @click="showBlockingIssue('resolve', blockingIssue.id)"
                    >
                      Resolve
                    </button>
                  </div>
                </template>
                <button class="add-issue" @click="openBlockingIssueCreateModalHandler(unit.id)">
                  Add New Issue
                </button>

                <!-- Dynamically load BlockingIssue only when the route has an issueId -->
                <BlockingIssue
                  v-if="route.params.issueId"
                  :issue="getSelectedBlockingIssue"
                  :mode="route.query.mode ? String(route.query.mode) : undefined"
                  @close="closeBlockingIssue"
                />
              </p>
              <button class="drop-button" @click="expandUnit(unit)">
                <i :class="['bi', unit.expanded ? 'bi-caret-up-fill' : 'bi-caret-down-fill']"></i>
                <span v-if="unit.expanded"> HIDE</span>
                <span v-else> SHOW</span>
              </button>
              <div v-if="unit.expanded" class="role-assignments">
                <h6 class="text-light">Role Assignments</h6>
                <ul>
                  <li
                    v-for="assignment in unit.roleAssignments"
                    :key="assignment.roleDisplayName"
                    class="role-assignment d-flex flex-column"
                  >
                    <strong>{{ assignment.roleDisplayName }}: </strong>
                    <div class="assignment-container d-flex justify-content-between">
                      <div class="assignee">
                        <span style="font-weight: 600"> Primary: </span>
                        <span class="assignment">
                          <span v-if="assignment.mainTask?.assignedWorkerId">
                            {{ assignment.mainTask.assignedWorkerName }}
                          </span>
                          <span v-else class="unassigned">Unassigned</span>
                        </span>
                      </div>
                      <div>
                        <button
                          class="role-assignment-button"
                          :disabled="
                            shouldDisableRoleAssignmentEditing(unit.currentPhaseId, assignment)
                          "
                          @click="editAssignment(assignment, true)"
                        >
                          Edit Assignment
                          <i
                            :class="[
                              'bi',
                              assignment.editing ? 'bi-caret-up-fill' : 'bi-caret-down-fill',
                            ]"
                          ></i>
                        </button>
                        <div v-if="assignment.editing" class="assignment-options">
                          <select @change="(event) => roleAssign(unit, assignment, event)">
                            <option
                              :value="0"
                              class="text-danger"
                              :selected="
                                assignment.mainTask == null || assignment.mainTask == undefined
                              "
                            >
                              Unassigned
                            </option>
                            <template v-for="worker in availableUsers">
                              <option
                                v-if="worker.workerName != '' && worker.workerName != null"
                                :key="worker.workerId"
                                :value="worker.workerId"
                                :selected="
                                  assignment.mainTask != null &&
                                  assignment.mainTask != undefined &&
                                  assignment.mainTask.assignedWorkerName == worker.workerName
                                "
                              >
                                {{ worker.workerName }}
                              </option>
                            </template>
                          </select>
                        </div>
                      </div>
                    </div>

                    <hr style="border-style: dashed" />

                    <template
                      v-if="assignment.mainTask?.assignedWorkerId || assignment.hasSecondaryWorker"
                    >
                      <template v-if="!assignment.hasSecondaryWorker">
                        <button class="add-wroker" @click="addSecondaryWorker(assignment)">
                          <i class="bi-plus-circle" /> Worker
                        </button>
                      </template>

                      <template v-else>
                        <div class="assignment-container d-flex justify-content-between">
                          <div class="assignee">
                            <span style="font-weight: 600"> Secondary: </span>
                            <span class="assignment">
                              <span
                                v-if="
                                  assignment.mainTask != null &&
                                  assignment.mainTask != undefined &&
                                  assignment.mainTask.secondaryWorkerName != null &&
                                  assignment.mainTask.secondaryWorkerName != undefined
                                "
                              >
                                {{ assignment.mainTask.secondaryWorkerName }}
                              </span>
                              <span v-else class="unassigned">Unassigned</span>
                            </span>
                          </div>
                          <div>
                            <button
                              class="role-assignment-button"
                              :disabled="
                                shouldDisableRoleAssignmentEditing(unit.currentPhaseId, assignment)
                              "
                              @click="editAssignment(assignment, false)"
                            >
                              Edit Assignment
                              <i
                                :class="[
                                  'bi',
                                  assignment.editingSecondaryWorker
                                    ? 'bi-caret-up-fill'
                                    : 'bi-caret-down-fill',
                                ]"
                              ></i>
                            </button>
                            <div
                              v-if="assignment.editingSecondaryWorker"
                              class="assignment-options"
                            >
                              <select
                                @change="(event) => roleAssign(unit, assignment, event, false)"
                              >
                                <option
                                  :value="0"
                                  class="text-danger"
                                  :selected="
                                    assignment.mainTask == null || assignment.mainTask == undefined
                                  "
                                >
                                  Unassigned
                                </option>
                                <template
                                  v-for="worker in getAvailableSecondaryUsers(
                                    assignment.mainTask?.assignedWorkerName
                                  )"
                                >
                                  <option
                                    v-if="worker.workerName != '' && worker.workerName != null"
                                    :key="worker.workerId"
                                    :value="worker.workerId"
                                    :selected="
                                      assignment.mainTask != null &&
                                      assignment.mainTask != undefined &&
                                      assignment.mainTask.secondaryWorkerId == worker.workerId
                                    "
                                  >
                                    {{ worker.workerName }}
                                  </option>
                                </template>
                              </select>
                            </div>
                          </div>
                        </div>
                      </template>
                    </template>
                  </li>
                </ul>
              </div>
              <div v-if="unit.expanded" class="main-tasks unit-tasks">
                <h6 class="text-light">Main Tasks</h6>
                <table>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Phase ID</th>
                      <th>Scheduled</th>
                      <th>Submitted</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>N/A</td>
                      <td>Staging</td>
                      <td>N/A</td>
                      <td>N/A</td>
                      <td>N/A</td>
                      <td>
                        <input
                          type="date"
                          class="form-control"
                          :value="unit.completionDate"
                          :disabled="isStagingDatePickerDisabled(unit).value"
                          @change="updateStagingDate(unit, unit.completionDate, $event)"
                        />
                      </td>
                      <td></td>
                    </tr>
                    <tr v-for="mainTask in unit.mainTasks" :key="mainTask.taskId">
                      <td>{{ mainTask.taskId }}</td>
                      <td>{{ mainTask.phaseName }}</td>
                      <td>{{ mainTask.statusName }}</td>
                      <td>{{ mainTask.phaseId }}</td>
                      <td>
                        <template v-if="mainTask.phaseName?.toLowerCase() != 'clear inspection'">
                          <input
                            type="date"
                            class="form-control"
                            :value="mainTask.scheduledDate"
                            :disabled="mainTask.statusId > 2"
                            @change="updateScheduleDate(unit, mainTask, $event)"
                          />
                        </template>

                        <template v-else> N/A </template>
                      </td>
                      <td>{{ mainTask.submittedAt }}</td>
                      <td>
                        <button
                          type="button"
                          :disabled="disableActionButton(mainTask, unit)"
                          :class="actionButtonClass(mainTask, unit) ? 'enabled' : 'disabled'"
                          @click="openTaskSubmission(mainTask)"
                        >
                          <i
                            v-if="
                              mainTask.statusId == TaskStatusEnum.Submitted ||
                              (mainTask.statusId == TaskStatusEnum.Ready &&
                                mainTask.phaseName == 'Clear Inspection' &&
                                unit.currentPhaseName == 'Clear Inspection')
                            "
                            class="bi bi-inbox text-danger"
                          ></i>
                          <i v-else class="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="unit.expanded" class="subtasks unit-tasks">
                <h6 class="text-light">Subtasks</h6>
                <table>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Phase</th>
                      <th>Submitted</th>
                      <th>Parent Task ID</th>
                      <th>Worker</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody v-if="unit.subtasks.length > 0">
                    <tr v-for="subtask in unit.subtasks" :key="subtask.taskId">
                      <td>{{ subtask.taskId }}</td>
                      <td>{{ subtask.taskTypeName }}</td>
                      <td>{{ subtask.statusName }}</td>
                      <td>{{ subtask.phaseName }}</td>
                      <td>{{ subtask.submittedAt }}</td>
                      <td>{{ subtask.parentTaskId }}</td>
                      <td>{{ subtask.assignedWorkerName }}</td>
                      <td>
                        <button
                          v-if="subtask.statusId < 3"
                          class="enabled"
                          type="button"
                          @click="openTaskSubmission(subtask)"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button
                          v-else
                          class="enabled"
                          type="button"
                          @click="openTaskSubmission(subtask)"
                        >
                          <i
                            v-if="subtask.statusName == 'Submitted'"
                            class="bi bi-inbox text-danger"
                          ></i>
                          <i v-else class="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tbody v-else>
                    <tr>
                      <td class="text-danger">No subtask found</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <div class="add-subtask form-group d-flex justify-content-end py-2">
                  <button
                    class="add-subtask-btn"
                    :disabled="unit.mainTasks?.length == 0"
                    @click="openSubtaskModal(unit.id, unit)"
                  >
                    <i class="bi bi-plus-circle"></i>
                    ADD SUBTASK
                  </button>
                </div>
              </div>
              <div v-if="route.query.mode == 'edit'" class="edit-task col-md-4">
                <h5>Update Details</h5>
                <div v-if="taskDetails.images != null" class="images">
                  <div
                    v-for="image in taskDetails.images"
                    :key="image.uploadId"
                    class="image-container"
                  >
                    <img
                      class="mx-2"
                      :src="image.thumbnailUrl"
                      alt="Thumbnail"
                      width="100"
                      @error="handleImageError"
                    />
                    <button @click="removeImage(image)">
                      <i class="bi bi-trash"></i>
                      Remove
                    </button>
                  </div>
                </div>
                <small v-else class="text-danger">No image uploaded</small>
                <div class="form-group my-3">
                  <label class="text-muted">Upload Images</label>
                  <FileUpload
                    id="task-details-image-upload"
                    :submissiontype-id="3"
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
                  <button class="btn btn-success" @click="submitUpdate">Submit</button>
                </div>
              </div>
            </div>
          </div>
          <hr />
        </div>
      </div>
    </div>
  </div>
  <div ref="addSubtaskModalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header flex-column align-items-start">
          <div class="w-100 d-flex justify-content-between align-items-center mb-2">
            <h5 class="modal-title m-0">ADD SUBTASK</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="unit-details">
            <div class="unit-detail-row">
              <span class="unit-detail-label">Project Scope Name: </span>
              <span class="unit-detail-value">{{
                currentUnitForSubtask?.projectScopeTypeName
              }}</span>
            </div>
            <div class="unit-detail-row">
              <span class="unit-detail-label">Building: </span>
              <span class="unit-detail-value">{{ currentUnitForSubtask?.building }}</span>
              <span class="unit-detail-label ms-3">Level: </span>
              <span class="unit-detail-value">{{ currentUnitForSubtask?.level }}</span>
              <span class="unit-detail-label ms-3">Unit: </span>
              <span class="unit-detail-value">{{ currentUnitForSubtask?.unit }}</span>
              <span class="unit-detail-label ms-3">Unit Type: </span>
              <span class="unit-detail-value">{{ currentUnitForSubtask?.unitType }}</span>
            </div>
          </div>
        </div>
        <div class="modal-body">
          <div class="form-group my-2">
            <label class="text-muted">* Task Types</label>
            <select v-model="selectedSubTaskType" class="form-control">
              <option value="0">Select</option>
              <option v-for="taskType in subTaskTypes" :key="taskType.id" :value="taskType.id">
                {{ taskType.typeName }}
              </option>
            </select>
          </div>
          <div class="form-group my-2">
            <label class="text-muted">* Assigned Worker</label>
            <select v-model="subtaskAssignedWorker" class="form-control">
              <option value="0">Select</option>
              <option v-for="worker in activeWorkers" :key="worker.id" :value="worker.id">
                {{ worker.workerName }}
              </option>
            </select>
          </div>
          <div class="form-group my-2">
            <label class="text-muted">* Select Phase</label>
            <select v-model="phaseIdForSubtask" class="form-control">
              <option value="0">Select</option>
              <option v-for="phase in subtaskPhaseOptions" :key="phase.id" :value="phase.id">
                {{ phase.phaseName }}
              </option>
            </select>
          </div>
          <div class="form-group my-2">
            <label class="text-muted">* Task Details</label>
            <textarea v-model="subtaskTaskDetails" class="form-control" rows="2"></textarea>
          </div>
          <div class="form-group my-2">
            <label class="text-muted">* Image Details</label>
            <FileUpload
              id="task-requirements-image-upload"
              :submission-type-id="ImageSubmissionTypeEnum.TaskRequirements"
              :submission-location="'field_tracker.unit_tasks'"
              :submission-id="subtaskSubmissionId"
              @upload-success="subtaskUploadSuccess"
              @has-changed="subtaskChangedFile"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!isSubtaskFormValid"
            @click="submitSubTask"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
  <div ref="assignWorkerModalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">ASSIGN WORKER</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="closeAssignWorkerModal"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="dropdownSelect">* Worker</label>
            <select v-model="selectedAssignedWorkerId" class="form-control">
              <option value="0">Unassigned</option>
              <option v-for="worker in workersNeeded" :key="worker.id" :value="worker.id">
                {{ worker.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeAssignWorkerModal">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="assignWorkerBulk">Assign</button>
        </div>
      </div>
    </div>
  </div>
  <div ref="completionDateModalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">SET COMPLETION DATE</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="closeCompletionDateModal"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="dropdownSelect">* Completion Date</label>
            <input v-model="selectedCompletionDate" type="date" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeCompletionDateModal">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="completionDateBulk">Set</button>
        </div>
      </div>
    </div>
  </div>
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
  />
</template>

<style scoped>
  .bulk-actions {
    width: 90vw;
    max-width: 450px;
    min-width: 325px;
    margin: 1.5rem 0 1.5rem 2rem;
    padding: 1rem 1rem 0 1rem;
    border-top: 2px solid #256b6f;
    border-bottom: 2px solid #256b6f;
    color: #256b6f;
  }
  .bulk-actions .section {
    padding: 0.6rem 0;
    border-bottom: 1px solid #256b6f;
    display: flex;
    align-items: center;
  }
  .bulk-actions .section:last-child {
    border-bottom: none;
  }
  .bulk-actions .section h6 {
    margin-bottom: 0;
    color: #19a7af;
  }
  .bulk-actions .section .buttons {
    margin-left: 0.5rem;
  }
  .bulk-actions .section .buttons button {
    margin: 0 0.3rem;
    border: none;
    outline: none;
    background: #19a7af;
    color: #ebebeb;
    padding: 0.2rem 0.8rem;
    border-radius: 3px;
  }
  .unit-count {
    margin: 1.5rem 0 0 2rem;
    display: flex;
    justify-content: space-between;
    width: 90vw;
    max-width: 600px;
    min-width: 325px;
  }
  .unit-count .counter {
    color: #19a7af;
  }
  .unit-count .counter h6 {
    font-weight: bolder;
  }
  .unit-count .counter h6 span {
    font-weight: lighter;
  }
  .unit-preset {
    margin: 1.5rem 0 0 2rem;
    width: 90vw;
    max-width: 630px;
    min-width: 325px;
  }
  .unit-preset button {
    background: transparent;
    outline: none;
    border: none;
  }
  .unit-preset .filters {
    width: 80vw;
    max-width: 600px;
    min-width: 350px;
    margin: 1rem 1rem 0 2rem;
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 3px;
  }
  .unit-preset .filters h6 {
    color: #000;
  }
  .unit-preset .filters button {
    background: transparent;
    outline: none;
    border: none;
    color: #19a7af;
  }
  .unit-preset .filters .checklist {
    margin: 0.5rem 0 1rem 0;
  }
  .unit-preset .filters .checklist .item {
    margin-right: 1rem;
    display: flex;
  }
  .unit-preset .filters .checklist .item label {
    color: #858585;
    margin-left: -0.5rem;
    cursor: pointer;
  }
  .select-visible {
    background: transparent;
    color: #19a7af;
    outline: none;
    border: none;
    margin-left: 0.5rem;
  }
  .unit-search {
    margin: 2rem 0 0 2rem;
  }
  .unit-search label {
    margin-bottom: 0.5rem;
  }
  .unit-search input {
    border: 1px solid #bcbcbc;
    border-radius: 4px;
    padding: 0.3rem 1.5rem 0.3rem 1rem;
    outline: none;
  }
  .blocking-issues {
    font-size: 0.75rem;
    line-height: 1.2;
    margin-bottom: -0.25rem;
  }
  .unit-tasks {
    width: 100%;
    background: #19a7af;
    margin-top: 2px;
  }
  .unit-tasks h6 {
    padding: 0.5rem 1rem 0.1rem 1rem;
  }
  .unit-tasks table {
    width: 100%;
  }
  .unit-tasks thead {
    background: #f9f9f9;
  }
  .unit-tasks thead tr th {
    color: #212121;
    font-weight: bold;
    text-align: center;
  }
  .unit-tasks tbody {
    background: #fff;
  }
  .unit-tasks tbody tr td {
    text-align: center;
    color: #212121;
    padding: 0.3rem 1.5rem;
  }
  .unit-tasks tbody tr td button {
    background: transparent;
    border: none;
    outline: none;
  }
  .unit-tasks tbody tr td button.enabled i {
    color: #19a7af;
  }
  .unit-tasks tbody tr td button.disabled i {
    color: #d3d3d3;
  }
  input[type='date'].form-control {
    width: 115px;
    min-width: 115px;
    max-width: 115px;
  }
  .assignment {
    color: #212121;
  }
  .assignment-options {
    padding: 0.5rem 0;
    text-align: center;
  }
  .assignment-options select {
    outline: none;
    border: none;
    border-bottom: 1px solid #858585;
  }
  .role-assignment-button:disabled {
    color: #d3d3d3 !important;
  }
  .role-assignments {
    width: 100%;
    background: #19a7af;
    margin-top: 2px;
  }
  .role-assignments .role-assignment strong {
    color: #19a7af;
  }
  .role-assignments .role-assignment .assignment-container {
    padding-left: 24px;
  }
  .role-assignments h6 {
    padding: 0.5rem 1rem 0.1rem 1rem;
  }
  .role-assignments ul {
    padding: 0;
    margin: 0;
  }
  .role-assignments ul li {
    width: 100%;
    display: flex;
    background: #fff;
    border-bottom: 1px solid #858585;
    padding: 0.5rem 1rem;
    justify-content: space-between;
  }
  .role-assignments ul li:last-child {
    border-bottom: none;
  }
  .role-assignments ul li .unassigned {
    color: #efa5ad;
  }
  .role-assignments ul li button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }
  .role-assignments ul li button.add-wroker {
    margin-left: 24px;
    background-color: #19a7af;
    color: #ededed;
    width: 100px;
    border-radius: 3px;
    height: 32px;
    margin-top: 16px;
  }
  .role-assignments ul li button.add-wroker i {
    color: #ededed;
  }
  .drop-button {
    width: 100%;
    border: none;
    outline: none;
    padding: 0.4rem 0;
    background: #ddf2f3;
    color: #3eb5bc;
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
  .edit-issue {
    background: transparent;
    color: #19a7af;
    outline: none;
    border: none;
    padding: 0;
    margin-left: 1rem;
  }
  .add-issue {
    background: transparent;
    color: #19a7af;
    outline: none;
    border: none;
    display: block;
    padding: 7px 0;
    font-size: 12px;
  }
  .unit {
    padding: 1rem 1rem 1rem 2rem;
    display: flex;
  }
  .unit-tasks tbody tr,
  .unit-tasks thead tr {
    :is(td),
    th,
    .form-control {
      font-size: 0.8rem;
    }
    .form-control {
      width: 83px;
    }
  }
  .units .unit-data p {
    padding: 0;
    margin: 0;
    color: #000;
  }
  .units .unit-data .role-assignments {
    font-size: 0.9rem;
  }
  .action-needed {
    max-width: 800px;
    min-width: 325px;
  }
  .units .unit-data p span {
    font-weight: bold;
  }
  .units hr:last-child {
    display: none;
  }
  .phases {
    margin-top: 1rem;
  }
  .phases p {
    margin-top: 0.3rem;
    color: #212121;
    font-size: 0.85rem;
  }
  .phases .caught-up {
    padding-left: 1rem;
  }
  .phases p span {
    color: #dc3545;
    padding-left: 1rem;
    font-weight: bold;
  }
  .expand-button {
    background: transparent;
    outline: none;
    border: none;
    font-size: 1rem;
    color: #dc3545;
  }
  .action-box {
    background: #fff8f8;
    border-radius: 3px;
    padding: 0.5rem;
  }
  .action-box h6 {
    color: #212121;
    list-style: none;
    padding-left: 1rem;
  }
  .action-box .hours-needing-review {
    padding: 0 1rem;
    margin: 0;
  }
  .action-box .hours-needing-review li {
    color: #212121;
    list-style: none;
  }
  .action-box .hours-needing-review li span {
    color: #dc3545;
    font-weight: bold;
  }
  .action-box .review-hours-btn {
    color: #fff;
    background: #19a7af;
    padding: 0.1rem 1.2rem;
    border-radius: 3px;
    border: none;
    outline: none;
    margin-top: 0.5rem;
    margin-left: 1rem;
  }
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }

  .ft-project-viewer {
    overflow-y: auto; /* Enables vertical scrolling if content overflows */
    height: 100vh; /* Optional: Adjust if you want a specific height */
    margin-top: 62px;
    padding-bottom: 100px;
  }

  .sub-header-content {
    color: #19a7af;
    padding: 10px 30px;
  }

  .btn-new-project {
    background: none;
    border: none;
    color: #19a7af;
    cursor: pointer;
    padding-left: 5px;
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
    width: 100vw;
    padding: 10px 30px;
    min-width: 350px;
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

  i {
    margin-right: 5px;
    color: #7a7a7a;
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

  .add-subtask {
    border-top: 4px solid #c1c1c1;
    background-color: white;
  }

  .add-subtask-btn {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }

  .add-subtask-btn:disabled {
    color: #abe9ec;
  }

  .mb-3 {
    margin-bottom: 4px !important;
  }

  .modal-title {
    color: #19a7af;
  }

  .modal label {
    color: #3c3c3c;
    padding-bottom: 8px;
  }

  .modal .row {
    padding-bottom: 15px;
  }

  .unit-details .unit-detail-row span {
    font-size: 13px;
  }

  .unit-details .unit-detail-row .unit-detail-label {
    font-weight: 600;
    color: #3c3c3c;
  }

  .mb-2 {
    margin-bottom: 0px !important;
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
    width: 100vw;
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

  .cursor-pointer {
    cursor: pointer;
  }
  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }

    .unit-preset,
    .unit-count {
      margin: 1.5rem 0 0 0.5rem;
    }

    .unit {
      padding: 1rem 1rem;
    }
  }

  .input-with-clear {
    position: relative;
    display: inline-block;
    max-width: 275px;
    width: 100%;
  }

  .input-with-clear input {
    width: 100%;
    padding-right: 2rem; /* space for the clear icon */
    box-sizing: border-box;
  }

  .clear-icon {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #888;
  }
  .clear-icon:hover {
    color: #000;
  }
</style>
