<script setup lang="ts">
  import vSelect from 'vue-select';
  import axios from 'axios';
  import * as yup from 'yup';
  import { useRouter, onBeforeRouteLeave } from 'vue-router';
  import { useForm, useField, Field } from 'vee-validate';
  import { ref, onMounted, onUnmounted, computed, watchEffect, watch } from 'vue';
  import { Modal } from 'bootstrap';
  import 'vue-select/dist/vue-select.css';
  import 'tabulator-tables/dist/css/tabulator_bootstrap5.min.css';

  import TopNavBar from '@/components/TopNavBar.vue';
  import ToolHeader from '@/components/ToolHeader.vue';
  import ConfirmModal from '@/components/ConfirmModal.vue';
  import ActiveProjectsTable from '@/components/FieldTrackerActiveProjectsTable.vue';
  import CompletedProjectsTable from '@/components/FieldTrackerCompletedProjectsTable.vue';
  import DeletedProjectsTable from '@/components/FieldTrackerDeletedProjectsTable.vue';
  import { useToolStore } from '@/stores/toolStore';
  import { useAuthStore } from '@/stores/useAuthStore';
  import type { ProjectData } from '@/interfaces/fieldTracker';
  import type { ApiData, DropdownOption } from '@/interfaces/common';
  import type { FormValues } from '@/interfaces/fieldTrackerTool';
  import {
    CreateNewProjectDto,
    FieldTrackerServiceProxy,
  } from '@/shared/service-proxies/service-proxies';

  // Variable Initializations
  const authStore = useAuthStore();
  const router = useRouter();
  const isUserDataReady = computed(() => authStore.isUserDataReady);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  // Computed Properties
  const isLoading = ref(false);
  const hasApiError = ref(false);
  const apiErrorMessage = ref<string>('');
  const userRoleString = ref<string>('');
  const userId = ref<number | null>(0);
  const currentToolName = ref('Field Tracker');
  const showNewProjectModal = ref(false);
  const showConfirmCreateModal = ref(false);
  const showConfirmCancelModal = ref(false);
  const projectManagerOptions = ref<DropdownOption[]>([]);
  const installManagerOptions = ref<DropdownOption[]>([]);
  const stateOptions = ref<DropdownOption[]>([]);
  const activeProjectsList = ref<ProjectData[]>([]);
  const isCreateProjectModalOpen = ref(false);
  const toolStore = useToolStore();
  const showNavigationConfirmModal = ref(false);
  const activeTab = ref(localStorage.getItem('activeFieldTrackerTab') || 'active');
  const showToast = ref(false);
  const toastMessage = ref('');
  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy();

  let confirmModalInstance: any = null;
  let currentFormValues = ref<FormValues>({
    projectName: '',
    salesforceId: '',
    siteLocStreetAddress: '',
    siteLocCity: '',
    siteLocPostalCode: '',
    expectedStartDate: '',
    projectManagerId: 0,
    installManagerId: 0,
    stateId: 0,
  });

  // Styles for active and inactive tabs
  const activeTabStyle = {
    color: '#19A7AF',
    fontWeight: '600',
    fontSize: '13px',
  };

  const inactiveTabStyle = {
    color: '#6C757D',
    fontSize: '13px',
  };

  const setActiveTab = (tab: string) => {
    activeTab.value = tab;
    toolStore.setActiveFieldTrackerTab(tab);
  };

  // Define a schema
  const schema = yup.object({
    projectName: yup.string().required('Project Name is required'),
    salesforceId: yup.string(),
    siteLocStreetAddress: yup.string().required('Street Name is required'),
    siteLocCity: yup.string().required('City is required'),
    siteLocPostalCode: yup.string().required('Postal Code is required'),
    expectedStartDate: yup.date().required('Expected Start Date is required'),
    projectManagerId: yup.number().required('Project Manager is required'),
    installManagerId: yup.number().required('Install Manager is required'),
    stateId: yup.number().required('Install state is required'),
  });

  // Setup the form
  const { handleSubmit, meta } = useForm({
    validationSchema: schema,
  });

  // Define fields
  const { value: projectName, errorMessage: projectNameError } = useField('projectName');
  const { value: salesforceId, errorMessage: salesforceIdError } = useField('salesforceId');
  const { value: siteLocStreetAddress, errorMessage: siteLocStreetError } =
    useField('siteLocStreetAddress');
  const { value: siteLocCity, errorMessage: siteLocCityError } = useField('siteLocCity');
  const { value: siteLocPostalCode, errorMessage: siteLocPostalError } =
    useField('siteLocPostalCode');
  const { value: expectedStartDate, errorMessage: expectedStartDateError } =
    useField('expectedStartDate');
  const { value: projectManagerId, errorMessage: projectManagerError } =
    useField('projectManagerId');
  const { value: installManagerId, errorMessage: installManagerError } =
    useField('installManagerId');
  const { value: stateId, errorMessage: installStateError } = useField('stateId');

  // Computed property to check if all fields including dropdowns are valid
  const isFormValid = computed(() => {
    return meta.value.valid;
  });

  const onSubmit = handleSubmit((values) => {
    if (!isUserDataReady.value || !userId.value) {
      return;
    }
    showConfirmCreateModal.value = true;
    // Store the form values for later submission
    // Cast values to the specific type
    currentFormValues.value = {
      projectName: values.projectName,
      salesforceId: values.salesforceId,
      siteLocStreetAddress: values.siteLocStreetAddress,
      siteLocCity: values.siteLocCity,
      siteLocPostalCode: values.siteLocPostalCode,
      expectedStartDate: values.expectedStartDate,
      projectManagerId: values.projectManagerId,
      installManagerId: values.installManagerId,
      stateId: values.stateId,
    } as FormValues;
  });

  const submitForm = async () => {
    if (!userId.value) {
      console.error('User ID is not set.');
      return;
    }
    const newProjectRequestBody = {
      projectName: currentFormValues.value.projectName,
      salesforceId: currentFormValues.value.salesforceId,
      siteLocStreetAddress: currentFormValues.value.siteLocStreetAddress,
      siteLocCity: currentFormValues.value.siteLocCity,
      siteLocPostalCode: currentFormValues.value.siteLocPostalCode,
      expectedStartDate: currentFormValues.value.expectedStartDate,
      projectManagerId: currentFormValues.value.projectManagerId,
      installManagerId: currentFormValues.value.installManagerId,
      stateId: currentFormValues.value.stateId,
      createdBy: userId.value !== null ? userId.value : 0,
    } as CreateNewProjectDto;

    isLoading.value = true;

    try {
      await fieldTrackerServiceProxy.createNewProject(newProjectRequestBody);

      await fetchActiveProjectData();
      localStorage.setItem(
        'toastMessage',
        `"${currentFormValues.value.projectName}" project created successfully!`
      );

      // Reset the form values so it doesn't load it with the previous values next time it's opened
      currentFormValues.value = {
        projectName: '',
        salesforceId: '',
        siteLocStreetAddress: '',
        siteLocCity: '',
        siteLocPostalCode: '',
        expectedStartDate: '',
        projectManagerId: 0,
        installManagerId: 0,
        stateId: 0,
      };
    } catch (error) {
      console.error('Error creating the new Field Tracker project:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error creating the new Field Tracker project. Please try again.';
    } finally {
      isLoading.value = false;
      await fetchActiveProjectData();
    }
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

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (isCreateProjectModalOpen.value) {
      const message = 'You have unsaved changes! Are you sure you want to leave?';
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  };

  onMounted(async () => {
    await fetchActiveProjectData();

    localStorage.removeItem('currentProjectInfo'); // Clear any previous project data
    localStorage.removeItem('activeFieldTrackerTab'); // Clear any previous active tab

    // Add event listener when the component is mounted
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (!isUserDataReady.value) {
      await authStore.fetchAndSetUserInfo();
    }

    // Initialize Bootstrap modal instance
    const modalElement = document.getElementById('createProjectModal');
    if (modalElement) {
      confirmModalInstance = new Modal(modalElement, {
        keyboard: false,
        backdrop: 'static',
      });
    }

    const currentToastMessage = localStorage.getItem('toastMessage');
    if (currentToastMessage) {
      toastMessage.value = currentToastMessage;
      showToast.value = true;
      localStorage.removeItem('toastMessage');
    }

    setTimeout(() => {
      showToast.value = false;
    }, 5000);
  });

  onUnmounted(() => {
    // Remove event listener when the component is unmounted
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  const fetchActiveProjectData = async () => {
    await toolStore.setFieldTrackerProjectsData('active');
    const projectDataResponse = await toolStore.getFieldTrackerProjectsData('active');

    if (projectDataResponse.error) {
      hasApiError.value = true;
      apiErrorMessage.value =
        projectDataResponse.message ||
        'Error loading active projects. Please close the tool and try again.';
    } else if (projectDataResponse.data) {
      activeProjectsList.value = projectDataResponse.data;
    }
  };

  const fetchInitialNewProjectFormData = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      const statesRequestBody = {
        userRoles: userRoleString.value,
        targetUrl: `${apiBaseUrl}/states/list`,
        targetMethodType: 'GET',
      };

      const responses = await Promise.allSettled([
        fieldTrackerServiceProxy.getUsers(),
        axios.post(`${apiBaseUrl}/api-proxy`, statesRequestBody, {
          timeout: 10000,
        }),
      ]);

      // Check responses and handle accordingly
      if (responses[0].status === 'fulfilled' && responses[1].status === 'fulfilled') {
        const usersData = responses[0].value as ApiData[];
        const statesData = responses[1].value.data;

        // Transform and update options
        projectManagerOptions.value = usersData.map((user: ApiData) => ({
          name: user.name,
          id: user.id,
        }));
        installManagerOptions.value = usersData.map((user: ApiData) => ({
          name: user.name,
          id: user.id,
        }));
        stateOptions.value = statesData.map((state: ApiData) => ({
          name: state.name,
          id: state.id,
        }));

        // Open the modal here if all requests are successful
        openNewProjectModal();
      } else {
        // Handle errors
        hasApiError.value = true;
        apiErrorMessage.value = 'Error loading new project options. Please try again.';
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error loading new project options. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  const openNewProjectModal = () => {
    if (confirmModalInstance) {
      confirmModalInstance.show();
      isCreateProjectModalOpen.value = true;
    }
  };

  const closeNewProjectModal = () => {
    if (confirmModalInstance) {
      confirmModalInstance.hide();
    }
    showNewProjectModal.value = false;
    isCreateProjectModalOpen.value = false;
  };

  // Function to toggle confirm cancel modal
  const toggleConfirmCancelModal = () => {
    showConfirmCancelModal.value = !showConfirmCancelModal.value;
  };

  // Handlers for create and cancel
  const handleCreateConfirm = () => {
    closeNewProjectModal(); // Close the new project modal
    showConfirmCreateModal.value = false; // Close the confirm modal
    submitForm(); // Call submitForm to proceed with form submission
    isCreateProjectModalOpen.value = false;
  };

  const handleCancelConfirm = () => {
    closeNewProjectModal(); // Close the new project modal
    showConfirmCancelModal.value = false; // Close the confirm modal
    isCreateProjectModalOpen.value = false;
  };

  const handleNavigationConfirm = async () => {
    const navigationDetails = toolStore.getNavigationDetails();

    if (navigationDetails) {
      navigationDetails.next(); // Resume navigation
      router.push({ name: 'dashboard' });
    } else {
      // Fallback navigation, e.g., to dashboard
      router.push({ name: 'dashboard' });
    }
    toolStore.closeTool();
    showNavigationConfirmModal.value = false;
  };

  const handleNavigationCancel = () => {
    showNavigationConfirmModal.value = false;
    // Potentially reset navigation details in toolStore
  };

  onBeforeRouteLeave((to, from, next) => {
    if (
      toolStore.isToolOpen &&
      from.name === 'field-tracker' &&
      to.name !== 'field-tracker-project-viewer'
    ) {
      showNavigationConfirmModal.value = true;
      toolStore.setNavigationDetails({ to, from, next });
      next(false); // Prevent immediate navigation
    } else {
      next(); // Allow navigation
    }
  });
</script>

<template>
  <div class="field-tracker-body">
    <!-- Loading spinner overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-if="showToast" class="toast-message">
      {{ toastMessage }}
      <button @click="showToast = false">Close</button>
    </div>

    <TopNavBar />

    <ToolHeader :tool-name="currentToolName" />
    <div class="sub-header-content d-flex justify-content-between">
      <button
        v-if="authStore.hasAdminRole || authStore.hasControlsManagerRole"
        class="btn btn-primary btn-new-project"
        :disabled="isLoading"
        @click="fetchInitialNewProjectFormData"
      >
        <i class="bi-plus-circle" />CREATE NEW PROJECT
      </button>

      <div v-if="hasApiError" class="error-message">
        {{ apiErrorMessage }}
      </div>
    </div>

    <!-- Project Status Type Tabs -->
    <div class="project-status-tabs">
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'active' }"
            :style="activeTab === 'active' ? activeTabStyle : inactiveTabStyle"
            href="#"
            @click.prevent="setActiveTab('active')"
          >
            Active
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'completed' }"
            :style="activeTab === 'completed' ? activeTabStyle : inactiveTabStyle"
            href="#"
            @click.prevent="setActiveTab('completed')"
          >
            Completed
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'deleted' }"
            :style="activeTab === 'deleted' ? activeTabStyle : inactiveTabStyle"
            href="#"
            @click.prevent="setActiveTab('deleted')"
          >
            Deleted
          </a>
        </li>
      </ul>

      <div class="table-container">
        <ActiveProjectsTable v-show="activeTab === 'active'" />
        <CompletedProjectsTable v-show="activeTab === 'completed'" />
        <DeletedProjectsTable v-show="activeTab === 'deleted'" />
      </div>
    </div>

    <!-- Navigation Confirm Modal -->
    <ConfirmModal
      v-model="showNavigationConfirmModal"
      :title="'Are you sure you want to leave this page?'"
      @confirm="handleNavigationConfirm"
    >
      Changes you made may not be saved.
      <template #footer>
        <button class="btn" @click="handleNavigationCancel">Stay</button>
        <button class="btn btn-danger" @click="handleNavigationConfirm">Leave</button>
      </template>
    </ConfirmModal>

    <!-- Main Create New Project Modal -->
    <div
      id="createProjectModal"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="createProjectModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="onSubmit">
            <div class="modal-header">
              <h5 id="createProjectModalLabel" class="modal-title">Create New Project</h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="toggleConfirmCancelModal"
              ></button>
            </div>
            <div class="modal-body">
              <div class="container">
                <div class="row">
                  <!-- Project Name Field -->
                  <div class="col-md-6">
                    <label for="projectName">* Project Name</label>
                    <Field
                      id="projectName"
                      v-model="projectName"
                      name="projectName"
                      as="input"
                      class="form-control"
                    />
                    <span class="text-danger">{{ projectNameError }}</span>
                  </div>

                  <!-- Salesforce Project ID Field -->
                  <div class="col-md-6">
                    <label for="salesforceId">* Salesforce Project ID</label>
                    <Field
                      id="salesforceId"
                      v-model="salesforceId"
                      name="salesforceId"
                      as="input"
                      class="form-control"
                    />
                    <span class="text-danger">{{ salesforceIdError }}</span>
                  </div>
                </div>

                <div class="row">
                  <!-- Street Address Field -->
                  <div class="col-md-12">
                    <label for="street_address">* Street Address</label>
                    <Field
                      id="street_address"
                      v-model="siteLocStreetAddress"
                      name="street_address"
                      class="form-control"
                    />
                    <span class="text-danger">{{ siteLocStreetError }}</span>
                  </div>
                </div>

                <div class="row">
                  <!-- Project Name Field -->
                  <div class="col-md-6">
                    <label for="city">* City</label>
                    <Field
                      id="city"
                      v-model="siteLocCity"
                      name="city"
                      as="input"
                      class="form-control"
                    />
                    <span class="text-danger">{{ siteLocCityError }}</span>
                  </div>

                  <!-- Salesforce Project ID Field -->
                  <div class="col-md-6">
                    <label for="postal_code">* Postal Code</label>
                    <Field
                      id="postal_code"
                      v-model="siteLocPostalCode"
                      name="postal_code"
                      as="input"
                      class="form-control"
                    />
                    <span class="text-danger">{{ siteLocPostalError }}</span>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 dropdown-container">
                    <label for="dropdownSelect">* State</label>
                    <v-select
                      id="installStateSelect"
                      v-model="stateId"
                      :options="stateOptions"
                      label="name"
                      :reduce="(option: DropdownOption) => option.id"
                      class="form-control"
                      placeholder="Select an option"
                    >
                    </v-select>
                    <span class="text-danger">{{ installStateError }}</span>
                  </div>
                  <div class="col-md-6">
                    <label for="expectedStartDate">* Expected Start Date</label>
                    <Field
                      id="expectedStartDate"
                      v-model="expectedStartDate"
                      name="expectedStartDate"
                      as="input"
                      type="date"
                      class="form-control"
                    />
                    <span class="text-danger">{{ expectedStartDateError }}</span>
                  </div>
                </div>

                <div class="row">
                  <!-- vue-select dropdowns -->
                  <div class="col-md-6 dropdown-container">
                    <label for="dropdownSelect">* Project Manager</label>
                    <v-select
                      id="projectManagerSelect"
                      v-model="projectManagerId"
                      :options="projectManagerOptions"
                      label="name"
                      :reduce="(option: DropdownOption) => option.id"
                      class="form-control"
                      placeholder="Select an option"
                    >
                    </v-select>
                    <span class="text-danger">{{ projectManagerError }}</span>
                  </div>
                  <!-- vue-select dropdowns -->
                  <div class="col-md-6 dropdown-container">
                    <label for="dropdownSelect">* Install Manager</label>
                    <v-select
                      id="installManagerSelect"
                      v-model="installManagerId"
                      :options="installManagerOptions"
                      label="name"
                      :reduce="(option: DropdownOption) => option.id"
                      class="form-control"
                      placeholder="Select an option"
                    >
                    </v-select>
                    <span class="text-danger">{{ installManagerError }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="toggleConfirmCancelModal">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isLoading || !isFormValid || !userId"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirm Create Modal -->
    <ConfirmModal
      v-model="showConfirmCreateModal"
      :title="'Create New Project?'"
      @confirm="handleCreateConfirm"
    >
      Are you sure you want to create this new project?
      <template #footer>
        <button class="btn" @click="showConfirmCreateModal = false">Cancel</button>
        <button class="btn btn-danger" @click="handleCreateConfirm">Confirm</button>
      </template>
    </ConfirmModal>

    <!-- Confirmation Cancel Modal -->
    <ConfirmModal
      v-model="showConfirmCancelModal"
      :title="'Cancel New Project Creation?'"
      @confirm="handleCancelConfirm"
    >
      Canceling will discard your unsaved project. Are you sure you want to cancel?
      <template #footer>
        <button class="btn" @click="showConfirmCancelModal = false">Cancel</button>
        <button class="btn btn-danger" @click="handleCancelConfirm">Confirm</button>
      </template>
    </ConfirmModal>
  </div>
</template>

<style scoped>
  .field-tracker-body {
    height: 100vh;
  }
  .sub-header-content {
    color: #19a7af;
    padding: 10px 30px;
  }

  .bi-plus-circle {
    margin-right: 5px;
    color: #7a7a7a;
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

  input::placeholder {
    color: #d9d9d9;
  }

  .dropdown-container .form-control {
    padding: 0;
    border: none;
  }

  .error-message {
    text-align: center;
    color: #dc3545;
    padding: 10px 30px;
    width: 100%;
    background-color: #f8d7da;
  }

  .project-status-tabs {
    width: 90%;
    margin-top: 10px;
    margin-left: 5%;
    margin-right: 5%;
  }

  .table-container {
    width: 100%;
  }

  .modal-footer .btn-primary {
    background-color: #19a7af;
    color: white;
    border: none;
  }

  :deep(.tabulator-header) {
    color: #3c3c3c;
    font-weight: 700;
  }

  :deep(.tabulator) {
    /* font-size: 14px; */
    color: rgb(60, 60, 60);
    font-size: 14px;
  }

  .tablulator-cell dropdown button {
    padding: 0;
    border: none;
    font-size: 12px;
  }

  :deep(.tabulator-row .tabulator-cell) {
    overflow: visible;
  }

  :deep(.tabulator .tabulator-header) {
    border-top: none;
  }
</style>
