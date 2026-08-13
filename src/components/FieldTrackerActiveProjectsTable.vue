<script setup lang="ts">
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { FieldTrackerServiceProxy } from '@/shared/service-proxies/service-proxies';

  import { useToolStore } from '@/stores/toolStore';
  import { useAuthStore } from '../stores/useAuthStore';
  import type { ProjectData } from '@/interfaces/fieldTracker';
  import type { CellComponent } from 'tabulator-tables';

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

  // Variable Initializations
  const authStore = useAuthStore();
  const toolStore = useToolStore();
  const router = useRouter();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  // Computed Properties
  const isLoading = ref(false);
  const hasApiError = ref(false);
  const apiErrorMessage = ref<string>('');
  const showToast = ref(false);
  const toastMessage = ref('');
  const activeProjectsList = computed(() => toolStore.fieldTrackerActiveProjectsData);
  const showTable = computed(() => toolStore.activeFieldTrackerTab === 'active');

  // api service proxy
  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy(apiBaseUrl);

  let table: any = ref(null);
  let tabulator: any = ref(null);

  function tableCellFormatted(title: string, content: string) {
    return `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; box-sizing: border-box;" title="${title}">${content}</div>`;
  }

  function projectNameFormatter(cell: CellComponent, _formatterParams: any, _onRendered: any) {
    const data = cell.getRow().getData();
    const projectName = data.projectName || 'Unnamed Project';

    return tableCellFormatted(projectName, projectName);
  }

  function saleForceIdFormatter(cell: CellComponent, _formatterParams: any, _onRendered: any) {
    const data = cell.getRow().getData();
    const salesforceId = data.salesforceId || 'ID not set';

    return tableCellFormatted(salesforceId, salesforceId);
  }

  function siteLocationFormatter(cell: CellComponent, _formatterParams: any, _onRendered: any) {
    const data = cell.getRow().getData();

    let content = '';
    if (
      data.siteLocStreetAddress != null &&
      data.siteLocCity != null &&
      data.siteLocPostalCode != null
    ) {
      content = `${data.siteLocStreetAddress}, ${data.siteLocCity}, ${data.stateName}, ${data.siteLocPostalCode}`;
    } else {
      content = 'Full Address not set';
    }

    return tableCellFormatted(content, content);
  }

  function expectedStartDateFormatter(
    cell: CellComponent,
    _formatterParams: any,
    _onRendered: any
  ) {
    const data = cell.getRow().getData();

    if (data.expectedStartDate) {
      const parsedDate = new Date(data.expectedStartDate);

      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString('en-US', {
          timeZone: 'America/Denver', // Mountain Time
          weekday: 'short', // Sun
          year: 'numeric', // 2024
          month: 'short', // Sep
          day: 'numeric', // 15
        });
      } else {
        console.error('Invalid date format:', data.expectedStartDate);
        return 'Date not set';
      }
    } else {
      return 'Date not set';
    }
  }

  const setProjectDataByStatus = async (statusType: string) => {
    const projectDataResponse = await toolStore.setFieldTrackerProjectsData(statusType);

    if (projectDataResponse.error) {
      hasApiError.value = true;
      apiErrorMessage.value =
        projectDataResponse.message ||
        `Error loading "${statusType}"" projects. Please close the tool and try again.`;
    } else if (projectDataResponse.data) {
      if (tabulator.value) {
        tabulator.value.setData(activeProjectsList.value);
      }
    }
  };

  const initializeTabulator = () => {
    tabulator.value?.destroy();

    tabulator.value = new Tabulator(table.value, {
      height: `calc(100vh - 300px)`,
      rowHeight: 45,
      history: true,
      index: 'id',
      selectableRange: false,
      selectableRowsPersistence: false,
      data: activeProjectsList.value,
      reactiveData: true,
      layout: 'fitDataTable',
      clipboard: true,
      initialSort: [{ column: 'projectName', dir: 'asc' }],
      columns: [
        {
          title: 'Project',
          field: 'projectName',
          formatter: projectNameFormatter,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
          width: 220,
        },
        {
          title: 'Salesforce ID',
          field: 'salesforceId',
          headerFilter: 'input',
          formatter: saleForceIdFormatter,
          headerFilterPlaceholder: 'Filter by ID',
        },
        {
          title: 'Site Location',
          field: 'siteLocStreetAddress',
          formatter: siteLocationFormatter,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Location',
          width: 300,
        },
        {
          title: 'Expected Start Date',
          field: 'expectedStartDate',
          formatter: expectedStartDateFormatter,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Date',
          width: 300,
        },
        {
          title: 'Project Manager',
          field: 'projectManagerName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
        },
        {
          title: 'Install Manager',
          field: 'installManagerName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
        },
        {
          title: 'Date Created',
          field: 'createdAt',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Date',
        },
        {
          title: 'Created By',
          field: 'createdByName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
        },
        { title: '', formatter: actionMenuFormatter, headerSort: false },
      ],
    });
  };

  const previewProject = (projectData: ProjectData) => {
    toolStore.setCurrentProjectInfo(projectData);
    localStorage.setItem('currentProjectInfo', JSON.stringify(projectData));
    router.push({
      name: 'field-tracker-project-viewer',
      params: { id: projectData.rootProjectId, mode: 'preview' },
    });
  };

  const editProject = (projectData: ProjectData) => {
    toolStore.setCurrentProjectInfo(projectData);
    localStorage.setItem('currentProjectInfo', JSON.stringify(projectData));
    router.push({
      name: 'field-tracker-project-viewer',
      params: { id: projectData.rootProjectId, mode: 'edit' },
    });
  };

  //TODO: Uncomment this when the endpoint is implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const completeProject = async (ftProjectId: number) => {
    isLoading.value = true;

    try {
      // await fieldTrackerServiceProxy.completeProject(ftProjectId);
    } catch (error) {
      console.error('Error completing project:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error marking project as completed. Please try again.';
    } finally {
      isLoading.value = false;
    }

    localStorage.setItem('activeFieldTrackerTab', 'active');
    localStorage.setItem(
      'toastMessage',
      'Project marked as completed and can now be found under the "Completed" tab.'
    );

    window.location.reload();
  };

  const deleteProject = async (ftProjectId: number) => {
    isLoading.value = true;

    try {
      await fieldTrackerServiceProxy.deleteProject(ftProjectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error marking project as deleted. Please try again.';
    } finally {
      isLoading.value = false;
    }

    localStorage.setItem('activeFieldTrackerTab', 'completed');
    localStorage.setItem(
      'toastMessage',
      'Project marked as deleted and can now be found under the "Deleted" tab.'
    );

    window.location.reload();
  };

  const actionMenuFormatter = (cell: CellComponent, _formatterParams: any, _onRendered: any) => {
    const projectData: any = cell.getRow().getData();

    _onRendered(() => {
      // Attach event listeners to Preview and Edit as before
      cell
        .getElement()
        .querySelector('.preview-project')
        ?.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent event from bubbling up
          previewProject(projectData);
        });

      cell
        .getElement()
        .querySelector('.edit-project')
        ?.addEventListener('click', (e) => {
          e.stopPropagation();
          editProject(projectData);
        });

      // Conditionally attach event listeners to Complete and Delete, if those options exist
      if (authStore.hasAdminRole || authStore.hasControlsManagerRole) {
        cell
          .getElement()
          .querySelector('.complete-project')
          ?.addEventListener('click', (e) => {
            e.stopPropagation();
            completeProject(projectData.rootProjectId); // this is actually mislabled and rootProjectId and ftProjectId need to be swapped in the endpoint that gets project data
          });

        cell
          .getElement()
          .querySelector('.delete-project')
          ?.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProject(projectData.rootProjectId); // same as above. rootProjectId and ftProjectId need to be swapped
          });
      }
    });

    // Dynamically build the menu options, including conditional rendering
    let menuOptions = `
        <li><a class="dropdown-item preview-project" href="#">Preview</a></li>
    `;

    if (authStore.hasAdminRole || authStore.hasControlsManagerRole) {
      menuOptions += `<li><a class="dropdown-item edit-project" href="#">Edit</a></li>`;
      menuOptions += `<li><a class="dropdown-item complete-project" href="#">Complete</a></li>`;
      menuOptions += `<li><a class="dropdown-item delete-project" href="#">Delete</a></li>`;
    } else if (
      authStore.hasInstallManagerRole ||
      authStore.hasInstallDirectorRole ||
      authStore.hasProjectManagerRole
    ) {
      menuOptions += `<li><a class="dropdown-item edit-project" href="#">Edit</a></li>`;
    }

    // Return the complete dropdown menu HTML
    return `
        <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="actionMenuButton-${cell
              .getRow()
              .getIndex()}" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 12px; height: 30px; margin-top: -6px">
                Actions
            </button>
            <ul class="dropdown-menu" aria-labelledby="actionMenuButton-${projectData.ftProjectId}">
                ${menuOptions}
            </ul>
        </div>
    `;
  };

  onMounted(async () => {
    isLoading.value = true;

    await setProjectDataByStatus('active');
    await toolStore.getFieldTrackerProjectsData('active');

    // Iitialize Tubulator after data is fetched
    if (activeProjectsList.value.length > 0) {
      initializeTabulator();
    } else {
      hasApiError.value = true;
      apiErrorMessage.value =
        'There was an issue loading active projects. Please refresh the page to try again. If the does not work, try closing the browser tab and navigating back to the tool.';
    }
    isLoading.value = false;
  });

  onUnmounted(() => {
    tabulator.value?.destroy();
  });
</script>

<template>
  <div>
    <div v-if="showToast" class="toast-message">
      {{ toastMessage }}
      <button @click="showToast = false">Close</button>
    </div>

    <div v-if="hasApiError" class="error-message">
      {{ apiErrorMessage }}
    </div>

    <!-- Loading spinner overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-show="showTable" ref="table" class="active-table-container"></div>
  </div>
</template>

<style scoped>
  .active-table-container {
    overflow-y: auto;
    width: 100%;
  }

  .error-message {
    color: #dc3545;
    padding: 10px 30px;
    text-align: center;
    width: 100%;
    background-color: #f8d7da;
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

  :deep(.tabulator-row div.tabulator-cell) {
    border-right: 1px solid #dee2e6;
  }

  :deep(div.tabulator-cell .btn-secondary) {
    background-color: #19a7af;
    color: white;
    border: none;
    padding: 5px 10px;
    font-size: 12px;
    height: 30px;
    margin-top: -6px;
  }
</style>
