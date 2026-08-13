<script setup lang="ts">
  import type { ColumnDefinition, CellComponent, RowComponent } from 'tabulator-tables';
  import axios from 'axios';
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import { Modal, Tooltip } from 'bootstrap';
  import { computed, ref, onMounted, watch, watchEffect, onUnmounted, toRaw } from 'vue';
  import { useForm, useField, Field, Form } from 'vee-validate';
  import vSelect from 'vue-select';
  import * as yup from 'yup';
  import 'tabulator-tables/dist/css/tabulator_bootstrap5.min.css';
  import 'vue-select/dist/vue-select.css';
  import TopNavBar from '@/components/TopNavBar.vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useAuthStore } from '@/stores/useAuthStore';
  import FieldTrackerUpdateProjectInfoModal from '@/components/FieldTrackerUpdateProjectInfoModal.vue';
  import Breadcrumb from '@/components/Breadcrumb.vue';

  import type { BreadcrumbItem } from '@/interfaces/common';
  import type {
    CostTypeData,
    LocationTypeData,
    ProjectRowData,
    RowChanges,
    SingleRowFormValues,
    ProjectViewerTabulatorRowData as TabulatorRowData,
  } from '@/interfaces/fieldTracker';
  import type { InstallTeamData } from '@/interfaces/installTeams';
  import type { ScopeDetailCodeData } from '@/interfaces/scope';
  import type { VSelectDropdownData } from '@/interfaces/common';
  import { ScopeTypeEnum } from '@/enum';
  import type { EnhancedFormValues } from '@/interfaces/fieldTracker/enhancedFormValues';
  import {
    CostTypeDataDto,
    FieldTrackerServiceProxy,
    FormattedProjectRowDto,
    LocationTypeDataDto,
    ScopeTypeDto,
    ScopeDetailDto,
    InstallTeamProjectScopeTypeDto,
    CreateNewProjectRowDto,
    ProjectRowChangesDto,
    ProjectRowUpdateDto,
    ProjectRowCreateDto,
  } from '@/shared/service-proxies/service-proxies';
  import { notificationService } from '@/services/notificationService';
  import type { NotificationMessage } from '@/interfaces/notification/notificationMessage';
  import { NotificationEventTypeEnum } from '@/enum/notification/notificationEventTypeEnum';
  import { NotificationType } from '@/enum/notification/notificationType';

  declare module 'tabulator-tables' {
    interface Options {
      // Add your custom properties here, for example:
      selectableRange?: boolean;
      selectableRangeColumns?: boolean;
      selectableRowsRangeMode?: 'click' | 'drag';
      selectableRows?: boolean;
      selectableRowsPersistence?: boolean;
      rowHeight?: number;
    }
  }

  // Initialize variables
  const authStore = useAuthStore();

  // Role-based access control Properties
  const isInstallManagerOrAbove = computed(
    () =>
      authStore.hasInstallManagerRole ||
      authStore.hasProjectManagerRole ||
      authStore.hasControlsManagerRole ||
      authStore.hasAdminRole ||
      authStore.hasEstimatorRole ||
      authStore.hasInstallDirectorRole
  );
  const isProjectManagerOrAbove = computed(
    () =>
      authStore.hasProjectManagerRole ||
      authStore.hasControlsManagerRole ||
      authStore.hasAdminRole ||
      authStore.hasEstimatorRole ||
      authStore.hasInstallDirectorRole
  );
  const isControlsManagerOrAbove = computed(
    () =>
      authStore.hasControlsManagerRole || authStore.hasAdminRole || authStore.hasInstallDirectorRole
  );
  const isAdmin = computed(() => authStore.hasAdminRole);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const router = useRouter();
  const route = useRoute();
  const allowedRowUpdateProperties = [
    'rowId',
    'building',
    'level',
    'area',
    'shipPhase',
    'buildPhase',
    'scheme',
    'unit',
    'unitType',
    'description',
    'scopeTypeId',
    'scopeDetailCodeId',
    'locationTypeId',
    'costTypeId',
    'quantity',
    'installTeamId',
    'startingDate',
    'finishDate',
    'percentComplete',
    'actualManHours',
    'clearInspectionComplete',
    'clearInspectionPassed',
    'clearInspectionDate',
    'updatedAt',
    'updatedBy',
  ];
  let changesTrackerFTProjectViewer: { [rowId: number]: Partial<RowChanges> } = {};
  let deselectedRowData: any | null = null;
  let selectedRowData: any | null = null;
  let lastFocusedRow: RowComponent | null = null;
  let isCellEditing = false;
  let addRowModalInstance: Modal | null = null;
  let pasteModalInstance: Modal | null = null;
  // let editProjectInfoModalInstance: Modal | null = null;

  // Computed properties
  const mode = ref(route.params.mode);
  const isLoading = ref(false);
  const hasBulkTransaction = ref(0);
  const hasApiError = ref(false);
  const apiErrorMessage = ref<string>('');
  const userRoleString = ref<string>('');
  const userId = ref<number | null>(0);
  const actualProjectData = ref<any>({});
  const cellEdited = ref<any>([]);
  // Current project info data
  const storedFtProjectId = ref<number | undefined>();
  const storedRootProjectId = ref<number | undefined>();
  const storedProjectName = ref<string | undefined>();
  const storedSalesforceId = ref<string | undefined>();
  const storedProjectManagerName = ref<string | undefined>();
  const storedProjectManagerId = ref<number | undefined>();
  const storedInstallManagerName = ref<string | undefined>();
  const storedInstallManagerId = ref<number | undefined>();
  const storedStateCode = ref<string | undefined>();
  const storedStateId = ref<number | undefined>();
  const storedSiteLocation = ref<string | null>(null);
  const storedExpectedStartDate = ref<string | null>(null);
  // // Computed properties continued
  const projectRowsList = ref<ProjectRowData[]>([]);
  const scopeTypeList = ref<ScopeTypeDto[]>([]);
  const installTeamsList = ref<InstallTeamData[]>([]);
  const scopeDetailsCodeList = ref<ScopeDetailCodeData[]>([]);
  const vSelectScopeTypesList = ref<VSelectDropdownData[]>([]);
  const vSelectInstallTeamsList = ref<VSelectDropdownData[]>([]);
  const vSelectDetailCodesList = ref<VSelectDropdownData[]>([]);
  const locationTypeList = ref<LocationTypeDataDto[]>([]);
  const vSelectLocationTypesList = ref<VSelectDropdownData[]>([]);
  const costTypeList = ref<CostTypeData[]>([]);
  const vSelectCostTypesList = ref<VSelectDropdownData[]>([]);
  const pasteModalRef = ref<HTMLElement | null>(null);
  const showToast = ref(false);
  const toastMessage = ref('');

  const ihiTeamEnabled = ref<InstallTeamProjectScopeTypeDto[]>([]);

  const showToastErr = ref(false);
  const toastErrMessage = ref('');
  const showUpdateProjectInfoModal = ref(false);

  const isAddRowModalOpen = ref(false);
  const pastedData = ref('');
  const inspectionsYesCount = ref(0);
  const inspectionsPassedCount = ref(0);
  const pasteMultipleRowsYesCount = ref(0);
  const pasteMultipleRowsRowCount = ref(0);
  const deleteMultipleRowsYesCount = ref(0);
  const deleteMultipleRowsRowCount = ref(0);
  const inspectionsCompleteYesPercentage = ref('');
  const inspectionsPassedPercentage = ref('');
  const projectRowsCount = ref(0);
  const filteredRowsCount = ref(0);
  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy();

  // Reactive reference to trigger updates
  const selectionUpdateTrigger = ref(0);

  // Notification handler for bulk creation progress
  const bulkCreationNotificationHandler = ref<((notification: NotificationMessage) => void) | null>(
    null
  );

  const selectedRows = computed<RowComponent[]>(() => {
    if (isTableReady.value) {
      // Trigger dependency on selectionUpdateTrigger
      selectionUpdateTrigger.value;

      return tabulator.value ? tabulator.value.getSelectedRows() : [];
    }
    return [];
  });

  // Flag to indicate if the table is ready
  let isTableReady = ref(false);

  const currentSigleRowCreateFormValues = ref<SingleRowFormValues>({
    building: '',
    level: '',
    area: '',
    shipPhase: '',
    buildPhase: '',
    scheme: '',
    unit: '',
    unitType: '',
    description: '',
    scopeTypeName: '',
    scopeTypeId: null,
    scopeDetailCodeId: null,
    locationTypeId: null,
    costTypeId: null,
    quantity: null,
    installTeamId: null,
    startingDate: '',
    finishDate: '',
    percentComplete: null,
    actualManHours: null,
    createdBy: null,
  });

  const resetSingleRowFormValues = () => {
    currentSigleRowCreateFormValues.value = {
      building: '',
      level: '',
      area: '',
      shipPhase: '',
      buildPhase: '',
      scheme: '',
      unit: '',
      unitType: '',
      description: '',
      scopeTypeName: '',
      scopeTypeId: null,
      scopeDetailCodeId: null,
      locationTypeId: null,
      costTypeId: null,
      quantity: null,
      installTeamId: null,
      startingDate: '',
      finishDate: '',
      percentComplete: null,
      actualManHours: null,
      createdBy: null,
    };
  };

  // Method to delete selected rows
  const deleteSelectedRows = async () => {
    isLoading.value = true;
    hasApiError.value = false;
    deleteMultipleRowsYesCount.value = 0;
    deleteMultipleRowsRowCount.value = 0;
    const rowsToDelete = selectedRows.value; // Use the computed property

    if (rowsToDelete.length === 0) {
      console.log('No rows selected for deletion.');
      isLoading.value = false;
      return;
    }

    // Confirm with the user before deleting
    const confirmDelete = confirm(
      `Are you sure you want to delete ${rowsToDelete.length} row(s)? THIS ACTION CANNOT BE UNDONE.`
    );
    if (!confirmDelete) {
      isLoading.value = false;
      return;
    }

    rowsToDelete.forEach((row: any) => {
      if (row._row.data.clearInspectionComplete === 'Yes') {
        deleteMultipleRowsYesCount.value++;
        if (row._row.data.clearInspectionPassed === 'Yes') {
          inspectionsPassedCount.value--;
        }
      }

      deleteMultipleRowsRowCount.value++;
    });

    // Extract IDs from selected rows
    const idsToDelete = rowsToDelete.map((row) => Number(row.getData().id));

    const deleteData = {
      userId: userId.value ? userId.value : 0,
      rowIds: idsToDelete,
    };

    try {
      const result = await axios.post(`${apiBaseUrl}/api-proxy`, {
        userRoles: userRoleString.value,
        targetUrl: `${apiBaseUrl}/field-tracker/project/${route.params.id}/rows/bulk-delete`,
        targetMethodType: 'DELETE',
        data: deleteData,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      hasBulkTransaction.value = 10;
      await showBulkDeleteStatus(result.data?.transactionId);
    } catch (error) {
      console.error('Error deleting rows:', error);

      hasApiError.value = true;
      apiErrorMessage.value = 'Error deleting row(s). Please refresh the page and try again.';

      toastErrMessage.value = apiErrorMessage.value;
      showToastErr.value = true;

      // Automatically hide the toast after 5 seconds
      setTimeout(() => {
        showToastErr.value = false;
      }, 10000);

      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const showBulkDeleteStatus = async (transactionId: any) => {
    hasBulkTransaction.value = parseFloat(hasBulkTransaction.value.toFixed(2));
    hasApiError.value = false;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/field-tracker/project/transaction/${transactionId}/status?type=bulk_row_delete`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      const jobStatuses = response.data.jobStatuses;

      const allJobsCompletedOrFailed = jobStatuses.every(
        (job: any) => job.status === 'completed' || job.status === 'failed'
      );

      if (!allJobsCompletedOrFailed) {
        const completedOrFailedJobs = jobStatuses.filter(
          (job: any) => job.status === 'completed' || job.status === 'failed'
        ).length;

        const percentage = (completedOrFailedJobs / jobStatuses.length) * 100;
        hasBulkTransaction.value =
          percentage < hasBulkTransaction.value ? hasBulkTransaction.value : percentage;
        hasBulkTransaction.value = parseFloat(hasBulkTransaction.value.toFixed(2));

        setTimeout(() => {
          showBulkDeleteStatus(transactionId);
        }, 1500);
      } else {
        hasBulkTransaction.value = 0;

        window.location.reload();
      }
    } catch (error) {
      hasBulkTransaction.value = 0;
      console.error('Error fetching project rows data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error loading project rows. Please close the tool and try again.';
    }
  };

  let table: any = ref<HTMLElement | null>(null);
  let tabulator: any = ref(null);

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal !== null ? newVal : 0;
    },
    { immediate: true }
  );

  watch(
    () => mode.value,
    () => {
      // Update columns when mode changes
      updateTableColumns();
    }
  );

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  // Define a schema for single row creation form
  const singleRowCreateSchema = yup.object({
    building: yup.string().required('Building Name is required'),
    level: yup.string().required('Level is required'),
    area: yup.string().required('Area is required'),
    shipPhase: yup.string().required('Ship Phase is required'),
    buildPhase: yup.string().required('Build Phase is required'),
    scheme: yup.string().required('Scheme is required'),
    unit: yup.string().required('Unit is required'),
    unitType: yup.string().required('Unit Type is required'),
    description: yup.string(),
    scopeTypeId: yup.string().required('Scope Type is required'),
    scopeDetailCodeId: yup.number().required('Scope Detail Code is required'),
    locationTypeId: yup.number().required('Location Type is required'),
    costTypeId: yup.number().required('Cost Type is required'),
    quantity: yup
      .number()
      .required('Quantity is required')
      .transform((value, originalValue) => (String(originalValue).trim() === '' ? null : value)),
    installTeamId: yup.string().nullable(),
    startingDate: yup
      .date()
      .nullable()
      .transform((value, originalValue) => {
        return originalValue === '' || !originalValue ? null : value;
      }),
    finishDate: yup
      .date()
      .nullable()
      .transform((value, originalValue) => {
        return originalValue === '' || !originalValue ? null : value;
      }),
    percentComplete: yup
      .number()
      .nullable()
      .transform((value, originalValue) => (String(originalValue).trim() === '' ? null : value)),
    actualManHours: yup
      .number()
      .nullable()
      .transform((value, originalValue) => (String(originalValue).trim() === '' ? null : value)),
  });

  (() => {
    const storedProjectData = JSON.parse(localStorage.getItem('currentProjectInfo') || '{}');

    storedFtProjectId.value = storedProjectData.ftProjectId;
    storedRootProjectId.value = storedProjectData.rootProjectId;
    storedProjectName.value = storedProjectData.projectName;
    storedSalesforceId.value = storedProjectData.salesforceId;
    storedProjectManagerId.value = storedProjectData.projectManagerId;
    storedProjectManagerName.value = storedProjectData.projectManagerName;
    storedInstallManagerId.value = storedProjectData.installManagerId;
    storedInstallManagerName.value = storedProjectData.installManagerName;
    storedStateId.value = storedProjectData.stateId;
    storedStateCode.value = storedProjectData.stateCode;
    storedSiteLocation.value = siteLocationFormatter(storedProjectData);
    storedExpectedStartDate.value = expectedStartDateFormatter(storedProjectData.expectedStartDate);
  })();

  // Setup the single row creation form
  const {
    handleSubmit: handleSingleRowSubmit,
    meta: metaSingleRow,
    resetForm: resetSingleRowForm,
  } = useForm({
    validationSchema: singleRowCreateSchema,
    initialValues: {
      building: '',
      level: '',
      area: '',
      shipPhase: '',
      buildPhase: '',
      scheme: '',
      unit: '',
      unitType: '',
      description: '',
      scopeTypeId: '',
      scopeDetailCodeId: null,
      locationTypeId: null,
      costTypeId: null,
      quantity: null,
      installTeamId: null,
      startingDate: null,
      finishDate: null,
      percentComplete: null,
      actualManHours: null,
    },
  });

  // Define fields for single row submit form
  const { value: building, errorMessage: buildingError } = useField('building');
  const { value: level, errorMessage: levelError } = useField('level');
  const { value: area, errorMessage: areaError } = useField('area');
  const { value: shipPhase, errorMessage: shipPhaseError } = useField('shipPhase');
  const { value: buildPhase, errorMessage: buildPhaseError } = useField('buildPhase');
  const { value: scheme, errorMessage: schemeError } = useField('scheme');
  const { value: unit, errorMessage: unitError } = useField('unit');
  const { value: unitType, errorMessage: unitTypeError } = useField('unitType');
  const { value: description, errorMessage: descriptionError } = useField('description');
  const { value: scopeTypeId, errorMessage: scopeTypeIdError } = useField('scopeTypeId');
  const { value: detailCodeId, errorMessage: detailCodeError } = useField('scopeDetailCodeId');
  const { value: locationTypeId, errorMessage: locationTypeError } = useField('locationTypeId');
  const { value: costTypeId, errorMessage: costTypeError } = useField('costTypeId');
  const { value: quantity, errorMessage: quantityError } = useField('quantity');
  const { value: startingDate, errorMessage: startingDateError } = useField('startingDate');
  const { value: finishDate, errorMessage: finishDateError } = useField('finishDate');
  const { value: percentComplete, errorMessage: percentCompleteError } =
    useField('percentComplete');
  const { value: actualManHours, errorMessage: actualManHoursError } = useField('actualManHours');

  const updateSelectedRows = () => {
    // Increment trigger to update computed property
    selectionUpdateTrigger.value++;
  };

  // Computed property to check if all fields including dropdowns are valid
  const isAddSingleRowFormValid = computed(() => {
    return metaSingleRow.value.valid;
  });

  const submitSingleRowForm = async (formValues: object) => {
    if (!userId.value) {
      console.error('User ID is not set.');
      return;
    }
    // createNewProjectRow expects a single DTO object, not an array
    const postData = formValues as CreateNewProjectRowDto;

    isLoading.value = true;

    try {
      await fieldTrackerServiceProxy
        .createNewProjectRow(Number(route.params.id), postData)
        .then(async () => {
          fetchProjectRowsData();
          if (tabulator.value) {
            tabulator.value.setData(projectRowsList.value);
          }
          if (addRowModalInstance) {
            addRowModalInstance.hide();
          }
          resetSingleRowForm(); // Reset the form using the resetForm method provided by useForm
          localStorage.setItem('newRowAdded', 'true');
          scrollToBottomAndHighlight(1);
        });
    } catch (error) {
      console.error(error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error creating the new Field Tracker project row. Please try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  function resetForm() {
    window.location.reload();
  }

  const onSingleRowSubmit: any = handleSingleRowSubmit(async (values) => {
    await submitSingleRowForm({
      ...values,
      building: values.building,
      level: values.level,
      area: values.area,
      shipPhase: values.shipPhase,
      buildPhase: values.buildPhase,
      scheme: values.scheme,
      unit: values.unit,
      unitType: values.unitType,
      description: values.description,
      scopeTypeId: values.scopeTypeId,
      scopeDetailCodeId: values.scopeDetailCodeId,
      locationTypeId: values.locationTypeId,
      costTypeId: values.costTypeId,
      quantity: Number(values.quantity),
      installTeamId: values.installTeamId,
      startingDate: values.startingDate === '' ? null : values.startingDate,
      finishDate: values.finishDate === '' ? null : values.finishDate,
      percentComplete: Number(values.percentComplete),
      actualManHours: Number(values.actualManHours),
      createdBy: userId.value,
    }).then(() => {
      projectRowsCount.value++;
    });
  });

  const fetchProjectRowsData = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      fieldTrackerServiceProxy
        .getProjectRows(Number(route.params.id))
        .then(async (result: FormattedProjectRowDto[]) => {
          let reformattedProjectRowData: any = [];
          if (Array.isArray(result)) {
            reformattedProjectRowData = await Promise.all(
              result.map(async (row: ProjectRowData) => {
                return await reformatProjectRowData(row);
              })
            );
          }
          projectRowsList.value = reformattedProjectRowData;
        })
        .finally(() => {
          isLoading.value = false;
        });
    } catch (error) {
      console.error('Error fetching project rows data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error loading project rows. Please close the tool and try again.';
      isLoading.value = false;
    }
  };

  const fetchScopeTypesList = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      await fieldTrackerServiceProxy.getScopeTypes().then((result: ScopeTypeDto[]) => {
        scopeTypeList.value = result;
        vSelectScopeTypesList.value = result.map((scopeType: ScopeTypeDto) => {
          return {
            label: scopeType.scopeName,
            id: scopeType.id,
            value: scopeType.scopeName,
            description: '',
          };
        });
      });
    } catch (error) {
      console.error('Error fetching Install Teams List data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error Install Teams List. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchInstallTeamsList = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/field-tracker/install-teams/active`,
          targetMethodType: 'GET',
        },
        {
          timeout: 30000,
        }
      );

      installTeamsList.value = response.data;
      if (Array.isArray(response.data)) {
        vSelectInstallTeamsList.value = response.data.map((installTeam: InstallTeamData) => {
          return {
            label: installTeam.teamName,
            id: installTeam.id,
            value: installTeam.teamName,
            description: '',
          };
        });
      }
    } catch (error) {
      console.error('Error fetching Install Teams List data:', error);
      hasApiError.value = true;
      apiErrorMessage.value =
        'Error fetching Install Teams List. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchScopeDetailsCodeList = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      await fieldTrackerServiceProxy
        .getScopeDetailsActiveList(Number(route.params.id))
        .then((result: ScopeDetailDto[]) => {
          scopeDetailsCodeList.value = result;
          vSelectDetailCodesList.value = result.map((detailCode: ScopeDetailDto) => {
            return {
              label: detailCode.scopeDetailCode,
              id: detailCode.id,
              value: detailCode.scopeDetailCode,
              description: detailCode.scopeDetailDescription, // Description for use in search
            };
          });
        });
    } catch (error) {
      console.error('Error fetching Scope Detail Code list data:', error);
      hasApiError.value = true;
      apiErrorMessage.value =
        'Error Scope Details Codes list. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchScopeDetailCode = async (scopeDetailCode: number) => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/field-tracker/project/${route.params.id}/scope-details/${scopeDetailCode}`,
          targetMethodType: 'GET',
        },
        {
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Scope Detail Code data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error Scope Details Code. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchlocationTypeList = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      await fieldTrackerServiceProxy.getLocationTypes().then((result: LocationTypeDataDto[]) => {
        locationTypeList.value = result;
        vSelectLocationTypesList.value = result.map((locationType: LocationTypeDataDto) => {
          return {
            label: locationType.locationTypeName,
            id: locationType.id,
            value: locationType.locationTypeName,
            description: locationType.locationTypeDescription, // Description for use in search
          };
        });
      });
    } catch (error) {
      console.error('Error fetching Location Types list data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error Location Types list. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCostTypeList = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      fieldTrackerServiceProxy.getCostTypes().then((result: CostTypeDataDto[]) => {
        costTypeList.value = result;
        vSelectCostTypesList.value = result.map((costType: CostTypeDataDto) => {
          return {
            label: costType.costTypeName,
            id: costType.id,
            value: costType.costTypeName,
            description: costType.costTypeDescription, // Description for use in search
          };
        });
      });
    } catch (error) {
      console.error('Error fetching Cost Types list data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error Cost Types list. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const getIHITeamEnabled = async () => {
    try {
      await fieldTrackerServiceProxy
        .getIHIProjectScopeTypesByFieldTrackerProjectId(storedRootProjectId.value)
        .then((result: InstallTeamProjectScopeTypeDto[]) => {
          ihiTeamEnabled.value = result;
        });
    } catch (error) {
      console.log(error);
    }
  };

  // Method to call when table is built
  function onTableBuilt() {
    isTableReady.value = true;
  }

  async function reformatProjectRowData(row: ProjectRowData) {
    const scopeCode = `${row.scopeDetailCode}.${row.locationTypeName}.${row.costTypeName}`;
    const hasScopeOverride = row.scopeOverride != null;
    const hasManHoursQuantityOverride =
      hasScopeOverride && row.scopeOverride?.manHoursQuantityOverride != null;
    const defaultManHoursQuantity = row.manHoursQuantity || 0;
    const unitRate = hasManHoursQuantityOverride
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        row.scopeOverride!.manHoursQuantityOverride!
      : defaultManHoursQuantity;
    const budgetedManHours = trimTrailingZeros(
      parseFloat((row.manHoursQuantity * row.quantity).toFixed(4))
    );
    const percentComplete = row.percentComplete ? row.percentComplete / 100 : 0;

    // It may seem strange to be calculating install quantity this way, but the install managers or installers are used to calculating it this way
    // since many times it's more than just installing individual units. They could install a scope/row but not fully pass the clear inspection
    // and it could be determined that that row is only 95% done, so what they are paid will be based on that. They will have their ways of determining
    // what percentage is complete which will then populate the install quantity field. Seems a bit off, but for now, that is how they are used to dong it.
    const installedQuantity = trimTrailingZeros(
      parseFloat((percentComplete * row.quantity).toFixed(4))
    );
    const earnedManHours = trimTrailingZeros(parseFloat((unitRate * installedQuantity).toFixed(4)));

    const actualManHours = row.actualManHours ? row.actualManHours : 0;
    const productivityFactor =
      earnedManHours && actualManHours
        ? trimTrailingZeros(parseFloat((earnedManHours / actualManHours).toFixed(4)))
        : 0;

    return {
      id: row.id.toString(),
      ftProjectId: row.ftProjectId.toString(),
      building: row.building.toString(),
      level: row.level.toString(),
      area: row.area.toString(),
      shipPhase: row.shipPhase.toString(),
      buildPhase: row.buildPhase ? row.buildPhase.toString() : null,
      scheme: row.scheme.toString(),
      unit: row.unit.toString(),
      unitType: row.unitType.toString(),
      description: row.description ? row.description.toString() : '',
      scopeTypeName: row.scopeTypeName ? row.scopeTypeName.toString() : '',
      scopeTypeId: row.scopeTypeId.toString(),
      primeCode: row.primeCode.toString(),
      primeCodeDescription: row.primeCodeDescription.toString(),
      subPrimeCode: row.subPrimeCode.toString(),
      subPrimeCodeDescription: row.subPrimeCodeDescription.toString(),
      scopeDetailCodeId: row.scopeDetailCodeId.toString(),
      scopeDetailCode: row.scopeDetailCode.toString(),
      scopeDetailCodeDescription: row.scopeDetailCodeDescription.toString(),
      manHoursQuantity: row.manHoursQuantity,
      scopeCode: scopeCode.toString(),
      uomTypeId: row.uomTypeId.toString(),
      uomName: row.uomName.toString(),
      unitRate: unitRate.toString(),
      budgetedManHours: budgetedManHours.toString(),
      installedQuantity: installedQuantity.toString(),
      locationTypeId: row.locationTypeId.toString(),
      locationTypeName: row.locationTypeName.toString(),
      locationTypeDescription: row.locationTypeDescription.toString(),
      costTypeId: row.costTypeId.toString(),
      costTypeName: row.costTypeName.toString(),
      costTypeDescription: row.costTypeDescription.toString(),
      costTypeDefinition: row.costTypeDefinition.toString(),
      quantity: row.quantity,
      installTeamName: row.installTeamName ? row.installTeamName.toString() : '',
      installTeamId: row.installTeamId?.toString(),
      startingDate: row.startingDate ? reformatDate(row.startingDate) : null,
      finishDate: row.finishDate ? reformatDate(row.finishDate) : null,
      percentComplete: row.percentComplete.toString(),
      earnedManHours: earnedManHours.toString(),
      actualManHours: row.actualManHours ? row.actualManHours : '',
      productivityFactor: productivityFactor.toString(),
      clearInspectionComplete: row.clearInspectionComplete ? 'Yes' : 'No',
      clearInspectionPassed:
        row.clearInspectionPassed === undefined ? 'Pending' : row.clearInspectionPassed,
      clearInspectionDate: row.clearInspectionDate ? reformatDate(row.clearInspectionDate) : null,
      createdAt: reformatDate(row.createdAt),
      updatedAt: row.updatedAt ? reformatDate(row.updatedAt) : null,
      _isDirty: row._isDirty,
      lockedFromEditing: row.lockedFromEditing ? 'Yes' : 'No',
      unitId: row.unitId,
    } as TabulatorRowData;
  }

  async function recalculateFields(row: ProjectRowData) {
    // Recalculate the calculated fields
    row.scopeCode = `${row.scopeDetailCode}.${row.locationTypeName}.${row.costTypeName}`;
    const hasScopeOverride = row.scopeOverride !== null;
    const hasManHoursQuantityOverride =
      hasScopeOverride &&
      row.scopeOverride &&
      row.scopeOverride.manHoursQuantityOverride !== undefined;
    const defaultManHoursQuantity = row.manHoursQuantity || 0;

    const manHoursQuantity = hasManHoursQuantityOverride
      ? row.scopeOverride?.manHoursQuantityOverride || 0
      : defaultManHoursQuantity;
    row.unitRate = manHoursQuantity;
    row.budgetedManHours = trimTrailingZeros(
      parseFloat((manHoursQuantity * row.quantity).toFixed(4))
    );
    const currentPercent = row.percentComplete ? row.percentComplete / 100 : 0; // this may need to be handled differently when recalculated
    row.installedQuantity = trimTrailingZeros(
      parseFloat((currentPercent * row.quantity).toFixed(4))
    );
    row.earnedManHours = trimTrailingZeros(
      parseFloat((manHoursQuantity * row.installedQuantity).toFixed(4))
    );
    // row.actualManHours = row.actualManHours ? row.actualManHours : 0;
    row.productivityFactor = row.actualManHours
      ? trimTrailingZeros(parseFloat((row.earnedManHours / row.actualManHours).toFixed(4)))
      : 0;

    const response = await fetchScopeDetailCode(parseFloat(row.scopeDetailCode))
      .then()
      .catch((error) => {
        console.error('Error fetching updated scope details code data:', error);
        hasApiError.value = true;
        apiErrorMessage.value = 'Error fetching updated scope details code data.';
        isLoading.value = false;
      });

    const scopeDetailCodeData = response[0];
    row.uomName = scopeDetailCodeData?.uomName || '';
  }

  function trimTrailingZeros(value: number) {
    return parseFloat(value.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1'));
  }

  const reformatDate = (dateString: string) => {
    if (!dateString) {
      return '';
    }

    // Extract year, month, and day parts from the dateString
    const [year, month, day] = dateString.split('T')[0].split('-');

    return `${year}-${month}-${day}`;
  };

  function customTooltipFormatter(cell: CellComponent, formatterParams: any, _onRendered: any) {
    // Create a span element for the cell
    let span = document.createElement('span');
    span.innerHTML = cell.getValue();

    // Get row data
    const rowData = cell.getRow().getData();

    // Extract the property name from formatterParams
    const dataProperty = formatterParams.dataProperty;

    // Set a tooltip using the specified property from row data
    if (rowData && dataProperty in rowData) {
      span.setAttribute('title', rowData[dataProperty]);
    } else {
      span.setAttribute('title', 'No description available');
    }

    // Add a class for styling
    span.classList.add('custom-tooltip');

    return span;
  }

  function datePickerFormatter(
    cell: CellComponent,
    _formatterParams: unknown,
    _onRendered: unknown
  ): HTMLElement {
    let originalDateValue: string | null = cell.getValue(); // Store the original date value for possible reversion
    const container: HTMLElement = document.createElement('div');
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'MM-DD-YYYY, MM/DD/YYYY, or MM.DD.YYYY';

    const canEdit: boolean = isInstallManagerOrAbove.value && mode.value === 'edit';
    input.disabled = !canEdit;

    // Updated to return null when date is null
    function formatDateToInput(date: string | null): string | null {
      if (!date) return null;
      const [year, month, day] = date.split('-');
      return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
    }

    if (originalDateValue) {
      const formattedValue = formatDateToInput(originalDateValue);
      if (formattedValue !== null) {
        input.value = formattedValue;
      }
    }

    const picker: HTMLInputElement = document.createElement('input');
    picker.type = 'date';
    picker.style.display = 'none';

    function normalizeDateInput(value: string): string {
      return value.replace(/[/.]/g, '-');
    }

    function validateAndUpdateDate(value: string): void {
      let normalizedValue = normalizeDateInput(value);
      const parts = normalizedValue.split('-').map((part) => part.padStart(2, '0'));

      if (value.trim() === '') {
        cell.setValue(null); // Directly handle empty case
        originalDateValue = null; // Update original value
        return;
      }

      if (parts.length === 3) {
        const [month, day, year] = parts;
        const numYear = parseInt(year, 10);
        const numMonth = parseInt(month, 10);
        const numDay = parseInt(day, 10);
        if (
          !isNaN(numYear) &&
          !isNaN(numMonth) &&
          !isNaN(numDay) &&
          numYear >= 1000 &&
          numYear <= 9999 &&
          numMonth >= 1 &&
          numMonth <= 12 &&
          numDay >= 1 &&
          numDay <= 31 &&
          !isNaN(new Date(numYear, numMonth - 1, numDay).getTime())
        ) {
          cell.setValue(`${year}-${month}-${day}`); // Proper format for backend (YYYY-MM-DD with padding)
          input.value = `${month}-${day}-${year}`; // Displayed format (MM-DD-YYYY)
          originalDateValue = `${year}-${month}-${day}`; // Update original date on valid input
        } else {
          revertToOriginal();
        }
      } else {
        revertToOriginal();
      }
    }

    function revertToOriginal() {
      const formattedValue = originalDateValue ? formatDateToInput(originalDateValue) : null;
      input.value = formattedValue || ''; // Revert if invalid
      cell.setValue(originalDateValue); // Restore the original cell value if invalid input
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur(); // Causes the input to lose focus, simulating a "deselect"
        e.preventDefault(); // Prevent any default behavior that might also occur when pressing Enter
      }
    });

    input.addEventListener('focus', () => {
      input.select(); // Automatically select all text when the input receives focus
    });

    input.addEventListener('input', () => {
      // Immediate feedback but no validation
    });

    input.addEventListener('blur', () => {
      validateAndUpdateDate(input.value); // Perform full validation on losing focus
    });

    picker.addEventListener('change', () => {
      const date = new Date(picker.value);
      const formattedValue = formatDateToInput(
        `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
          .getDate()
          .toString()
          .padStart(2, '0')}`
      );
      if (formattedValue !== null) {
        input.value = formattedValue;
        validateAndUpdateDate(formattedValue);
      }
    });

    input.addEventListener('click', () => picker.click()); // Trigger the date picker when clicking the input

    container.appendChild(input);
    container.appendChild(picker);

    return container;
  }

  function clearInspectionFormatter(cell: CellComponent, _formatterParams: any, _onRendered: any) {
    // Get the value of the cell
    let value = cell.getValue();
    let color = 'darkgray'; // Default color

    // Determine display text and color based on value
    if (value === null) {
      value = 'Pending';
    } else if (value === true || value === 'Yes') {
      color = ' #198754';
      value = 'Yes';
    } else if (value === false || value === 'No') {
      color = '#DC3545';
      value = 'No';
    }

    return `<span style="color: ${color};">${value}</span>`;
  }

  function calculatedFieldFormatter(cell: CellComponent, _formatterParams: any, _onRendered: any) {
    // Obtain the cell element
    const cellEl = cell.getElement();

    // Add your custom class
    cellEl.classList.add('calculated-field');

    // Return the cell value, so the cell displays normally
    return cell.getValue();
  }

  function numberEditor(cell: CellComponent, onRendered: any, success: any, cancel: any) {
    // Create an input element
    const editor = document.createElement('input');
    editor.setAttribute('type', 'number'); // Using 'number' type to restrict input

    // Capture the original value for comparison
    const originalValue = cell.getValue();

    // Set the current cell value
    editor.value = originalValue === 0 ? '0' : originalValue;

    // Style and set up the input element (optional)
    editor.style.width = '100%';
    editor.style.boxSizing = 'border-box';

    // When the value has been set, call the success function
    onRendered(function () {
      editor.focus();
      editor.style.height = '100%';
    });

    function isValidNumber(value: string) {
      // Allow empty string to be treated as zero
      return value === '' || /^\d+(\.\d{0,4})?$/.test(value);
    }

    function onChange() {
      let newValue = editor.value.trim();

      if (newValue === '') {
        // Treat empty input as zero
        newValue = '0';
        editor.value = '0'; // Update the display to show "0"
      }

      if (isValidNumber(newValue)) {
        let numberValue = parseFloat(newValue);
        // Use toString() to ensure comparison is like-to-like
        if (numberValue.toString() !== originalValue.toString()) {
          success(numberValue.toString()); // Only call success if there's a change
        } else {
          cancel(); // No change detected, cancel the edit
        }
      } else {
        cancel(); // Invalid number, cancel the edit
      }
    }

    // Event to handle keyboard input
    editor.addEventListener('blur', onChange);
    editor.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) {
        onChange(); // Enter key
      }
      if (e.keyCode === 27) {
        cancel(); // Escape key
      }
    });

    return editor;
  }

  function percentEditor(cell: CellComponent, onRendered: any, success: any, cancel: any) {
    // Create an input element for percentage
    const editor = document.createElement('input');
    editor.setAttribute('type', 'number'); // Using 'number' type for direct numeric input
    editor.setAttribute('min', '0'); // Minimum value
    editor.setAttribute('max', '100'); // Maximum value

    // Capture the original value for comparison
    const originalValue = cell.getValue();

    // Set the current cell value
    editor.value = cell.getValue();

    // Style and set up the input element (optional adjustments as needed)
    editor.style.width = '100%';
    editor.style.boxSizing = 'border-box';

    // Auto-select the input's text on focus for easier editing
    onRendered(function () {
      editor.focus();
      editor.select(); // Select the text to easily replace it
      editor.style.height = '100%';
    });

    // Validate and process the input on change
    function onChange() {
      const value = parseFloat(editor.value);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        // Check if the value has changed from the original
        if (editor.value !== originalValue.toString()) {
          success(value.toString()); // Only call success if there's a change
        } else {
          cancel(); // No change detected, cancel the edit
        }
      } else {
        cancel(); // Cancel the edit if the value is not within the range or is invalid
      }
    }

    // Event to handle keyboard input and blur events
    editor.addEventListener('blur', onChange);
    editor.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) {
        // Enter key
        onChange();
      } else if (e.keyCode === 27) {
        // Escape key
        cancel();
      }
    });

    return editor;
  }

  function yesNoEditor(
    cell: CellComponent,
    onRendered: any,
    success: any,
    cancel: any,
    includePending: boolean
  ) {
    // Create a select box
    var editor = document.createElement('select');

    // Add options
    var options = ['Yes', 'No'];
    if (includePending) {
      options.unshift('Pending'); // Add "Pending" at the beginning
    }

    options.forEach(function (val) {
      var option = document.createElement('option');
      option.value = val;
      option.textContent = val;
      editor.appendChild(option);
    });

    // Determine and set the current value
    let currentValue = cell.getValue();

    // Convert boolean values to string equivalents
    if (typeof currentValue === 'boolean') {
      currentValue = currentValue ? 'Yes' : 'No';
    }

    // Handle null or undefined values as "Pending"
    if (currentValue === null || currentValue === undefined) {
      currentValue = 'Pending';
    }

    // Set the value on the editor
    if (options.includes(currentValue.toString())) {
      editor.value = currentValue.toString();
    } else {
      editor.value = 'Pending'; // Fallback to "Pending" if currentValue is not in options
    }

    // Set focus on the select box
    onRendered(function () {
      editor.focus();
      editor.style.height = '100%';
    });

    // When the value has been set
    editor.addEventListener('change', function () {
      let selectedValue = editor.value;
      success(selectedValue);
    });

    // If the user cancels the edit
    editor.addEventListener('blur', function () {
      cancel();
    });

    return editor;
  }

  function averageTableColumnPercentCalc(_values: any, _data: any, _calcParams: any) {
    let totalEarnedManHours = 0;
    let totalBudgetedManHours = 0;

    let tableData = tabulator.value.getRows();

    tableData.forEach((row: any) => {
      const currentRowData = row.getData();
      totalEarnedManHours += currentRowData.earnedManHours
        ? parseFloat(currentRowData.earnedManHours)
        : 0;
      totalBudgetedManHours += currentRowData.budgetedManHours
        ? parseFloat(currentRowData.budgetedManHours)
        : 0;
    });

    const percentComplete =
      totalBudgetedManHours > 0 ? (totalEarnedManHours / totalBudgetedManHours) * 100 : 0;

    return percentComplete.toFixed(2) + '%';
  }

  function averageTableColumnPercentCalcFormatter(
    cell: CellComponent,
    formatterParams: any,
    onRendered: any
  ) {
    // Get the value of the cell
    const value = cell.getValue();
    const containerSpan = document.createElement('span');

    containerSpan.innerHTML = value;
    containerSpan.style.fontWeight = 'bold';
    containerSpan.style.color = '#19A7AF';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'bi bi-info-circle';
    iconSpan.setAttribute('data-bs-toggle', 'tooltip');
    iconSpan.setAttribute(
      'title',
      'This represents the sum of Earned Man Hours divided by the sum of Budgeted Man Hours.'
    );
    iconSpan.style.marginLeft = '5px';

    // Append the icon to the container
    containerSpan.appendChild(iconSpan);

    // Use the onRendered callback to initialize the tooltip
    onRendered(function () {
      new Tooltip(iconSpan);
    });

    return containerSpan.outerHTML;
  }

  async function calculateInspectionCompleteYesPercentage() {
    const percentage = (inspectionsYesCount.value / projectRowsCount.value) * 100;
    inspectionsCompleteYesPercentage.value = percentage.toFixed(2) + '%'; // Store the calculated percentage
  }

  async function calculateInspectionPassedPercentage() {
    const percentage =
      inspectionsPassedCount.value > 0
        ? (inspectionsPassedCount.value / inspectionsYesCount.value) * 100
        : 0;
    inspectionsPassedPercentage.value = percentage.toFixed(2) + '%'; // Store the calculated percentage
  }

  function getLatestCompletedInspectionsPercentage() {
    return inspectionsCompleteYesPercentage.value;
  }

  function getLatestPassedInspectionsPercentage() {
    return inspectionsPassedPercentage.value;
  }

  function inspectionCompleteYesPercentageCalcFormatter(
    cell: CellComponent,
    formatterParams: any,
    onRendered: any
  ) {
    // Get the value of the cell
    const value = cell.getValue();
    const containerSpan = document.createElement('span');

    containerSpan.innerHTML = value;
    containerSpan.style.fontWeight = 'bold';
    containerSpan.style.color = '#19A7AF';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'bi bi-info-circle';
    iconSpan.setAttribute('data-bs-toggle', 'tooltip');
    iconSpan.setAttribute('title', 'This represents the percentage of "Yes" responses.');
    iconSpan.style.marginLeft = '5px';

    // Append the icon to the container
    containerSpan.appendChild(iconSpan);

    // Use the onRendered callback to initialize the tooltip
    onRendered(function () {
      new Tooltip(iconSpan);
    });

    return containerSpan.outerHTML;
  }

  // Function to dynamically return column definitions based on the mode
  const getTableColumns = (): ColumnDefinition[] => {
    let columns: ColumnDefinition[] = [
      // {
      //   title: 'Locked',
      //   titleFormatter: (_cell) => {
      //     return '<i class="bi bi-lock-fill" title="Locked?" style="color: #3C3C3C;"></i>';
      //   },
      //   field: 'lockedFromEditing',
      //   headerFilter: 'input',
      //   headerFilterPlaceholder: 'Filter by value',
      //   frozen: true,
      //   visible: isInstallManagerOrAbove.value,
      //   editable: false,
      //   width: 50,
      // },
      {
        title: 'Row ID',
        field: 'id',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by Row ID',
        frozen: true,
        visible: isAdmin.value,
        editable: false,
      },
      {
        title: 'Unit Scope ID',
        field: 'unitId',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by Unit ID',
        frozen: true,
        visible: isAdmin.value,
        editable: false,
      },
      {
        title: 'Building',
        field: 'building',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isInstallManagerOrAbove.value ? 'input' : undefined,
        frozen: true,
        visible: isInstallManagerOrAbove.value,
        editable: isProjectManagerOrAbove.value,
      },
      {
        title: 'Area',
        field: 'area',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isProjectManagerOrAbove.value ? 'input' : undefined,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Level',
        field: 'level',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isInstallManagerOrAbove.value ? 'input' : undefined,
        frozen: true,
        visible: isInstallManagerOrAbove.value,
        editable: isProjectManagerOrAbove.value,
      },
      {
        title: 'Unit',
        field: 'unit',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isInstallManagerOrAbove.value ? 'input' : undefined,
        frozen: true,
        visible: isInstallManagerOrAbove.value,
        editable: isProjectManagerOrAbove.value,
      },
      {
        title: 'Ship Phase',
        field: 'shipPhase',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isControlsManagerOrAbove.value ? 'input' : undefined,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Build Phase',
        field: 'buildPhase',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isProjectManagerOrAbove.value ? 'input' : undefined,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Scheme',
        field: 'scheme',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isControlsManagerOrAbove.value ? 'input' : undefined,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Unit Type',
        field: 'unitType',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isInstallManagerOrAbove.value ? 'input' : undefined,
        visible: isInstallManagerOrAbove.value,
        editable: isProjectManagerOrAbove.value,
      },
      {
        title: 'Description',
        field: 'description',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isProjectManagerOrAbove.value ? 'input' : undefined,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Scope Type',
        field: 'scopeTypeName',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: customTooltipFormatter,
        formatterParams: {
          dataProperty: 'scopeTypeName',
        },
        tooltip: function (event: any, cell: CellComponent, _onRender: any) {
          const rowData = cell.getRow().getData();
          return rowData.scopeTypeName;
        },
        editor:
          mode.value === 'edit' && isInstallManagerOrAbove.value
            ? function (cell, onRendered, success, cancel) {
                // create and style editor
                var editor = document.createElement('select');
                // populate editor with values from scopeDetailsCodeList
                scopeTypeList.value.forEach((scopeType) => {
                  var option = document.createElement('option');
                  option.value = scopeType.scopeName;
                  option.textContent = scopeType.scopeName; // what you want to show in the dropdown
                  editor.appendChild(option);
                });

                // Set initial value
                editor.value = cell.getValue();

                // set focus on the select box when the select is shown
                onRendered(function () {
                  editor.focus();
                  editor.style.height = '100%';
                });

                // when the value has been set
                editor.addEventListener('change', function () {
                  // Find the corresponding scopeDetailCodeId from the scopeDetailsCodeList
                  const selectedScopeTypeId = scopeTypeList.value.find(
                    (dc) => dc.scopeName === editor.value
                  );
                  if (selectedScopeTypeId) {
                    // Pass both the new value and the corresponding ID to the success function
                    success(editor.value);
                  } else {
                    cancel(null);
                  }
                });

                // if the user cancels the edit, reset the value
                editor.addEventListener('blur', function () {
                  cancel(null);
                });

                return editor;
              }
            : undefined,
        editorParams: {
          values: Array.isArray(scopeTypeList.value)
            ? scopeTypeList.value.map((scopeType) => ({
                label: scopeType.scopeName,
                value: scopeType.scopeName,
                description: scopeType.scopeName, // Description for use in search
              }))
            : [],
          clearable: true,
          itemFormatter: (label: any, value: any, item: any) => {
            return `<strong>${label}</strong><br/><div>${item.description || ''}</div>`;
          },
          elementAttributes: {
            maxlength: '10',
          },
          sort: 'asc',
          maxWidth: true,
          placeholderLoading: 'Loading List...',
          autocomplete: true,
          filterDelay: 100,
          allowEmpty: true,
          listOnEmpty: true,
        },
        visible: isInstallManagerOrAbove.value,
        editable: isProjectManagerOrAbove.value,
      },
      {
        title: 'Detail Code',
        field: 'scopeDetailCode',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: customTooltipFormatter,
        formatterParams: {
          dataProperty: 'scopeDetailCodeDescription',
        },
        tooltip: function (event: any, cell: CellComponent, _onRender: any) {
          const rowData = cell.getRow().getData();
          return rowData.scopeDetailCodeDescription;
        },
        editor:
          mode.value === 'edit' && isControlsManagerOrAbove.value
            ? function (cell, onRendered, success, cancel) {
                // create and style editor
                var editor = document.createElement('select');
                // populate editor with values from scopeDetailsCodeList
                scopeDetailsCodeList.value.forEach((detailCode) => {
                  var option = document.createElement('option');
                  option.value = detailCode.scopeDetailCode;
                  option.textContent = detailCode.scopeDetailCode; // what you want to show in the dropdown
                  editor.appendChild(option);
                });

                // Set initial value
                editor.value = cell.getValue();

                // set focus on the select box when the select is shown
                onRendered(function () {
                  editor.focus();
                  editor.style.height = '100%';
                });

                // when the value has been set
                editor.addEventListener('change', function () {
                  // Find the corresponding scopeDetailCodeId from the scopeDetailsCodeList
                  const selectedDetailCode = scopeDetailsCodeList.value.find(
                    (dc) => dc.scopeDetailCode === editor.value
                  );
                  if (selectedDetailCode) {
                    // Pass both the new value and the corresponding ID to the success function
                    success(editor.value);
                  } else {
                    cancel(null);
                  }
                });

                // if the user cancels the edit, reset the value
                editor.addEventListener('blur', function () {
                  cancel(null);
                });

                return editor;
              }
            : undefined,
        editorParams: {
          values: Array.isArray(scopeDetailsCodeList.value)
            ? scopeDetailsCodeList.value.map((detailCode: ScopeDetailCodeData) => ({
                label: detailCode.scopeDetailCode,
                value: detailCode.scopeDetailCode,
                description: detailCode.scopeDetailDescription, // Description for use in search
              }))
            : [],
          clearable: true,
          itemFormatter: (label: any, value: any, item: any) => {
            return `<strong>${label}</strong><br/><div>${item.description || ''}</div>`;
          },
          elementAttributes: {
            maxlength: '10',
          },
          sort: 'asc',
          maxWidth: true,
          placeholderLoading: 'Loading List...',
          autocomplete: true,
          filterDelay: 100,
          allowEmpty: false,
          listOnEmpty: true,
        },
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Location Type',
        field: 'locationTypeName',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: customTooltipFormatter,
        formatterParams: {
          dataProperty: 'locationTypeDescription',
        },
        tooltip: function (event: any, cell: CellComponent, _onRender: any) {
          const rowData = cell.getRow().getData();
          return rowData.locationTypeDescription;
        },
        editor:
          mode.value === 'edit' && isProjectManagerOrAbove.value
            ? function (cell, onRendered, success, cancel) {
                // Create and style select
                var editor = document.createElement('select');

                // Populate the select with the locationTypeList
                locationTypeList.value.forEach((locationType) => {
                  var option = document.createElement('option');
                  option.value = locationType.locationTypeName; // the text to show in the dropdown
                  option.textContent = locationType.locationTypeName; // the value to set on the cell
                  editor.appendChild(option);
                });

                // Set the current value
                editor.value = cell.getValue();

                // Set focus on the select box when shown
                onRendered(function () {
                  editor.focus();
                  editor.style.height = '100%';
                });

                // when the value has been set
                editor.addEventListener('change', function () {
                  // Find the corresponding locationTypeId from the locationTypesList
                  const selectedLocationTypeCode = locationTypeList.value.find(
                    (lt) => lt.locationTypeName === editor.value
                  );
                  if (selectedLocationTypeCode) {
                    // Pass both the new value and the corresponding ID to the success function
                    success(editor.value);
                  } else {
                    cancel(null);
                  }
                });

                // If the user cancels the edit, reset the value
                editor.addEventListener('blur', function () {
                  cancel(null);
                });

                return editor;
              }
            : undefined,
        editorParams: {
          values: Array.isArray(locationTypeList.value)
            ? locationTypeList.value.map((locationType: LocationTypeData) => ({
                label: locationType.locationTypeName,
                value: locationType.locationTypeName,
                description: locationType.locationTypeDescription, // Description for use in search
              }))
            : [],
          clearable: true,
          itemFormatter: (label: any, value: any, item: any) => {
            return `<strong>${label}</strong><br/><div>${item.description || ''}</div>`;
          },
          elementAttributes: {
            maxlength: '10',
          },
          sort: 'asc',
          maxWidth: true,
          placeholderLoading: 'Loading List...',
          autocomplete: true,
          filterDelay: 100,
          allowEmpty: false,
          listOnEmpty: true,
        },
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Cost Type',
        field: 'costTypeName',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: customTooltipFormatter,
        formatterParams: {
          dataProperty: 'costTypeDescription',
        },
        tooltip: function (event: any, cell: CellComponent, _onRender: any) {
          const rowData = cell.getRow().getData();
          return rowData.costTypeDescription;
        },
        editor:
          mode.value === 'edit' && isControlsManagerOrAbove.value
            ? function (cell, onRendered, success, cancel) {
                // Create and style select
                var editor = document.createElement('select');

                // Populate the select with the costTypeList
                costTypeList.value.forEach((costType) => {
                  var option = document.createElement('option');
                  option.value = costType.costTypeName; // the text to show in the dropdown
                  option.textContent = costType.costTypeName; // the value to set on the cell
                  editor.appendChild(option);
                });

                // Set the current value
                editor.value = cell.getValue();

                // Set focus on the select box when shown
                onRendered(function () {
                  editor.focus();
                  editor.style.height = '100%';
                });

                // when the value has been set
                editor.addEventListener('change', function () {
                  // Find the corresponding costTypeId from the CostTypesList
                  const selectedCostTypeCode = costTypeList.value.find(
                    (lt) => lt.costTypeName === editor.value
                  );
                  if (selectedCostTypeCode) {
                    // Pass both the new value and the corresponding ID to the success function
                    success(editor.value);
                  } else {
                    cancel(null);
                  }
                });

                // If the user cancels the edit, reset the value
                editor.addEventListener('blur', function () {
                  cancel(null);
                });

                return editor;
              }
            : undefined,
        editorParams: {
          values: Array.isArray(costTypeList.value)
            ? costTypeList.value.map((costType: CostTypeData) => ({
                label: costType.costTypeName,
                value: costType.costTypeName,
                description: costType.costTypeDescription, // Description for use in search
              }))
            : [],
          clearable: true,
          itemFormatter: (label: any, value: any, item: any) => {
            return `<strong>${label}</strong><br/><div>${item.description || ''}</div>`;
          },
          elementAttributes: {
            maxlength: '10',
          },
          sort: 'asc',
          maxWidth: true,
          placeholderLoading: 'Loading List...',
          autocomplete: true,
          filterDelay: 100,
          allowEmpty: false,
          listOnEmpty: true,
        },
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Scope Code',
        field: 'scopeCode',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        width: 40,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'UOM',
        field: 'uomName',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        width: 40,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
    ];

    if (isControlsManagerOrAbove.value) {
      columns.push(
        {
          title: 'Unit Rate',
          field: 'unitRate',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by value',
          formatter: calculatedFieldFormatter,
          width: 40,
          visible: isControlsManagerOrAbove.value,
          // editable: function (cell) {
          //   const rowData = cell.getRow().getData();
          //   return rowData.lockedFromEditing != 'Yes';
          // },
        },
        {
          title: 'Budgeted Man Hours',
          field: 'budgetedManHours',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by value',
          formatter: calculatedFieldFormatter,
          width: 40,
          visible: isControlsManagerOrAbove.value,
          // editable: function (cell) {
          //   const rowData = cell.getRow().getData();
          //   return rowData.lockedFromEditing != 'Yes';
          // },
        }
      );
    }

    columns.push(
      {
        title: 'Quantity',
        field: 'quantity',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isControlsManagerOrAbove.value ? numberEditor : undefined,
        visible: isInstallManagerOrAbove.value,
        editable: isProjectManagerOrAbove.value,
      },
      {
        title: 'Install Team',
        field: 'installTeamName',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: customTooltipFormatter,
        formatterParams: {
          dataProperty: 'installTeamName',
        },
        tooltip: function (event: any, cell: CellComponent, _onRender: any) {
          const rowData = cell.getRow().getData();
          return rowData.installTeamName;
        },
        editor:
          mode.value === 'edit' && isControlsManagerOrAbove.value
            ? function (cell, onRendered, success, cancel) {
                const rowData = cell.getRow().getData();
                const scopeTypeId = Number(rowData.scopeTypeId);

                const ihiScopeTypes = [
                  ScopeTypeEnum.ResidentialInteriorPrehungDoors,
                  ScopeTypeEnum.CommercialDoors,
                  ScopeTypeEnum.CommercialDoorHardware,
                  ScopeTypeEnum.ResidentialExteriorPrehungDoors,
                  ScopeTypeEnum.RoughInDoorFrames,
                  ScopeTypeEnum.PresetCommercialDoors,
                  ScopeTypeEnum.InteriorDoorHardware,
                ];

                const isIhiScope = ihiScopeTypes.includes(scopeTypeId);

                let filteredInstallTeams: InstallTeamData[] = [];

                if (isIhiScope) {
                  // Show only team with teamName = 'IHI Team'
                  filteredInstallTeams = installTeamsList.value.filter(
                    (team) => team.teamName === 'IHI Team'
                  );
                } else {
                  filteredInstallTeams = installTeamsList.value.filter(
                    (team) => team.teamName !== 'IHI Team'
                  );
                }

                // create and style editor
                var editor = document.createElement('select');

                const optionNull = document.createElement('option');
                optionNull.value = 'Unassigned';
                optionNull.textContent = 'Unassigned';
                editor.appendChild(optionNull);

                // populate editor with filtered values
                filteredInstallTeams.forEach((installTeam) => {
                  var option = document.createElement('option');
                  option.value = installTeam.teamName;
                  option.textContent = installTeam.teamName; // what you want to show in the dropdown
                  editor.appendChild(option);
                });

                // Set initial value
                editor.value = cell.getValue();

                // set focus on the select box when the select is shown
                onRendered(function () {
                  editor.focus();
                  editor.style.height = '100%';
                });

                // when the value has been set
                editor.addEventListener('change', function () {
                  // Find the corresponding team from the filtered teams list
                  const selectedInstallTeamId = filteredInstallTeams.find(
                    (it) => it.teamName === editor.value
                  );
                  if (selectedInstallTeamId) {
                    // Pass both the new value and the corresponding ID to the success function
                    success(editor.value);
                  } else {
                    if (editor.value == 'Unassigned') {
                      success('');
                    } else {
                      cancel(null);
                    }
                  }
                });

                // if the user cancels the edit, reset the value
                editor.addEventListener('blur', function () {
                  cancel(null);
                });

                return editor;
              }
            : undefined,
        editorParams: {
          values: installTeamsList.value.map((installTeam: InstallTeamData) => {
            return {
              label: installTeam.teamName,
              value: installTeam.teamName,
              description: installTeam.teamName, // Description for use in search
            };
          }),
          clearable: true,
          itemFormatter: (label: any, value: any, item: any) => {
            return `<strong>${label}</strong><br/><div>${item.description || ''}</div>`;
          },
          elementAttributes: {
            maxlength: '10',
          },
          sort: 'asc',
          maxWidth: true,
          placeholderLoading: 'Loading List...',
          autocomplete: true,
          filterDelay: 100,
          allowEmpty: true,
          listOnEmpty: true,
        },
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Start Date',
        field: 'startingDate',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by date',
        formatter: function (cell) {
          const rowData = cell.getRow().getData();

          if (rowData.lockedFromEditing != 'Yes' || isInstallManagerOrAbove.value) {
            return datePickerFormatter(cell, undefined, undefined);
          }

          return calculatedFieldFormatter(cell, undefined, undefined);
        },
        visible: isInstallManagerOrAbove.value,
        sorter: (a: string | Date, b: string | Date) => {
          // Convert both values to Date objects explicitly
          const dateA = new Date(a);
          const dateB = new Date(b);

          // Ensure they are valid dates
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0; // Treat invalid dates as equal for sorting purposes
          }

          return dateA.getTime() - dateB.getTime();
        },
        editable: isInstallManagerOrAbove.value,
      },
      {
        title: 'Finish Date',
        field: 'finishDate',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by date',
        formatter: function (cell) {
          const rowData = cell.getRow().getData();

          if (rowData.lockedFromEditing != 'Yes' || isInstallManagerOrAbove.value) {
            return datePickerFormatter(cell, undefined, undefined);
          }

          return calculatedFieldFormatter(cell, undefined, undefined);
        },
        visible: isInstallManagerOrAbove.value,
        sorter: (a: string | Date, b: string | Date) => {
          // Convert both values to Date objects explicitly
          const dateA = new Date(a);
          const dateB = new Date(b);

          // Ensure they are valid dates
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0; // Treat invalid dates as equal for sorting purposes
          }

          return dateA.getTime() - dateB.getTime();
        },
        editable: isInstallManagerOrAbove.value,
      },
      {
        title: 'Installed Quantity',
        field: 'installedQuantity',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        width: 40,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: '% Complete',
        field: 'percentComplete',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        editor: mode.value === 'edit' && isInstallManagerOrAbove.value ? percentEditor : undefined,
        topCalc: averageTableColumnPercentCalc,
        topCalcFormatter: averageTableColumnPercentCalcFormatter,
        visible: isInstallManagerOrAbove.value,
        editable: isInstallManagerOrAbove.value,
      }
    );

    if (isControlsManagerOrAbove.value) {
      columns.push({
        title: 'Earned Man Hours',
        field: 'earnedManHours',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        width: 40,
        visible: isProjectManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      });
    }

    columns.push({
      title: 'Actual Man Hours',
      field: 'actualManHours',
      headerFilter: 'input',
      headerFilterPlaceholder: 'Filter by value',
      editor: mode.value === 'edit' && isInstallManagerOrAbove.value ? numberEditor : undefined,
      visible: isProjectManagerOrAbove.value,
      // editable: function (cell) {
      //   const rowData = cell.getRow().getData();
      //   return rowData.lockedFromEditing != 'Yes';
      // },
    });

    if (isControlsManagerOrAbove.value) {
      columns.push({
        title: 'Productivity Factor',
        field: 'productivityFactor',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        width: 40,
        visible: isControlsManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      });
    }

    columns.push(
      {
        title: 'Clear Inspection Complete?',
        field: 'clearInspectionComplete',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: clearInspectionFormatter,
        editor:
          mode.value === 'edit' && isInstallManagerOrAbove.value
            ? (cell, onRendered, success, cancel) =>
                yesNoEditor(cell, onRendered, success, cancel, false)
            : undefined,
        topCalc: (_values: any, _data: any, _calcParams: any) => {
          return getLatestCompletedInspectionsPercentage();
        },
        topCalcFormatter: inspectionCompleteYesPercentageCalcFormatter,
        visible: isInstallManagerOrAbove.value,
        sorter: (a: string | Date, b: string | Date) => {
          // Convert both values to Date objects explicitly
          const dateA = new Date(a);
          const dateB = new Date(b);

          // Ensure they are valid dates
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0; // Treat invalid dates as equal for sorting purposes
          }

          return dateA.getTime() - dateB.getTime();
        },
        editable: isInstallManagerOrAbove.value,
      },
      {
        title: 'Inspection Passed?',
        field: 'clearInspectionPassed',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: clearInspectionFormatter,
        editor:
          mode.value === 'edit' && isInstallManagerOrAbove.value
            ? function (cell, onRendered, success, cancel) {
                const rowData = cell.getRow().getData();
                if (rowData.clearInspectionComplete === 'No') {
                  console.log(
                    'Inspection is not complete. Forcing "Pending" state and disallowing editing.'
                  );
                  // If inspection is not complete, force "Pending" state and disallow editing
                  if (rowData.clearInspectionPassed !== 'Pending') {
                    cell.setValue('Pending');
                  }
                  return false; // Disables editing
                } else {
                  // Provide a dropdown editor when inspection is complete
                  return yesNoEditor(cell, onRendered, success, cancel, false); // Assuming yesNoEditor is correctly set up
                }
              }
            : undefined,
        topCalc: (_values: any, _data: any, _calcParams: any) => {
          return getLatestPassedInspectionsPercentage();
        },
        topCalcFormatter: inspectionCompleteYesPercentageCalcFormatter,
        visible: isInstallManagerOrAbove.value,
        editable: isInstallManagerOrAbove.value,
      },
      {
        title: 'Inspection Date',
        field: 'clearInspectionDate',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by date',
        formatter: function (cell) {
          const rowData = cell.getRow().getData();

          if (rowData.lockedFromEditing != 'Yes' || isControlsManagerOrAbove.value) {
            return datePickerFormatter(cell, undefined, undefined);
          }

          return calculatedFieldFormatter(cell, undefined, undefined);
        },
        visible: isInstallManagerOrAbove.value,
        editable: isInstallManagerOrAbove.value,
      },
      {
        title: 'Row Created',
        field: 'createdAt',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        visible: isControlsManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      },
      {
        title: 'Last Updated',
        field: 'updatedAt',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter by value',
        formatter: calculatedFieldFormatter,
        visible: isControlsManagerOrAbove.value,
        // editable: function (cell) {
        //   const rowData = cell.getRow().getData();
        //   return rowData.lockedFromEditing != 'Yes';
        // },
      }
    );

    return columns;
  };

  const initializeTabulator = async () => {
    // First destroy any instance of Tabulator if exists
    if (tabulator.value) {
      tabulator.value.destroy();
    }

    // Then Initialize Tabulator
    tabulator.value = new Tabulator(table.value, {
      height: `calc(72vh - 135px)`,
      rowHeight: 42,
      history: true,
      index: 'id',
      selectableRows: true,
      selectableRowsRangeMode: 'click',
      selectableRowsPersistence: false,
      data: projectRowsList.value,
      reactiveData: true,
      layout: 'fitDataTable',
      clipboard: true,
      clipboardCopyConfig: {
        columnHeaders: false,
      },
      columns: getTableColumns(),
    });

    // Event Listener for Row Selection
    tabulator.value.on('rowSelected', async function (row: RowComponent) {
      updateSelectedRows();
      // Aside from the initial click on the first row upon the component loading,
      // this event will fire after the rowDeselected event
      selectedRowData = row.getData();
      const selectedRowId = selectedRowData?.id ? selectedRowData.id : null;
      const deselectedRowId = deselectedRowData?.id ? deselectedRowData.id : null;

      if (deselectedRowData && !isCellEditing) {
        if (selectedRowId !== deselectedRowId) {
          // it was determined that a new row was selected, so check if the deselected row was dirty and save it if it was
          if (deselectedRowData?._isDirty) {
            // Row is dirty within the rowDeselected event listener. Save the changes
            await saveRowUpdateChanges()
              .then(() => {
                changesTrackerFTProjectViewer = {}; // Clear the changesTrackerFTProjectViewer after successful save
              })
              .catch((error) => {
                console.error('Error saving changes:', error);
                hasApiError.value = true;
                apiErrorMessage.value =
                  'Error saving changes. Please select a randow row and then deselect it to try again.';
                isLoading.value = false;
              });
          }
        }
      }
    });

    tabulator.value.on('tableBuilt', onTableBuilt);

    // Event Listener for Cell Edits
    tabulator.value.on('cellEdited', async function (cell: CellComponent) {
      cellEdited.value.push(cell);
      console.log('Cell Edited:', cell);
      isCellEditing = false;
      const rowData: any = cell.getRow().getData();
      const rowId = rowData.id;
      const field = cell.getField();
      let newValue = cell.getValue();

      // Convert string to a floating point number for certain fields
      if (field === 'quantity' || field === 'percentComplete' || field === 'actualManHours') {
        newValue = parseFloat(newValue);
      }

      rowData[field] = newValue; // Update the rowData with new value
      rowData._isDirty = true;

      // Initialize or update the entry for this row in changesTrackerFTProjectViewer
      if (!changesTrackerFTProjectViewer[rowId]) {
        changesTrackerFTProjectViewer[rowId] = {
          updatedAt: new Date().toISOString(),
          updatedBy: userId.value || null,
        };
      } else {
        changesTrackerFTProjectViewer[rowId].updatedAt = new Date().toISOString();
        if (
          !Object.prototype.hasOwnProperty.call(changesTrackerFTProjectViewer[rowId], 'updatedBy')
        ) {
          changesTrackerFTProjectViewer[rowId].updatedBy = userId.value || null;
        }
      }

      changesTrackerFTProjectViewer[rowId]['ftProjectId'] = route.params.id as any;

      if (field === 'scopeDetailCode') {
        // Find the corresponding scopeDetailCodeId from the scopeDetailsCodeList
        const newScopeDetail = scopeDetailsCodeList.value.find(
          (detail) => detail.scopeDetailCode === newValue
        );
        const newScopeDetailCodeId = newScopeDetail ? newScopeDetail.id : null;

        // Check if new ID was found
        if (newScopeDetailCodeId) {
          // Update the rowData with new scopeDetailCodeId
          rowData['scopeDetailCodeId'] = newScopeDetailCodeId;

          // Add the scopeDetailCodeId to changesTrackerFTProjectViewer
          if (changesTrackerFTProjectViewer[rowId]) {
            changesTrackerFTProjectViewer[rowId]['scopeDetailCodeId'] = newScopeDetailCodeId;
          }
        }
      }

      if (field === 'locationTypeName') {
        const newLocationType = locationTypeList.value.find(
          (detail) => detail.locationTypeName === newValue
        );
        const newLocationTypeId = newLocationType ? newLocationType.id : null;

        // Check if new ID was found
        if (newLocationTypeId) {
          // Update the rowData with new locationTypeId
          rowData['locationTypeId'] = newLocationTypeId;

          // Add the locationTypeId to changesTrackerFTProjectViewer
          if (changesTrackerFTProjectViewer[rowId]) {
            changesTrackerFTProjectViewer[rowId]['locationTypeId'] = newLocationTypeId;
          }
        }
      }

      if (field === 'costTypeName') {
        const newCostType = costTypeList.value.find((detail) => detail.costTypeName === newValue);
        const newCostTypeId = newCostType ? newCostType.id : null;

        // Check if new ID was found
        if (newCostTypeId) {
          // Update the rowData with new costTypeId
          rowData['costTypeId'] = newCostTypeId;

          // Add the CostTypeId to changesTrackerFTProjectViewer
          if (changesTrackerFTProjectViewer[rowId]) {
            changesTrackerFTProjectViewer[rowId]['costTypeId'] = newCostTypeId;
          }
        }
      }

      if (field === 'scopeTypeName') {
        const newScopeType = scopeTypeList.value.find((detail) => detail.scopeName === newValue);
        const newScopeTypeId = newScopeType ? newScopeType.id : null;

        // Check if new ID was found
        if (newScopeTypeId) {
          // Update the rowData with new scopeTypeId
          rowData['scopeTypeId'] = newScopeTypeId;

          // Add the scopeTypeId to changesTrackerFTProjectViewer
          if (changesTrackerFTProjectViewer[rowId]) {
            changesTrackerFTProjectViewer[rowId]['scopeTypeId'] = newScopeTypeId;
          }
        }

        const installTeamsCell: CellComponent = toRaw(
          tabulator.value.columnManager.columns[18].cells[0].component
        );

        if (
          !newScopeType?.ihiEnabled &&
          installTeamsList.value.find((detail) => detail.teamName === installTeamsCell.getValue())
            ?.teamName == 'IHI Team'
        ) {
          installTeamsCell.setValue(null, true);
        }
      }

      if (field === 'clearInspectionComplete') {
        // Convert the string value back to boolean or null for "Pending"
        if (newValue === 'Yes') newValue = true;
        else if (newValue === 'No') newValue = false;

        changesTrackerFTProjectViewer[rowId]['clearInspectionComplete'] = newValue;

        if (newValue === true) {
          inspectionsYesCount.value++;
          rowData['clearInspectionPassed'] = false; // Reset the value of "Inspection Passed" when "Inspection Complete" is set to "Yes"
          changesTrackerFTProjectViewer[rowId]['clearInspectionPassed'] = false;
        } else if (newValue === false) {
          inspectionsYesCount.value--;
          rowData['clearInspectionPassed'] = null; // Reset the value of "Inspection Passed" when "Inspection Complete" is set to "No"
          changesTrackerFTProjectViewer[rowId]['clearInspectionPassed'] = null;
        } else {
          console.error(
            'Invalid clearInspectionComplete value. Must be "Yes" or "No". No change to inspectionsYesCount.'
          );
        }

        await calculateInspectionCompleteYesPercentage().then(() => {
          tabulator.value.recalc();
        });

        await calculateInspectionPassedPercentage().then(() => {
          tabulator.value.recalc();
        });

        cell.getRow().update(rowData);
      }

      if (field === 'clearInspectionPassed') {
        // Convert the string value back to boolean or null for "Pending"
        if (newValue === 'Yes') newValue = true;
        else if (newValue === 'No') newValue = false;
        // else if (newValue === "Pending") newValue = null; // No need to convert "Pending" to null since that is not longer an option in the dropdown

        changesTrackerFTProjectViewer[rowId]['clearInspectionPassed'] = newValue;

        if (newValue === true) {
          inspectionsPassedCount.value++;
        } else if (newValue === false) {
          inspectionsPassedCount.value--;
        }

        await calculateInspectionCompleteYesPercentage().then(() => {
          tabulator.value.recalc();
        });

        await calculateInspectionPassedPercentage().then(() => {
          tabulator.value.recalc();
        });
      }

      if (field === 'installTeamName') {
        const newInstallTeam = installTeamsList.value.find(
          (detail) => detail.teamName === newValue
        );
        const newInstallTeamId = newInstallTeam ? newInstallTeam.id : null;
        const newInstallTeamName = newInstallTeam ? newInstallTeam.teamName : null;

        const scopeTypeCell = rowData.scopeTypeName;

        if (
          newInstallTeamName === 'IHI Team' &&
          !scopeTypeList.value.find((st) => st.scopeName === scopeTypeCell)?.ihiEnabled
        ) {
          alert(`Scope Type: ${scopeTypeCell} is unable to use IHI Team`);
          cell.restoreOldValue();
          return;
        }

        if (newInstallTeamName === 'IHI Team') {
          const rowsScopeTypeId = scopeTypeList.value.find(
            (st) => st.scopeName === scopeTypeCell
          )?.id;
          const ihiProjectByScope = await doesProjectRowExist(
            storedRootProjectId.value,
            rowsScopeTypeId
          );

          if (ihiProjectByScope.result == null) {
            const insertedProjectRow = await createNewProjectByScopeEntry(
              storedRootProjectId.value,
              rowsScopeTypeId
            );

            await createUnitByScope({
              projectByScopeId: insertedProjectRow.projectByScopeId,
              projectRowId: rowData.id,
              scopeTypeId: rowsScopeTypeId,
              statusId: 2,
            });
          } else {
            const currentIHIProject = ihiProjectByScope.result[0];

            if (currentIHIProject.deletedAt != null) {
              await updateIHIProject(currentIHIProject, 2);
            }

            const unitByScope = await doesUnitExist(storedRootProjectId.value, rowData.id);

            if (unitByScope.result != null && unitByScope.result[0].deletedAt != null) {
              await updateUnitByScope(unitByScope.result[0].id, unitByScope.result[0].phaseId, 1);
            } else if (unitByScope.result == null) {
              await createUnitByScope({
                projectByScopeId: currentIHIProject.id,
                projectRowId: rowData.id,
                scopeTypeId: rowsScopeTypeId,
                statusId: 2,
              });
            } else {
              // Doesn't do anything because unit by scope is exist and not deleted
            }
          }
        }

        if (cell.getOldValue() == 'IHI Team') {
          const ihiProjectByScope = await doesProjectRowExist(
            storedRootProjectId.value,
            scopeTypeList.value.find((st) => st.scopeName === scopeTypeCell)?.id
          );

          const unitByScope = await doesUnitExist(storedRootProjectId.value, rowData.id);

          console.log(unitByScope);
          console.log(rowData);

          await updateUnitByScope(unitByScope.result[0].id, unitByScope.result[0].phaseId, 9);
          await deleteUnitByScope(unitByScope.result[0].id);

          await getIHITeamEnabled();

          console.log(unitByScope.result.filter((unit: any) => unit.deletedAt != null).length == 0);
          if (
            unitByScope.result != null &&
            unitByScope.result.filter((unit: any) => unit.deletedAt != null).length == 0
          ) {
            const matchedScopeType = ihiTeamEnabled.value.filter(
              (ihiTeam: any) => ihiTeam.scopeTypeId == ihiProjectByScope.result[0].scopeTypeId
            );
            console.log('matchedScopeType: ', matchedScopeType);
            if (matchedScopeType.length <= 1) {
              console.log('I will execute these functions');
              await updateIHIProject(ihiProjectByScope.result[0], 5);
              await deleteIHIProject(ihiProjectByScope.result[0]);
            }
          } else {
            console.log('I will execute these functions');
            await updateIHIProject(ihiProjectByScope.result[0], 5);
            await deleteIHIProject(ihiProjectByScope.result[0]);
          }
        }

        // Update the rowData with new installTeamId
        rowData['installTeamId'] = newInstallTeamId;
        rowData['installTeamName'] = newInstallTeamName;

        // Add the installTeamId to changesTrackerFTProjectViewer
        if (changesTrackerFTProjectViewer[rowId]) {
          changesTrackerFTProjectViewer[rowId]['installTeamId'] = newInstallTeamId;
          changesTrackerFTProjectViewer[rowId]['installTeamName'] = newInstallTeamName;
        }
      }

      (changesTrackerFTProjectViewer[rowId] as any)[field] = newValue;

      // Save the current state of changesTrackerFTProjectViewer to localStorage
      localStorage.setItem(
        'changesTrackerFTProjectViewer',
        JSON.stringify(changesTrackerFTProjectViewer)
      );

      // If the edited field affects calculations, recalculate
      if (
        [
          'scopeDetailCode',
          'locationTypeName',
          'costTypeName',
          'quantity',
          'percentComplete',
          'actualManHours',
          'manHoursQuantity',
        ].includes(field)
      ) {
        recalculateFields(rowData);
      }

      // Update the projectRowsList with the new value
      const rowIndex = projectRowsList.value.findIndex((r) => r.id === rowId);
      if (rowIndex !== -1) {
        projectRowsList.value[rowIndex] = { ...projectRowsList.value[rowIndex], ...rowData };
        projectRowsList.value[rowIndex]._isDirty = true; // Mark the row as dirty in Vue reactive data
      }

      // Redraw the table with the updated data
      tabulator.value.updateOrAddData([projectRowsList.value[rowIndex]]);
    });

    tabulator.value.on('rowDeselected', (row: RowComponent) => {
      deselectedRowData = row.getData();
      if (deselectedRowData._isDirty) {
        updateSelectedRows();
      }
    });

    tabulator.value.on('cellEditing', function (cell: CellComponent) {
      isCellEditing = true;
      const currentRow = cell.getRow();
      handleRowChange(currentRow);
    });

    tabulator.value.on('cellEditCancelled', function (_cell: CellComponent) {
      isCellEditing = false;
    });

    tabulator.value.on('dataFiltered', function (filters: any, rows: any) {
      filteredRowsCount.value = rows.length;
    });

    // Ensure Tabulator is initialized before attaching event listeners
    if (tabulator.value) {
      if (localStorage.getItem('newRowAdded')) {
        toastMessage.value = '1 new row has been successfully added!';
        showToast.value = true;

        // Scroll to the bottom and highlight the new row
        scrollToBottomAndHighlight(1); // Assuming this is the function you will create

        // Automatically hide the toast after 5 seconds
        setTimeout(() => {
          showToast.value = false;
        }, 5000);

        // Clear the flag from localStorage
        localStorage.removeItem('newRowAdded');
      }

      const tabulatorElement = document.querySelector('.table-container') as HTMLElement; // Replace with your Tabulator container selector

      tabulatorElement.addEventListener('click', async function (e: Event) {
        // Check if the click is inside a row cell
        const isRowCell = (e.target as HTMLElement).closest('.tabulator-row .tabulator-cell');

        // If the click is not on a row cell and either on tabulatorElement or header input, then save changes
        if (!isRowCell) {
          await saveRowUpdateChanges()
            .then(() => {
              changesTrackerFTProjectViewer = {}; // Clear the changesTrackerFTProjectViewer after successful save
            })
            .catch((error) => {
              console.error('Error saving changes:', error);
              hasApiError.value = true;
              apiErrorMessage.value =
                'Error saving changes. Please select a random row and then deselect it to try again.';
              isLoading.value = false;
            });
        }
      });

      // Re-attach listeners if the table is redrawn or columns are updated
      tabulator.value.on('tableBuilt', attachHeaderInputListeners);
    } else {
      console.error('Tabulator instance is not available.');
      hasApiError.value = true;
      apiErrorMessage.value =
        'The project rows table is not available. Please close tool and try again.';
      isLoading.value = false;
    }
  };

  function attachHeaderInputListeners() {
    const headerInputs = document.querySelectorAll('.tabulator-header-filter input');
    headerInputs.forEach((input) => {
      input.addEventListener('click', async function (e: Event) {
        // Prevent event from bubbling up to headerClick
        e.stopPropagation();

        await saveRowUpdateChanges()
          .then(() => {
            changesTrackerFTProjectViewer = {}; // Clear the changesTrackerFTProjectViewer after successful save
          })
          .catch((error) => {
            console.error('Error saving changes:', error);
            hasApiError.value = true;
            apiErrorMessage.value =
              'Error saving changes. Please select a random row and then deselect it to try again.';
            isLoading.value = false;
          });
      });
    });
  }

  const copySelectedRowsToClipboard = () => {
    if (tabulator.value) {
      try {
        const selectedRows = tabulator.value.getSelectedData();
        if (selectedRows.length === 0) {
          toastErrMessage.value = 'No rows selected. Please select at least one row to copy.';
          showToastErr.value = true;
          setTimeout(() => {
            showToastErr.value = false;
          }, 5000);
          return;
        }
        // Format rows according to columnMapping order for paste functionality
        const formattedRows = selectedRows.map((row: any) => {
          // Helper function to format dates
          const formatDate = (date: any) => {
            if (!date) return '';
            const d = new Date(date);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
          };

          // Helper function to format boolean/inspection values
          const formatInspection = (value: any) => {
            if (value === true || value === 'Yes') return 'Yes';
            if (value === false || value === 'No') return 'No';
            return '';
          };

          // Map row data to columnMapping order
          return [
            row.building || '',
            row.area || '',
            row.level || '',
            row.unit || '',
            row.shipPhase || '',
            row.buildPhase || '',
            row.scheme || '',
            row.unitType || '',
            row.description || '',
            row.scopeTypeName || '',
            row.scopeDetailCode || '',
            row.locationTypeName || '',
            row.costTypeName || '',
            row.quantity || '',
            row.installTeamName || '',
            formatDate(row.startingDate),
            formatDate(row.finishDate),
            row.percentComplete || '',
            row.actualManHours || '',
            formatInspection(row.clearInspectionComplete),
            formatInspection(row.clearInspectionPassed),
            formatDate(row.clearInspectionDate),
          ].join('\t');
        });

        // Copy formatted data to clipboard
        const textToCopy = formattedRows.join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
          toastMessage.value = `${selectedRows.length} row(s) have been copied to your clipboard in paste format`;
          showToast.value = true;

          // Automatically hide the toast after 5 seconds
          setTimeout(() => {
            showToast.value = false;
          }, 5000);
        });
      } catch (error: any) {
        toastErrMessage.value = error.message;
        showToastErr.value = true;

        // Automatically hide the toast after 5 seconds
        setTimeout(() => {
          showToastErr.value = false;
        }, 10000);
      }
    }
  };

  // Undo Action
  async function undoChange() {
    if (!tabulator.value) {
      console.error('Tabulator instance is not initialized');
      return;
    }

    const undoCount = tabulator.value.getHistoryUndoSize();

    if (undoCount === 0) {
      toastMessage.value = 'No edits to undo.';
      showToast.value = true;

      // Automatically hide the toast after 5 seconds
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
      return;
    }

    try {
      await tabulator.value.undo();
      tabulator.value.redraw();
    } catch (error) {
      console.error('Error undoing edit:', error);
    }
  }

  // Redo Action
  async function redoChange() {
    if (!tabulator.value) {
      console.error('Tabulator instance is not initialized');
      return;
    }

    const redoCount = tabulator.value.getHistoryRedoSize();

    if (redoCount === 0) {
      toastMessage.value = 'No edits to redo.';
      showToast.value = true;

      // Automatically hide the toast after 5 seconds
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
      return;
    }

    await tabulator.value.redo();
    tabulator.value.redraw();
  }

  // Hightlighted rows will default to 0 if not specified
  const scrollToBottomAndHighlight = async (numRowsToHighlight = 0) => {
    if (tabulator.value) {
      // Wait for the DOM to update after adding new rows
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Retrieve all rows and identify the last few rows based on numRowsToHighlight
      const allRows = tabulator.value.getRows();
      const rowsToHighlight = allRows.slice(-numRowsToHighlight);

      // Scroll to the last new row
      const lastNewRow = rowsToHighlight[rowsToHighlight.length - 1];
      if (lastNewRow) {
        try {
          await tabulator.value.scrollToRow(lastNewRow, 'bottom', false);

          // Highlight new rows and add fade effect
          rowsToHighlight.forEach((row: RowComponent) => {
            const element = row.getElement();

            // Ensure any existing highlight effect is removed
            element.classList.remove('highlight-new-row');
            element.classList.remove('fade-highlight');

            // Re-apply the highlight class
            element.classList.add('highlight-new-row');

            // Add a timeout for the fade effect
            setTimeout(() => {
              element.classList.add('fade-highlight');
            }, 3000);

            // Remove the highlight class after the fade effect has completed
            setTimeout(() => {
              element.classList.remove('highlight-new-row', 'fade-highlight');
            }, 4000); // Adjusted time to slightly after the fade effect
          });
        } catch (error) {
          console.error('Scroll error:', error);
        }
      }
    }
  };

  const scrollToTopAndHighlight = async () => {
    if (tabulator.value) {
      // Wait for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Retrieve all rows and select the first row
      const allRows = tabulator.value.getRows();
      const firstRow = allRows[0];

      if (firstRow) {
        try {
          await tabulator.value.scrollToRow(firstRow, 'top', false);

          // Highlight the first row and add fade effect
          const element = firstRow.getElement();

          // Ensure any existing highlight effect is removed
          element.classList.remove('highlight-new-row');
          element.classList.remove('fade-highlight');

          // Re-apply the highlight class
          element.classList.add('highlight-new-row');

          // Add a timeout for the fade effect
          setTimeout(() => {
            element.classList.add('fade-highlight');
          }, 3000);

          // Remove the highlight class after the fade effect has completed
          setTimeout(() => {
            element.classList.remove('highlight-new-row', 'fade-highlight');
          }, 4000); // Adjusted time to slightly after the fade effect
        } catch (error) {
          console.error('Scroll error:', error);
        }
      }
    }
  };

  function downloadAllRows() {
    if (!tabulator.value) {
      console.error('Tabulator instance is not initialized');
      return;
    }

    tabulator.value.download('csv', 'project-rows.csv', {
      delimiter: ',',
      bom: true,
      header: true,
      skipEmptyValues: false,
    });
  }

  function openScopeEditor() {
    router.push({ name: 'field-tracker-project-scope-editor', params: { id: route.params.id } });
  }

  function openFieldTrackerReport() {
    router.push({ name: 'field-tracker-high-level-report', params: { id: route.params.id } });
  }

  function openAddRowModal() {
    if (addRowModalInstance) {
      addRowModalInstance.show();
      isAddRowModalOpen.value = true;
    }
  }

  async function saveRowUpdateChanges() {
    // Save the current state of changesTrackerFTProjectViewer to localStorage before attempting to save
    localStorage.setItem(
      'changesTrackerFTProjectViewer',
      JSON.stringify(changesTrackerFTProjectViewer)
    );

    // Prepare an array of updates
    const updates = Object.entries(changesTrackerFTProjectViewer).map(([rowId, changes]) => {
      const filteredChanges = Object.keys(changes)
        .filter((key) => allowedRowUpdateProperties.includes(key))
        .reduce((obj: Partial<ProjectRowChangesDto>, key) => {
          if (Object.prototype.hasOwnProperty.call(changes, key)) {
            // Assign only if the key exists in both ProjectRowChangesDto and changes
            (obj as any)[key] = (changes as any)[key];
          }
          return obj;
        }, {} as Partial<ProjectRowChangesDto>);

      return {
        rowId: parseInt(rowId),
        changes: filteredChanges,
        updatedBy: userId.value,
      } as ProjectRowUpdateDto;
    }) as ProjectRowUpdateDto[];

    if (updates.length > 0) {
      try {
        // Save all changes to the backend
        await fieldTrackerServiceProxy.updateProjectRows(updates);

        localStorage.removeItem('changesTrackerFTProjectViewer'); // Clear localStorage after successful updates
        const numberOfChanges = changesTrackerFTProjectViewer
          ? Object.keys(changesTrackerFTProjectViewer).length
          : 0;
        changesTrackerFTProjectViewer = {}; // Clear the changesTrackerFTProjectViewer after successful updates

        toastMessage.value = `Changes to ${numberOfChanges} row(s) have been saved!`;
        showToast.value = true;

        // Automatically hide the toast after 5 seconds
        setTimeout(() => {
          showToast.value = false;
        }, 5000);
      } catch (error: any) {
        hasApiError.value = true;
        apiErrorMessage.value =
          'Error updating project rows data. Select and then deselect any row to try again.';
        isLoading.value = false;

        cellEdited.value.forEach((cell: any) => {
          cell.setValue(cell.getOldValue(), true);
        });

        toastErrMessage.value = error.response.data + '. Changes have been reverted';
        showToastErr.value = true;

        // Automatically hide the toast after 5 seconds
        setTimeout(() => {
          showToastErr.value = false;
        }, 10000);

        // Note: Do not clear localStorage or changesTrackerFTProjectViewer here, as the data is still unsaved
      }
    }
  }

  async function synchronizeChangesWithLocalStorage() {
    const storedChanges = localStorage.getItem('changesTrackerFTProjectViewer');

    if (storedChanges && storedChanges !== '{}') {
      const storedChangesObj = JSON.parse(storedChanges);
      changesTrackerFTProjectViewer = storedChangesObj;

      // Attempt to save the changes
      await saveRowUpdateChanges()
        .then(() => {
          console.log('Unsaved changes from previous session successfully saved.');
        })
        .catch((error) => {
          console.error('Error saving changes from previous session:', error);
          hasApiError.value = true;
          apiErrorMessage.value =
            'Error saving changes from previous session. Please close and reopen the tool to retry.';
          isLoading.value = false;
        });
    }
  }

  async function handleClickOutsideTable(event: Event) {
    // Check if the click is outside the Tabulator table
    if (tabulator.value && !tabulator.value.element.contains(event.target)) {
      // Check for unsaved changes and push them to the backend
      const selectedRows = tabulator.value.getSelectedRows();
      if (Object.keys(changesTrackerFTProjectViewer).length > 0) {
        if (selectedRows.length > 0) {
          // Deselect all rows
          tabulator.value.deselectRow();
        }

        await saveRowUpdateChanges()
          .then(() => {
            changesTrackerFTProjectViewer = {}; // Clear the changesTrackerFTProjectViewer after successful save
          })
          .catch((error) => {
            console.error('Error saving changes:', error);
            hasApiError.value = true;
            apiErrorMessage.value =
              'Error saving changes. Please select a randow row and then deselect it to try again.';
            isLoading.value = false;
          });
      }
    }
  }

  async function handleRowChange(newRow: RowComponent) {
    if (newRow !== lastFocusedRow) {
      // Trigger save action
      await saveRowUpdateChanges()
        .then(() => {
          changesTrackerFTProjectViewer = {}; // Clear the changesTrackerFTProjectViewer after successful save
        })
        .catch((error) => {
          console.error('Error saving changes:', error);
          hasApiError.value = true;
          apiErrorMessage.value =
            'Error saving changes. Please select a randow row and then deselect it to try again.';
          isLoading.value = false;
        });
      // Optionally, deselect the previous row
      if (lastFocusedRow) {
        tabulator.value.deselectRow(lastFocusedRow);
      }
      lastFocusedRow = newRow;
    }
  }

  async function fetchFieldTrackerProjectData() {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/field-tracker/projects/${route.params.id}/data`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      if (response) {
        actualProjectData.value = response.data;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Method to update columns
  const updateTableColumns = () => {
    if (tabulator.value) {
      tabulator.value.setColumns(getTableColumns());
    }
  };

  // Methods
  const closeProject = () => {
    router.push({ name: 'field-tracker' });
  };

  const openPasteModal = () => {
    if (!pasteModalInstance && pasteModalRef.value) {
      pasteModalInstance = new Modal(pasteModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
    if (pasteModalInstance) {
      pasteModalInstance.show();
    } else {
      console.error('Paste modal instance is not available.');
    }
  };

  // Mapping of pasted columns to the required table fields
  const columnMapping: string[] = [
    'building',
    'area',
    'level',
    'unit',
    'shipPhase',
    'buildPhase',
    'scheme',
    'unitType',
    'description',
    'scopeTypeId',
    'scopeDetailCodeId',
    'locationTypeId',
    'costTypeId',
    'quantity',
    'installTeamId',
    'startingDate',
    'finishDate',
    'percentComplete',
    'actualManHours',
    'clearInspectionComplete',
    'clearInspectionPassed',
    'clearInspectionDate',
  ];

  const processMultiplePastedRows = async () => {
    if (!pasteModalInstance) return;

    const rows = pastedData.value.split('\n').filter((row) => row.trim());
    const validRows: Partial<EnhancedFormValues>[] = [];
    let allErrorMessages: string[] = [];
    showToastErr.value = false;
    pasteMultipleRowsYesCount.value = 0;
    pasteMultipleRowsRowCount.value = 0;

    rows.forEach((row, rowIndex) => {
      const columns = row.split('\t');
      const newRow: Partial<EnhancedFormValues> = {};

      columns.forEach((column, index) => {
        if (index < columnMapping.length) {
          const fieldName = columnMapping[index];
          newRow[fieldName] = parseValueBasedOnType(column.trim(), fieldName);
        }
      });

      const rowErrors = validateNewRow(newRow, rowIndex);
      if (rowErrors.length === 0) {
        // Extract the ID from scopeDetailsList
        if (newRow.scopeTypeId && typeof newRow.scopeTypeId === 'object') {
          newRow.scopeTypeId = newRow.scopeTypeId.scopeTypeId;
        }
        // Extract the ID from isntallTeamList
        if (newRow.installTeamId && typeof newRow.installTeamId === 'object') {
          //TODO: setting this to null for now, so that it wont add install team in the bulk create
          // newRow.installTeamId = newRow.installTeamId.installTeamId;
          newRow.installTeamId = null;
        } else {
          newRow.installTeamId = null;
        }
        // Extract the id from the scopeDetailCodeId object
        if (newRow.scopeDetailCodeId && typeof newRow.scopeDetailCodeId === 'object') {
          newRow.scopeDetailCodeId = newRow.scopeDetailCodeId.detailCodeId;
        }
        // Extract the id from the locationTypeId object
        if (newRow.locationTypeId && typeof newRow.locationTypeId === 'object') {
          newRow.locationTypeId = newRow.locationTypeId.locationTypeId;
        }
        // Extract the id from the costTypeId object
        if (newRow.costTypeId && typeof newRow.costTypeId === 'object') {
          newRow.costTypeId = newRow.costTypeId.costTypeId;
        }
        if (newRow.clearInspectionComplete && typeof newRow.clearInspectionComplete === 'object') {
          // Check if the object is an InspectionValue and not a ParseError
          if ('parsedValue' in newRow.clearInspectionComplete) {
            newRow.clearInspectionComplete = newRow.clearInspectionComplete.parsedValue as any;
          }
        }
        if (newRow.clearInspectionPassed && typeof newRow.clearInspectionPassed === 'object') {
          // Check if the object is an InspectionValue and not a ParseError
          if ('parsedValue' in newRow.clearInspectionPassed) {
            newRow.clearInspectionPassed = newRow.clearInspectionPassed.parsedValue as any;
          }
        }

        validRows.push(newRow);

        // Check if the clearInspectionComplete field is set to "Yes" for each row
        if (
          newRow.clearInspectionComplete &&
          typeof newRow.clearInspectionComplete === 'boolean' &&
          newRow.clearInspectionComplete === true
        ) {
          pasteMultipleRowsYesCount.value = pasteMultipleRowsYesCount.value + 1;
        }

        pasteMultipleRowsRowCount.value++; // Increment the projectRowsCount
      } else {
        allErrorMessages.push(...rowErrors);
      }
    });

    if (allErrorMessages.length > 0) {
      // Display the errors and keep the modal open
      alert('Errors in pasted data:\n' + allErrorMessages.join('\n'));
      return;
    } else if (validRows.length > 0) {
      isLoading.value = true;

      await fieldTrackerServiceProxy
        .createProjectRows(
          Number(route.params.id),
          validRows.map(
            (row) =>
              new ProjectRowCreateDto({
                actualManHours: row.actualManHours as number,
                area: row.area as string,
                buildPhase: row.buildPhase as string,
                building: row.building as string,
                clearInspectionComplete: !!row.clearInspectionComplete as boolean,
                clearInspectionDate: row.clearInspectionDate as Date | undefined,
                clearInspectionPassed: !!row.clearInspectionPassed as boolean,
                costTypeId: row.costTypeId as number,
                createdBy: userId.value ?? 0,
                description: row.description as string,
                finishDate: row.finishDate as Date | undefined,
                installTeamId: row.installTeamId as number | undefined,
                level: row.level as string,
                locationTypeId: row.locationTypeId as number,
                percentComplete: row.percentComplete as number,
                quantity: row.quantity as number,
                scheme: row.scheme as string,
                scopeDetailCodeId: row.scopeDetailCodeId as number,
                scopeTypeId: row.scopeTypeId as number,
                shipPhase: row.shipPhase as string,
                startingDate: row.startingDate as Date | undefined,
                unit: row.unit as string,
                unitType: row.unitType as string,
              })
          ) as ProjectRowCreateDto[]
        )
        .then(() => {
          // Set up notification listener for progress updates
          bulkCreationNotificationHandler.value = handleBulkCreationNotification;
          notificationService.onMessage(bulkCreationNotificationHandler.value);

          // Set initial progress
          hasBulkTransaction.value = 10;

          console.log('✅ Bulk creation initiated, listening for progress updates');
        })
        .catch((error: any) => {
          console.error('Error creating project rows:', error);
          hasApiError.value = true;
          apiErrorMessage.value = 'Error creating project rows. Please try again.';
          isLoading.value = false;
        })
        .finally(() => {
          if (pasteModalInstance) {
            pasteModalInstance.hide();
          }
        });
    } else {
      // No valid rows to add
      alert('No valid rows to add.');
      return;
    }

    if (allErrorMessages.length === 0) {
      // Reset pasted data and close the modal only if there are no errors
      pastedData.value = '';
    } else {
      // If there are errors, keep the modal open and do not reset the pasted data
      showToast.value = false; // Hide toast in case of error
    }

    // Automatically hide the toast after 5 seconds
    setTimeout(() => {
      if (showToast.value) showToast.value = false;
    }, 5000);
  };

  const handleBulkCreationNotification = (notification: NotificationMessage) => {
    // Only process ProjectRowBulkCreation events
    if (notification.eventType !== NotificationEventTypeEnum.ProjectRowBulkCreation) {
      return;
    }

    // Parse percentage from message field (e.g., "45.50" -> 45.50)
    const percentage = parseFloat(notification.message);

    if (notification.type === NotificationType.Error) {
      // Handle error notification
      hasBulkTransaction.value = 0;

      // Cleanup listener
      if (bulkCreationNotificationHandler.value) {
        notificationService.offMessage(bulkCreationNotificationHandler.value);
        bulkCreationNotificationHandler.value = null;
      }
      return;
    }

    // Update progress bar with the percentage from notification
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      hasBulkTransaction.value = parseFloat(percentage.toFixed(2));
    }

    // When complete (100%), cleanup listener
    // The existing showBulkCreateStatus polling will handle the rest
    if (percentage >= 100) {
      // Cleanup listener
      if (bulkCreationNotificationHandler.value) {
        notificationService.offMessage(bulkCreationNotificationHandler.value);
        bulkCreationNotificationHandler.value = null;
      }

      // Reset progress bar after 1 second
      setTimeout(async () => {
        hasBulkTransaction.value = 0;
        isLoading.value = false;
      }, 1000);
    }
  };

  // Function to parse and validate each value based on its type
  function parseValueBasedOnType(value: string, fieldName: keyof EnhancedFormValues): any {
    const lowerCaseValue = value.toLowerCase();

    // Handle blank values for optional fields
    if (value === '') {
      switch (fieldName) {
        case 'clearInspectionPassed':
        case 'startingDate':
        case 'finishDate':
        case 'clearInspectionDate':
          return null;
        case 'percentComplete':
        case 'actualManHours':
          return 0;
        case 'clearInspectionComplete':
          return false;
        default:
          return value; // Return as is for other optional fields
      }
    }

    switch (fieldName) {
      case 'startingDate':
      case 'finishDate':
      case 'clearInspectionDate': {
        if (lowerCaseValue === 'null') {
          return null; // Treat "null" or "Null" as valid null values
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { error: `Invalid date format for ${fieldName}: "${value}"` };
        }
        return date;
      }
      case 'percentComplete': {
        const parsedPercentComplete = parseFloat(value);
        if (!isNaN(parsedPercentComplete)) {
          return parsedPercentComplete;
        } else {
          return { error: `Invalid numeric value for ${fieldName}: "${value}"` };
        }
      }
      case 'quantity':
      case 'actualManHours': {
        if (value === '') {
          return null; // Handle empty values as null
        }
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
          return { error: `Invalid number format for ${fieldName}: "${value}"` };
        }
        return parsedValue;
      }
      case 'clearInspectionComplete':
        if (['yes', 'no'].includes(lowerCaseValue)) {
          return { parsedValue: lowerCaseValue === 'yes', originalValue: value };
        } else if (value === '') {
          return { parsedValue: null, originalValue: value };
        } else {
          return { error: `Invalid value for ${fieldName}: "${value}"` };
        }

      case 'clearInspectionPassed':
        if (['yes', 'no', 'pending'].includes(lowerCaseValue)) {
          return {
            parsedValue: lowerCaseValue === 'yes' ? true : lowerCaseValue === 'no' ? false : null,
            originalValue: value,
          };
        } else if (value === '') {
          return { parsedValue: null, originalValue: value };
        } else {
          return { error: `Invalid value for ${fieldName}: "${value}"` };
        }
      case 'scopeDetailCodeId': {
        const detailCode = scopeDetailsCodeList.value.find((dc) => dc.scopeDetailCode === value);
        return {
          requestedValue: value,
          detailCode: detailCode?.scopeDetailCode || null,
          detailCodeId: detailCode?.id || null,
        };
      }
      case 'locationTypeId': {
        // Find ID corresponding to the text value in locationTypeList
        const locationType = locationTypeList.value.find((lt) => lt.locationTypeName === value);
        return {
          requestedValue: value,
          locationTypeName: locationType?.locationTypeName || null,
          locationTypeId: locationType?.id || null,
        };
      }
      case 'scopeTypeId': {
        // Find ID corresponding to the text value in costTypeList
        let scopeTypeValue: string;
        scopeTypeValue = value;
        const scopeType = scopeTypeList.value.find(
          (st) => st.id == Number(scopeTypeValue) || st.scopeName == scopeTypeValue
        );
        return {
          requestedValue: value,
          scopeTypeName: scopeType?.scopeName || null,
          scopeTypeId: scopeType?.id || null,
          ihiEnabled: scopeType?.ihiEnabled || false,
        };
      }
      case 'installTeamId': {
        // Find ID corresponding to the text value in costTypeList
        let installTeamValue: string | number;
        installTeamValue = value;
        const installTeam = installTeamsList.value.find(
          (it) => it.id == Number(installTeamValue) || it.teamName == installTeamValue
        );
        return {
          requestedValue: value,
          installTeamName: installTeam?.teamName || null,
          installTeamId: installTeam?.id || null,
        };
      }
      case 'costTypeId': {
        // Find ID corresponding to the text value in costTypeList
        const costType = costTypeList.value.find((ct) => ct.costTypeName === value);
        return {
          requestedValue: value,
          costTypeName: costType?.costTypeName || null,
          costTypeId: costType?.id || null,
        };
      }
      default:
        // For other types, return the value as is
        return value;
    }
  }

  // Function to validate a new row
  function validateNewRow(row: Partial<EnhancedFormValues>, rowIndex: number): string[] {
    const errors: string[] = [];
    const requiredFields = [
      'building',
      'area',
      'level',
      'unit',
      'shipPhase',
      'buildPhase',
      'scheme',
      'unitType',
      'scopeTypeId',
      'scopeDetailCodeId',
      'locationTypeId',
      'costTypeId',
      'quantity',
    ];

    requiredFields.forEach((field) => {
      if (!row[field]) {
        errors.push(`Row ${rowIndex + 1}: ${field} is required`);
      }
    });

    if (row.scopeTypeId) {
      if (typeof row.scopeTypeId === 'object') {
        const { scopeTypeName, requestedValue } = row.scopeTypeId;
        if (!scopeTypeList.value.some((st) => st.scopeName === scopeTypeName)) {
          errors.push(`Row ${rowIndex + 1}: ("${requestedValue}") is not a valid Scope Type`);
        }
      } else {
        errors.push(`Row ${rowIndex + 1}: Invalid Scope Type format`);
      }
    }

    if (row.installTeamId) {
      if (typeof row.installTeamId === 'object') {
        const { installTeamName, requestedValue } = row.installTeamId;
        if (!installTeamsList.value.some((it) => it.teamName === installTeamName)) {
          errors.push(`Row ${rowIndex + 1}: ("${requestedValue}") is not a valid Install Team`);
        }
      } else {
        errors.push(`Row ${rowIndex + 1}: Invalid Install Team format`);
      }
    }

    if (row.scopeDetailCodeId) {
      if (typeof row.scopeDetailCodeId === 'object') {
        const { detailCode, requestedValue } = row.scopeDetailCodeId;
        if (!detailCode && requestedValue && requestedValue.length !== 6) {
          errors.push(
            `Row ${rowIndex + 1}: Detail Code ("${requestedValue}") must be 6 characters long`
          );
        }
        if (!scopeDetailsCodeList.value.some((dc) => dc.scopeDetailCode === detailCode)) {
          errors.push(`Row ${rowIndex + 1}: ("${requestedValue}") is not a valid Detail Code`);
        }
      } else {
        errors.push(`Row ${rowIndex + 1}: Invalid Detail Code format`);
      }
    }

    if (row.locationTypeId) {
      if (typeof row.locationTypeId === 'object') {
        const { locationTypeName, requestedValue } = row.locationTypeId;
        if (!locationTypeName && requestedValue && requestedValue.length !== 1) {
          errors.push(
            `Row ${rowIndex + 1}: Location Type name ("${requestedValue}") must be 1 character long`
          );
        }
        if (!locationTypeList.value.some((lt) => lt.locationTypeName === locationTypeName)) {
          errors.push(`Row ${rowIndex + 1}: ("${requestedValue}") is not a valid Location Type`);
        }
      } else {
        errors.push(`Row ${rowIndex + 1}: Invalid Location Type format`);
      }
    }

    if (row.costTypeId) {
      if (typeof row.costTypeId === 'object') {
        const { costTypeName, requestedValue } = row.costTypeId;
        if (!costTypeName && requestedValue && requestedValue.length !== 1) {
          errors.push(
            `Row ${rowIndex + 1}: Cost Type Name ("${requestedValue}") must be 1 character long`
          );
        }
        if (!costTypeList.value.some((ct) => ct.costTypeName === costTypeName)) {
          errors.push(`Row ${rowIndex + 1}: ("${requestedValue}") is not a valid Cost Type`);
        }
      } else {
        errors.push(`Row ${rowIndex + 1}: Invalid Cost Type format`);
      }
    } else {
      errors.push(`Row ${rowIndex + 1}: Detail Code is required`);
    }

    // Additional validation for date fields
    ['startingDate', 'finishDate', 'clearInspectionDate'].forEach((field) => {
      if (
        row[field] !== null &&
        row[field] !== '' &&
        typeof row[field] === 'object' &&
        'error' in row[field]
      ) {
        errors.push(`Row ${rowIndex + 1}: ${row[field].error}`);
      }
    });

    // Additional validation for numeric fields
    ['quantity', 'percentComplete', 'actualManHours'].forEach((field) => {
      if (
        row[field] !== null &&
        row[field] !== '' &&
        typeof row[field] === 'object' &&
        'error' in row[field]
      ) {
        errors.push(`Row ${rowIndex + 1}: ${row[field].error}`);
      }
    });

    if (row.clearInspectionComplete && 'error' in row.clearInspectionComplete) {
      errors.push(`Row ${rowIndex + 1}: ${row.clearInspectionComplete.error}`);
    }

    if (row.clearInspectionPassed !== undefined && row.clearInspectionPassed !== null) {
      if ('error' in row.clearInspectionPassed) {
        errors.push(`Row ${rowIndex + 1}: ${row.clearInspectionPassed.error}`);
      }
    }

    return errors;
  }

  function siteLocationFormatter(storageData: any) {
    if (
      storageData.siteLocStreetAddress != null &&
      storageData.siteLocCity != null &&
      storageData.siteLocPostalCode != null
    ) {
      return `${storageData.siteLocStreetAddress}, ${storageData.siteLocCity}, ${storageData.stateName}, ${storageData.siteLocPostalCode}`;
    } else return null;
  }

  function expectedStartDateFormatter(expectedStartDate: string) {
    if (expectedStartDate) {
      const parsedDate = new Date(expectedStartDate);

      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString('en-US', {
          timeZone: 'America/Denver', // Mountain Time
          weekday: 'short', // Sun
          year: 'numeric', // 2024
          month: 'short', // Sep
          day: 'numeric', // 15
        });
      } else {
        console.error('Invalid date format:', expectedStartDate);
        return null;
      }
    } else {
      return null;
    }
  }

  const doesProjectRowExist = async (projectId: any, scopeTypeId: any) => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/project-assigner/ihi-project-scope/${projectId}/${scopeTypeId}/exists`,
          targetMethodType: 'GET',
        },
        {
          timeout: 30000,
        }
      );

      return data;
    } catch (error) {
      console.error('Error checking for IHI Projects table:', error);
      hasApiError.value = true;
      apiErrorMessage.value =
        'Error checking for IHI Projects. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const createNewProjectByScopeEntry = async (projectId: any, scopeTypeId: any) => {
    const newProjectByScopeRequestBody = {
      projectId,
      scopeTypeId,
      statusId: 1,
      teamdLeadId: 0,
      createdBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/project-assigner/ihi-projects/create`,
      targetMethodType: 'POST',
    };

    isLoading.value = true;

    try {
      const { data } = await axios.post(`${apiBaseUrl}/api-proxy`, newProjectByScopeRequestBody, {
        timeout: 10000,
      });
      return data;
    } catch (error) {
      console.error('Error creating new entry to IHI Projects table:', error);
    } finally {
      isLoading.value = false;
      // window.location.reload();
    }
  };

  const doesUnitExist = async (projectId: any, projectRowId: any) => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/project-assigner/units-by-scope/${projectRowId}/exist`,
          targetMethodType: 'GET',
        },
        {
          timeout: 30000,
        }
      );

      return data;
    } catch (error) {
      console.error('Error checking for IHI Units table:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error checking for IHI Units. Please close the tool and try again.';
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateUnitByScope = async (unitId: any, currentPhaseId: any, statusId: number) => {
    const updateUnitByScopeRequestBody = {
      currentPhaseId,
      statusId,
      updatedBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/project-assigner/ihi-units/${unitId}/update`,
      targetMethodType: 'PATCH',
    };

    isLoading.value = true;

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, updateUnitByScopeRequestBody, { timeout: 10000 });
    } catch (error) {
      console.error('Error updating the IHI Unit entry:', error);
    } finally {
      isLoading.value = false;
      // window.location.reload();
    }
  };

  const deleteUnitByScope = async (unitId: any) => {
    const updateUnitByScopeRequestBody = {
      deletedBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/project-assigner/ihi-units/${unitId}/delete`,
      targetMethodType: 'PATCH',
    };

    isLoading.value = true;

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, updateUnitByScopeRequestBody, { timeout: 10000 });
    } catch (error) {
      console.error('Error deleting the IHI Unit entry:', error);
    } finally {
      isLoading.value = false;
      // window.location.reload();
    }
  };

  const createUnitByScope = async (insertBody: any) => {
    const newUnitByScopeRequestBody = {
      projectByScopeId: insertBody.projectByScopeId,
      projectRowId: insertBody.projectRowId,
      scopeTypeId: insertBody.scopeTypeId,
      statusId: insertBody.statusId,
      createdBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/project-assigner/ihi-units/create`,
      targetMethodType: 'POST',
    };

    isLoading.value = true;

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, newUnitByScopeRequestBody, { timeout: 10000 });
    } catch (error) {
      console.error('Error creating a IHI Unit entry:', error);
    } finally {
      isLoading.value = false;
      // window.location.reload();
    }
  };

  const updateIHIProject = async (ihiProject: any, statusId: number) => {
    const updateProjectRequestBody = {
      scopeTypeId: ihiProject.scopeTypeId,
      statusId,
      updatedBy: userId.value,
      teamdLeadId: 0,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/project-assigner/ihi-projects/${ihiProject.id}/update`,
      targetMethodType: 'PATCH',
    };

    isLoading.value = true;

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, updateProjectRequestBody, { timeout: 10000 });
    } catch (error) {
      console.error('Error updating the IHI Unit entry:', error);
    } finally {
      isLoading.value = false;
      // window.location.reload();
    }
  };

  const deleteIHIProject = async (ihiProjectId: any) => {
    const updateProjectRequestBody = {
      deletedBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/project-assigner/ihi-projects/${ihiProjectId.id}/delete`,
      targetMethodType: 'PATCH',
    };

    isLoading.value = true;

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, updateProjectRequestBody, { timeout: 10000 });
    } catch (error) {
      console.error('Error deleting the IHI Unit entry:', error);
    } finally {
      isLoading.value = false;
      // window.location.reload();
    }
  };

  // Retrieve and set project data from localStorage when component mounts
  onMounted(async () => {
    // Initialize notification service
    await notificationService.init();

    await fetchFieldTrackerProjectData();

    // Synchronize changes with localStorage
    await synchronizeChangesWithLocalStorage();

    // Fetch Project Rows Data
    await fetchProjectRowsData()
      .then(() => {
        isLoading.value = true;
        projectRowsCount.value = projectRowsList.value.length;
        inspectionsYesCount.value = projectRowsList.value.reduce((acc: any, currentValue: any) => {
          return (
            acc +
            (currentValue.clearInspectionComplete === 'Yes' ||
            currentValue.clearInspectionComplete === true
              ? 1
              : 0)
          );
        }, 0);
        inspectionsPassedCount.value = projectRowsList.value.reduce(
          (acc: any, currentValue: any) => {
            return acc + (currentValue.clearInspectionPassed === true ? 1 : 0);
          },
          0
        );
      })
      .finally(() => {
        isLoading.value = false;
      });

    await fetchScopeTypesList();
    await fetchInstallTeamsList();
    await fetchScopeDetailsCodeList();
    await fetchlocationTypeList();
    await fetchCostTypeList();

    await getIHITeamEnabled();

    await calculateInspectionCompleteYesPercentage();
    await calculateInspectionPassedPercentage();

    // Iitialize Tubulator after data is fetched and any changes from previous session are saved
    await initializeTabulator();
    // Attach event listeners to header input fields seems to be the only way to check for clicks inside the header filter input fields
    attachHeaderInputListeners();

    // Add click event listener to detect clicks outside the table
    document.addEventListener('click', handleClickOutsideTable);

    if (pasteModalRef.value) {
      pasteModalInstance = new Modal(pasteModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    const addSingleRowModalElement = document.getElementById('addSingleRowModal');
    if (addSingleRowModalElement) {
      addRowModalInstance = new Modal(addSingleRowModalElement, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });

      // Listen for the modal close event
      addSingleRowModalElement.addEventListener('hide.bs.modal', resetSingleRowFormValues);
    }
  });

  onUnmounted(() => {
    const addSingleRowModalElement = document.getElementById('addSingleRowModal');
    // Remove the event listeners when the component is unmounted
    document.removeEventListener('click', handleClickOutsideTable);
    if (tabulator.value) {
      tabulator.value.destroy();
    }

    if (addSingleRowModalElement) {
      addSingleRowModalElement.removeEventListener('hide.bs.modal', resetSingleRowFormValues);
    }

    // Cleanup notification listener if still active
    if (bulkCreationNotificationHandler.value) {
      notificationService.offMessage(bulkCreationNotificationHandler.value);
      bulkCreationNotificationHandler.value = null;
    }
  });

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Field Tracker', path: '/field-tracker' },
    { label: storedProjectName.value || 'Unknown Project' },
    { label: Array.isArray(mode.value) ? mode.value[0] : mode.value || 'view' },
  ];
</script>

<template>
  <div class="top-nav-bar">
    <TopNavBar />
  </div>

  <div class="ft-project-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <Breadcrumb
        :breadcrumbs="breadcrumbs"
        close-page-text="Close Project"
        @return="closeProject"
      />
    </div>

    <hr />

    <!-- Project Actions -->
    <div class="project-actions container-fluid">
      <div v-if="isInstallManagerOrAbove" class="row">
        <div class="col-12 col-md-6 mb-3 d-flex flex-column justify-content-end order-2 order-md-1">
          <div v-if="isControlsManagerOrAbove" class="align-self-start">
            <button
              v-if="mode === 'edit'"
              class="link-type-button"
              @click="showUpdateProjectInfoModal = true"
            >
              <i class="bi-pencil"></i>Edit Project Info
            </button>
            <!-- UPDATE PROJECT INFO modal -->
            <FieldTrackerUpdateProjectInfoModal v-model:is-open="showUpdateProjectInfoModal" />
          </div>
        </div>

        <div
          class="col-12 col-md-6 mb-3 d-flex justify-content-md-end justify-content-beginning order-1 order-md-2"
        >
          <div class="btn-group" role="group" aria-label="Project Actions">
            <button
              v-if="isControlsManagerOrAbove && mode === 'edit'"
              class="btn btn-outline-primary btn-action-group"
              @click="openScopeEditor"
            >
              <i class="bi-wrench-adjustable-circle"></i>View/Edit Scopes
            </button>
            <button
              v-if="isControlsManagerOrAbove && mode === 'edit'"
              class="btn btn-outline-primary btn-action-group"
              @click="openFieldTrackerReport"
            >
              <i class="bi bi-bar-chart-line"></i>View Field Tracker "High Level" Report
            </button>
            <button class="btn btn-outline-primary btn-action-group" @click="downloadAllRows">
              <i class="bi-download"></i>Download All Rows (.csv)
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="project-info container-fluid">
      <div class="row">
        <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
          <strong>Project Name</strong>
          <div>{{ storedProjectName }}</div>
        </div>

        <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
          <strong>Site Location</strong>
          <div v-if="storedSiteLocation != null">{{ storedSiteLocation }}</div>
          <div v-else class="text-danger">Full Address not set</div>
        </div>

        <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
          <strong>Expected Start Date</strong>
          <div v-if="storedExpectedStartDate != null">{{ storedExpectedStartDate }}</div>
          <div v-else class="text-danger">Date not set</div>
        </div>

        <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
          <strong>Salesforce Project ID</strong>
          <div>{{ storedSalesforceId }}</div>
        </div>

        <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
          <strong>Project Manager</strong>
          <div>{{ storedProjectManagerName }}</div>
        </div>

        <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
          <strong>Install Manager</strong>
          <div>{{ storedInstallManagerName }}</div>
        </div>
      </div>
    </div>

    <hr />

    <div class="project-rows-count container-fluid">
      <div class="row">
        <div>Total Rows: {{ projectRowsCount }}</div>
        <div>Filtered Rows: {{ filteredRowsCount }}</div>
      </div>
    </div>

    <div ref="table" class="table-container"></div>

    <hr />

    <div class="action-buttons container-fluid">
      <div class="row">
        <div v-if="isControlsManagerOrAbove" class="action-buttons-left col-md-6">
          <!-- Button to open add row modal -->
          <button
            v-if="mode === 'edit'"
            class="btn btn-primary btn-new-row"
            @click="openAddRowModal"
          >
            <i class="bi-plus-circle" />Add New Row
          </button>

          <button
            v-if="mode === 'edit'"
            class="btn btn-primary btn-add-multiple-rows"
            @click="openPasteModal"
          >
            <i class="bi-table" />Paste Multiple Rows
          </button>

          <button
            v-if="selectedRows.length"
            class="btn btn-primary btn-copy-selected-rows"
            @click="copySelectedRowsToClipboard"
          >
            <i class="bi-clipboard" />Copy {{ selectedRows.length }} Selected Row(s)
          </button>

          <!-- Delete Rows Button -->
          <button
            v-if="selectedRows.length && mode === 'edit'"
            class="btn btn-primary btn-delete-rows"
            @click="deleteSelectedRows"
          >
            <i class="bi-trash3" />Delete {{ selectedRows.length }} Selected Row(s)
          </button>
        </div>

        <div class="action-buttons-right col-md-6 text-md-end">
          <button
            v-if="isControlsManagerOrAbove && mode === 'edit'"
            id="undo-button"
            class="btn link-type-button"
            @click="undoChange"
          >
            <i class="bi bi-arrow-counterclockwise" />Undo Change
          </button>

          <button
            v-if="isControlsManagerOrAbove && mode === 'edit'"
            id="redo-button"
            class="btn link-type-button"
            @click="redoChange"
          >
            <i class="bi bi-arrow-clockwise" />Redo Change
          </button>

          <button class="btn link-type-button" @click="scrollToTopAndHighlight">
            <i class="bi-arrow-up-circle" /> Scroll to Top
          </button>

          <button class="btn link-type-button" @click="scrollToBottomAndHighlight(1)">
            <i class="bi-arrow-down-circle" /> Scroll to Bottom
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading spinner overlay -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div v-if="hasBulkTransaction" class="loading-overlay">
    <div class="progress col-md-5" style="height: 1.5rem; background: #8f8f8f">
      <div
        class="progress-bar progress-bar-striped progress-bar-animated"
        role="progressbar"
        :style="{ width: hasBulkTransaction + '%' }"
        aria-valuenow="25"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        {{ hasBulkTransaction }}%
      </div>
    </div>
  </div>

  <div v-if="showToast" class="toast-message">
    {{ toastMessage }}
    <button @click="showToast = false">Close</button>
  </div>

  <div v-if="showToastErr" class="toast-error">
    {{ toastErrMessage }}
    <button @click="showToastErr = false">Close</button>
  </div>

  <!-- MODAL DEFINITIONS -->
  <!--  ADD NEW SINGLE ROW modal -->
  <div
    id="addSingleRowModal"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="addRowModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- Modal Header -->
        <Form @submit="onSingleRowSubmit">
          <div class="modal-header">
            <h5 id="addRowModalLabel" class="modal-title">Add New Row</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          <!-- Modal Body with Form -->
          <div class="modal-body">
            <div class="container">
              <div class="row">
                <!-- Building Field -->
                <div class="col-md-4">
                  <label for="building">* Building</label>
                  <Field
                    id="building"
                    v-model="building"
                    name="building"
                    as="input"
                    class="form-control"
                  />
                  <span class="text-danger">{{ buildingError }}</span>
                </div>

                <!-- Level Field -->
                <div class="col-md-4">
                  <label for="level">* Level</label>
                  <Field id="level" v-model="level" name="level" as="input" class="form-control" />
                  <span class="text-danger">{{ levelError }}</span>
                </div>

                <!-- Salesforce Project ID Field -->
                <div class="col-md-4">
                  <label for="area">* Area</label>
                  <Field id="area" v-model="area" name="area" as="input" class="form-control" />
                  <span class="text-danger">{{ areaError }}</span>
                </div>
              </div>

              <div class="row">
                <!-- ShipPhase field -->
                <div class="col-md-4">
                  <label for="shipPhase">* Ship Phase</label>
                  <Field
                    id="ship-phase"
                    v-model="shipPhase"
                    name="shipPhase"
                    as="input"
                    class="form-control"
                  />
                  <span class="text-danger">{{ shipPhaseError }}</span>
                </div>

                <!-- BuildPhase field -->
                <div class="col-md-4">
                  <label for="buildPhase">* Build Phase</label>
                  <Field
                    id="build-phase"
                    v-model="buildPhase"
                    name="buildPhase"
                    as="input"
                    class="form-control"
                  />
                  <span class="text-danger">{{ buildPhaseError }}</span>
                </div>

                <!-- Scheme field -->
                <div class="col-md-4">
                  <label for="scheme">* Scheme</label>
                  <Field
                    id="scheme"
                    v-model="scheme"
                    name="scheme"
                    as="input"
                    class="form-control"
                  />
                  <span class="text-danger">{{ schemeError }}</span>
                </div>
              </div>

              <div class="row">
                <!-- unit field -->
                <div class="col-md-4">
                  <label for="unit">* Unit</label>
                  <Field id="unit" v-model="unit" name="unit" as="input" class="form-control" />
                  <span class="text-danger">{{ unitError }}</span>
                </div>

                <!-- Unit Type field -->
                <div class="col-md-4">
                  <label for="unitType">* Unit Type</label>
                  <Field
                    id="unitType"
                    v-model="unitType"
                    name="unitType"
                    as="input"
                    class="form-control"
                  />
                  <span class="text-danger">{{ unitTypeError }}</span>
                </div>

                <div class="col-md-4">
                  <label for="description">Description</label>
                  <Field
                    id="description"
                    v-model="description"
                    name="description"
                    as="input"
                    class="form-control"
                  />
                  <span class="text-danger">{{ descriptionError }}</span>
                </div>
              </div>

              <div class="row">
                <!-- Scope Type vue-select dropdown -->
                <div class="col-md-4 dropdown-container">
                  <label for="dropdownSelect">* Scope Type</label>
                  <v-select
                    id="scopeTypeSelect"
                    v-model="scopeTypeId"
                    :options="vSelectScopeTypesList"
                    label="label"
                    :reduce="(option: VSelectDropdownData) => option.id"
                    class="form-control"
                    placeholder="Select an option"
                  >
                  </v-select>
                  <span class="text-danger">{{ scopeTypeIdError }}</span>
                </div>

                <!-- Detail Code vue-select dropdown -->
                <div class="col-md-4 dropdown-container">
                  <label for="dropdownSelect">* Detail Code</label>
                  <v-select
                    id="detailCodeSelect"
                    v-model="detailCodeId"
                    :options="vSelectDetailCodesList"
                    label="label"
                    :reduce="(option: VSelectDropdownData) => option.id"
                    class="form-control"
                    placeholder="Select an option"
                  >
                  </v-select>
                  <span class="text-danger">{{ detailCodeError }}</span>
                </div>

                <!-- Location Type vue-select dropdown -->
                <div class="col-md-4 dropdown-container">
                  <label for="dropdownSelect">* Location Type</label>
                  <v-select
                    id="locationTypeSelect"
                    v-model="locationTypeId"
                    :options="vSelectLocationTypesList"
                    label="label"
                    :reduce="(option: VSelectDropdownData) => option.id"
                    class="form-control"
                    placeholder="Select an option"
                  >
                  </v-select>
                  <span class="text-danger">{{ locationTypeError }}</span>
                </div>
              </div>

              <div class="row">
                <!-- Cost Type vue-select dropdown -->
                <div class="col-md-4 dropdown-container">
                  <label for="dropdownSelect">* Cost Type</label>
                  <v-select
                    id="costTypeSelect"
                    v-model="costTypeId"
                    :options="vSelectCostTypesList"
                    label="label"
                    :reduce="(option: VSelectDropdownData) => option.id"
                    class="form-control"
                    placeholder="Select an option"
                  >
                  </v-select>
                  <span class="text-danger">{{ costTypeError }}</span>
                </div>

                <!-- Quantity field -->
                <div class="col-md-4">
                  <label for="quantity">* Quantity</label>
                  <Field
                    id="quantity"
                    v-model="quantity"
                    name="quantity"
                    as="input"
                    type="number"
                    class="form-control"
                  />
                  <span class="text-danger">{{ quantityError }}</span>
                </div>

                <!-- Starting Date Picker -->
                <div class="col-md-4">
                  <label for="startingDate">Start Date</label>
                  <Field
                    id="startingDate"
                    v-model="startingDate"
                    name="startingDate"
                    as="input"
                    type="date"
                    class="form-control"
                  />
                  <span class="text-danger">{{ startingDateError }}</span>
                </div>
              </div>

              <div class="row">
                <!-- Finish Date Picker -->
                <div class="col-md-4">
                  <label for="finishDate">Finish Date</label>
                  <Field
                    id="finishDate"
                    v-model="finishDate"
                    name="finishDate"
                    as="input"
                    type="date"
                    class="form-control"
                  />
                  <span class="text-danger">{{ finishDateError }}</span>
                </div>

                <!-- Percent Complete field -->
                <div class="col-md-4">
                  <label for="percentComplete">% Complete</label>
                  <Field
                    id="percentComplete"
                    v-model="percentComplete"
                    name="percentComplete"
                    as="input"
                    type="number"
                    class="form-control"
                  />
                  <span class="text-danger">{{ percentCompleteError }}</span>
                </div>

                <!-- Actual Man Hours field -->
                <div class="col-md-4">
                  <label for="actualManHours">Actual Man Hours</label>
                  <Field
                    id="actualManHours"
                    v-model="actualManHours"
                    name="actualManHours"
                    as="input"
                    type="number"
                    class="form-control"
                  />
                  <span class="text-danger">{{ actualManHoursError }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer with Actions -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              @click="resetForm"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!isAddSingleRowFormValid">
              Add Row
            </button>
          </div>
        </Form>
      </div>
    </div>
  </div>

  <!--  PASTE IN MULTIPLE ROWS modal -->
  <div
    id="pasteModal"
    ref="pasteModalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="pasteModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">Paste Spreadsheet Data</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <textarea v-model="pastedData" class="form-control" rows="5"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="processMultiplePastedRows">
            Process
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
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

  i {
    margin-right: 5px;
    color: #7a7a7a;
  }

  .bi-x-circle {
    margin-left: 5px;
  }

  .project-actions {
    margin: 10px 30px;
    width: inherit;
    /* color: #19A7AF; */
  }

  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }

  .project-rows-count {
    margin: 0 30px;
    width: inherit;
    color: #19a7af;
  }

  .bi-plus-circle,
  .bi-table,
  .bi-trash3,
  .bi-clipboard {
    margin-right: 5px;
    color: #7a7a7a;
  }

  .btn-new-row,
  .btn-add-multiple-rows,
  .btn-delete-rows,
  .btn-copy-selected-rows {
    background: none;
    border: none;
    color: #19a7af;
    cursor: pointer;
    padding-left: 5px;
  }

  .btn-delete-rows {
    color: #dc3545;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border: none;
    margin-left: 5px;
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

  .btn-group .btn-action-group {
    border-radius: 0 !important;
    font-weight: 500;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    box-shadow: 0 1px 4px rgba(30, 144, 255, 0.08);
    background: #fff;
    color: #19a7af;
    border-color: #19a7af;
    margin-right: -1px;
  }
  .btn-group .btn-action-group:first-child {
    border-top-left-radius: 6px !important;
    border-bottom-left-radius: 6px !important;
  }
  .btn-group .btn-action-group:last-child {
    border-top-right-radius: 6px !important;
    border-bottom-right-radius: 6px !important;
    margin-right: 0;
  }
  .btn-group .btn-action-group:hover,
  .btn-group .btn-action-group:focus {
    background: #e6f7fa;
    color: #19a7af;
    border-color: #19a7af;
    z-index: 1;
  }

  /* On very small screens, stack project action buttons vertically */
  @media (max-width: 526px) {
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
      width: 100%;
    }

    .btn-group .btn-action-group {
      width: 100%;
      margin-right: 0 !important;
      border-radius: 6px !important;
    }

    .header-body {
      margin-top: 20px;
      padding: 5px 20px;
    }
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

  .toast-error {
    background-color: #e34e4e !important;
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
    max-width: 30%;
  }

  .toast-error button {
    border: none;
    background: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
  }

  :deep(.tabulator-row.highlight-new-row) {
    background-color: #ffff99; /* Light yellow background */
    transition: background-color 0.5s ease-in;
  }

  :deep(.tabulator-row.fade-highlight) {
    transition: background-color 0.5s ease-out;
    background-color: transparent;
  }

  .project-info {
    color: rgb(60, 60, 60);
    padding: 0 30px 10px 30px;
  }

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  .project-info .row {
    max-width: 100%; /* Limit the maximum width to 75% */
    margin-left: 0; /* Keep it left-aligned */
  }

  .project-info strong {
    font-weight: bold;
    white-space: normal;
    word-wrap: break-word;
  }

  .project-info div {
    word-wrap: break-word;
  }

  .table-container {
    min-height: 300px;
    max-height: 70vh;
    overflow-y: auto;
    width: 95%;
    margin-left: 2.5%;
    margin-right: 2.5%;
  }

  .action-buttons {
    width: inherit;
    position: sticky;
    bottom: 0;
    background: #fff;
    z-index: 1025;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 30px;
    padding-right: 30px;
    box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.06);
  }

  .action-buttons button {
    margin-right: 10px;
  }

  .dropdown-container .form-control {
    padding: 0;
    border: none;
  }

  :deep(.calculated-field) {
    background-color: rgba(237, 237, 237, 0.6);
  }

  :deep(.tabulator-col[tabulator-field='scopeCode']),
  :deep(.tabulator-cell[tabulator-field='scopeCode']),
  :deep(.tabulator-col[tabulator-field='uomName']),
  :deep(.tabulator-cell[tabulator-field='uomName']),
  :deep(.tabulator-col[tabulator-field='unitRate']),
  :deep(.tabulator-cell[tabulator-field='unitRate']),
  :deep(.tabulator-col[tabulator-field='budgetedManHours']),
  :deep(.tabulator-cell[tabulator-field='budgetedManHours']),
  :deep(.tabulator-col[tabulator-field='installedQuantity']),
  :deep(.tabulator-cell[tabulator-field='installedQuantity']),
  :deep(.tabulator-col[tabulator-field='earnedManHours']),
  :deep(.tabulator-cell[tabulator-field='earnedManHours']),
  :deep(.tabulator-col[tabulator-field='productivityFactor']),
  :deep(.tabulator-cell[tabulator-field='productivityFactor']),
  :deep(.tabulator-col[tabulator-field='createdAt']),
  :deep(.tabulator-cell[tabulator-field='createdAt']),
  :deep(.tabulator-col[tabulator-field='updatedAt']),
  :deep(.tabulator-cell[tabulator-field='updatedAt']) {
    background-color: #ededed;
  }

  :deep(.tabulator-header) {
    color: #3c3c3c;
    font-weight: 700;
  }

  :deep(.tabulator) {
    /* font-size: 14px; */
    color: rgb(60, 60, 60);
    font-size: 13.5px;
  }

  :deep(.tabulator-row .tabulator-cell) {
    overflow: hidden;
    border-right: 1px solid #dee2e6;
  }

  :deep(.tabulator .tabulator-header .tabulator-col) {
    border-right: 1px solid #dee2e6;
  }

  :deep(.tabulator .tabulator-header .tabulator-col[tabulator-field='unit']) {
    border-right: 2px solid #dee2e6;
  }

  :deep(.tabulator-row.tabulator-calcs .tabulator-cell) {
    height: 40px !important;
    text-align: center;
  }

  :deep(.tabulator-header .tabulator-calcs-holder) {
    border-top: none;
  }

  @media (max-width: 992px) {
    .project-info .row {
      max-width: 100%; /* Allow full width on smaller screens */
      flex-wrap: wrap; /* Enable wrapping */
    }
    .project-info .col-md-3 {
      flex-basis: 100%; /* Full width for each column on smaller screens */
      max-width: 100%;
    }
  }
</style>
