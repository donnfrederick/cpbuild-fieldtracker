<script setup lang="ts">
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import { ref, onMounted, onUnmounted, computed } from 'vue';

  import { FieldTrackerServiceProxy } from '@/shared/service-proxies/service-proxies';

  import { useToolStore } from '@/stores/toolStore';
  import { useAuthStore } from '../stores/useAuthStore';
  import type { CellComponent } from 'tabulator-tables';
  import axios from 'axios';

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
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  // api service proxy
  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy(apiBaseUrl);

  // Computed Properties
  const isLoading = ref(false);
  const hasApiError = ref(false);
  const apiErrorMessage = ref<string>('');
  const showToast = ref(false);
  const toastMessage = ref('');
  const completedProjectsList = computed(() => toolStore.fieldTrackerCompletedProjectsData);
  const showTable = computed(() => toolStore.activeFieldTrackerTab === 'completed');

  let table: any = ref(null);
  let tabulator: any = ref(null);

  const setProjectDataByStatus = async (statusType: string) => {
    const projectDataResponse = await toolStore.setFieldTrackerProjectsData(statusType);

    if (projectDataResponse.error) {
      hasApiError.value = true;
      apiErrorMessage.value =
        projectDataResponse.message ||
        `Error loading "${statusType}"" projects. Please close the tool and try again.`;
    } else if (projectDataResponse.data) {
      if (tabulator.value) {
        tabulator.value.setData(completedProjectsList.value);
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
      data: completedProjectsList.value,
      reactiveData: true,
      layout: 'fitDataTable',
      clipboard: true,
      initialSort: [{ column: 'projectName', dir: 'asc' }],
      columns: [
        {
          title: 'Project',
          field: 'projectName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
          width: 220,
        },
        {
          title: 'Salesforce ID',
          field: 'salesforceId',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by ID',
        },
        {
          title: 'State',
          field: 'stateCode',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by State',
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

  const reactivateProject = async (ftProjectId: number) => {
    isLoading.value = true;

    try {
      await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '',
          targetUrl: `${apiBaseUrl}/field-tracker/project/${ftProjectId}/status/update/active`,
          targetMethodType: 'PATCH',
        },
        { timeout: 10000 }
      );
    } catch (error) {
      console.error('Error reactivating project:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error marking project as active. Please try again.';
    } finally {
      isLoading.value = false;
    }

    localStorage.setItem('activeFieldTrackerTab', 'completed');
    localStorage.setItem(
      'toastMessage',
      'Project marked as active and can now be found under the "Active" tab.'
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

  const actionMenuFormatter = (cell: CellComponent, formatterParams: any, onRendered: any) => {
    const projectData: any = cell.getRow().getData();

    onRendered(() => {
      // Attach event listeners to Preview and Edit as before
      if (authStore.hasAdminRole || authStore.hasControlsManagerRole) {
        cell
          .getElement()
          .querySelector('.reactivate-project')
          ?.addEventListener('click', (e) => {
            e.stopPropagation();
            reactivateProject(projectData.rootProjectId); // this is actually mislabled and rootProjectId and ftProjectId need to be swapped in the endpoint that gets project data
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
    let menuOptions = ``;

    if (authStore.hasAdminRole || authStore.hasControlsManagerRole) {
      menuOptions += `<li><a class="dropdown-item reactivate-project" href="#">Reactivate</a></li>`;
      menuOptions += `<li><a class="dropdown-item delete-project" href="#">Delete</a></li>`;
    }

    if (authStore.hasAdminRole || authStore.hasControlsManagerRole) {
      // Return the complete dropdown menu HTML
      return `
            <div class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" type="button" id="actionMenuButton-${cell
                  .getRow()
                  .getIndex()}" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 12px; height: 30px; margin-top: -6px">
                    Actions
                </button>
                <ul class="dropdown-menu" aria-labelledby="actionMenuButton-${
                  projectData.ftProjectId
                }">
                    ${menuOptions}
                </ul>
            </div>
        `;
    } else {
      return '';
    }
  };

  onMounted(async () => {
    isLoading.value = true;

    if (toolStore.fieldTrackerCompletedProjectsData === null) {
      await setProjectDataByStatus('completed');
    } else {
      await toolStore.getFieldTrackerProjectsData('completed');
    }

    // Iitialize Tubulator after data is fetched
    if (completedProjectsList.value) {
      initializeTabulator();
    } else {
      hasApiError.value = true;
      apiErrorMessage.value =
        'There was an issue loading completed projects. Please refresh the page to try again. If the does not work, try closing the browser tab and navigating back to the tool.';
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

    <div v-show="showTable" ref="table" class="completed-table-container"></div>
  </div>
</template>

<style scoped>
  .completed-table-container {
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
</style>
