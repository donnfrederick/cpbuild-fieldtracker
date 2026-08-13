<script setup lang="ts">
  import { Modal } from 'bootstrap';
  import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue';
  import * as yup from 'yup';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';

  import {
    FieldTrackerServiceProxy,
    ProjectInfoChangesDto,
    ProjectInfoUpdateDto,
  } from '@/shared/service-proxies/service-proxies';

  import { useToolStore } from '@/stores/toolStore';
  import axios from 'axios';
  import {
    Form as VeeForm,
    Field as VeeField,
    useField,
    useForm,
    type SubmissionHandler,
  } from 'vee-validate';
  import { useAuthStore } from '@/stores/useAuthStore';
  import type { ProjectData, ProjectInfoFormValues } from '@/interfaces/fieldTracker';
  import type { ApiData, DropdownOption } from '@/interfaces/common';

  // Props definition if needed for modal visibility
  const props = defineProps({
    isOpen: Boolean,
  });

  const emit = defineEmits(['update:isOpen']);

  const toolStore = useToolStore();
  const authStore = useAuthStore();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const projectManagerOptions = ref<DropdownOption[]>([]);
  const installManagerOptions = ref<DropdownOption[]>([]);
  const stateOptions = ref<DropdownOption[]>([]);

  // api service proxy
  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy(apiBaseUrl);

  const modalRef = ref(null);
  let modalInstance: Modal | null = null;

  const isLoading = ref(false);
  const hasApiError = ref(false);
  const apiErrorMessage = ref<string>('');

  const userRoleString = ref<string>('');
  const userId = ref<number | null>(0);

  // // Current project info data
  const projectData = computed(() => toolStore.getCurrentProjectInfo());
  const storedFtProjectId = ref<number | undefined>();
  const storedRootProjectId = ref<number | undefined>();
  const storedProjectName = ref<string | undefined>();
  const storedSalesforceId = ref<string | undefined>();
  const storedSiteLocStreetAddress = ref<string | undefined>();
  const storedSiteLocCity = ref<string | undefined>();
  const storedSiteLocPostalCode = ref<string | undefined>();
  const storedExpectedStartDate = ref<string | undefined>();
  const storedProjectManagerName = ref<string | undefined>();
  const storedProjectManagerId = ref<number | undefined>();
  const storedInstallManagerName = ref<string | undefined>();
  const storedInstallManagerId = ref<number | undefined>();
  const storedStateCode = ref<string | undefined>();
  const storedStateId = ref<number | undefined>();

  // Form Validation
  const projectNameError = computed(() => errors.value.projectName);
  const salesforceIdError = computed(() => errors.value.salesforceId);
  const siteLocStreetError = computed(() => errors.value.siteLocStreetAddress);
  const siteLocCityError = computed(() => errors.value.siteLocCity);
  const siteLocPostalError = computed(() => errors.value.siteLocPostalCode);
  const expectedStartDateError = computed(() => errors.value.expectedStartDate);
  const projectManagerError = computed(() => errors.value.projectManagerId);
  const installManagerError = computed(() => errors.value.installManagerId);
  const stateError = computed(() => errors.value.stateId);

  let currentProjectInfoUpdateFormValues = ref<ProjectInfoFormValues>({
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

  // Form validation schema
  const validationSchema = yup.object({
    projectName: yup.string().required('Project Name is required'),
    salesforceId: yup.string().optional(),
    siteLocStreetAddress: yup.string().required('Street Name is required'),
    siteLocCity: yup.string().required('City is required'),
    siteLocPostalCode: yup.string().required('Postal Code is required'),
    expectedStartDate: yup.date().required('Expected Start Date is required'),
    projectManagerId: yup.number().required('Project Manager is required'),
    installManagerId: yup.number().required('Install Manager is required'),
    stateId: yup.number().required('Install state is required'),
  });

  (() => {
    const storedProjectData = JSON.parse(localStorage.getItem('currentProjectInfo') || '{}');

    storedFtProjectId.value = storedProjectData.ftProjectId;
    storedRootProjectId.value = storedProjectData.rootProjectId;
    storedProjectName.value = storedProjectData.projectName;
    storedSalesforceId.value = storedProjectData.salesforceId;
    storedSiteLocStreetAddress.value = storedProjectData.siteLocStreetAddress;
    storedSiteLocCity.value = storedProjectData.siteLocCity;
    storedSiteLocPostalCode.value = storedProjectData.siteLocPostalCode;
    storedExpectedStartDate.value =
      storedProjectData.expectedStartDate != null
        ? storedProjectData.expectedStartDate.split('T')[0]
        : null;
    storedProjectManagerId.value = storedProjectData.projectManagerId;
    storedProjectManagerName.value = storedProjectData.projectManagerName;
    storedInstallManagerId.value = storedProjectData.installManagerId;
    storedInstallManagerName.value = storedProjectData.installManagerName;
    storedStateId.value = storedProjectData.stateId;
    storedStateCode.value = storedProjectData.stateCode;
  })();

  // useForm setup
  const { handleSubmit, meta, errors, validate } = useForm<any>({
    validationSchema,
    initialValues: {
      projectName: storedProjectName.value,
      salesforceId: storedSalesforceId.value,
      siteLocStreetAddress: storedSiteLocStreetAddress.value,
      siteLocCity: storedSiteLocCity.value,
      siteLocPostalCode: storedSiteLocPostalCode.value,
      expectedStartDate: storedExpectedStartDate.value,
      projectManagerId: storedProjectManagerId.value,
      installManagerId: storedInstallManagerId.value,
      stateId: storedStateId.value,
    },
  });

  const validateField = async (fieldName: any) => {
    await validate(fieldName);
  };

  // Define fields for project info update form
  const { value: projectName } = useField('projectName');
  const { value: salesforceId } = useField('salesforceId');
  const { value: siteLocStreetAddress } = useField('siteLocStreetAddress');
  const { value: siteLocCity } = useField('siteLocCity');
  const { value: siteLocPostalCode } = useField('siteLocPostalCode');
  const { value: expectedStartDate } = useField('expectedStartDate');
  const { value: projectManagerId } = useField('projectManagerId');
  const { value: installManagerId } = useField('installManagerId');
  const { value: stateId } = useField('stateId');

  const isFormValid = computed(() => meta.value.valid);
  const isFormDirty = computed(() => meta.value.dirty);
  const isSubmitDisabled = computed(() => !isFormValid.value || !isFormDirty.value);

  // Watch for isOpen prop changes to show/hide the modal
  watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal) {
        modalInstance?.show();
      } else {
        modalInstance?.hide();
      }
    }
  );

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  // Form submission logic
  const onSubmit: SubmissionHandler<any> = handleSubmit(async (values) => {
    try {
      currentProjectInfoUpdateFormValues.value = {
        projectName: values.projectName,
        salesforceId: values.salesforceId,
        siteLocStreetAddress: values.siteLocStreetAddress,
        siteLocCity: values.siteLocCity,
        siteLocPostalCode: values.siteLocPostalCode,
        expectedStartDate: values.expectedStartDate,
        projectManagerId: values.projectManagerId,
        installManagerId: values.installManagerId,
        stateId: values.stateId,
      } as ProjectInfoFormValues;
      await submitProjectInfoUpdateForm(currentProjectInfoUpdateFormValues.value);
    } catch (error) {
      console.error('Failed to update project info:', error);
      alert('Failed to update project info.');
    }
  });

  const submitProjectInfoUpdateForm = async (formValues: ProjectInfoFormValues) => {
    if (!userId.value) {
      console.error('User ID is not set.');
      return;
    }

    // Create UpdateProjectInfoDto instance
    const updateProjectInfo = new ProjectInfoChangesDto({
      projectName: formValues.projectName,
      projectStatusId: undefined,
      salesforceId: formValues.salesforceId,
      siteLocStreetAddress: formValues.siteLocStreetAddress,
      siteLocCity: formValues.siteLocCity,
      siteLocPostalCode: formValues.siteLocPostalCode,
      expectedStartDate: formValues.expectedStartDate
        ? new Date(formValues.expectedStartDate)
        : undefined,
      projectManagerId: formValues.projectManagerId,
      installManagerId: formValues.installManagerId,
      stateId: formValues.stateId,
      updatedBy: Number(userId.value),
    });

    isLoading.value = true;

    const request = new ProjectInfoUpdateDto({
      rowId: storedFtProjectId.value ?? 0,
      changes: updateProjectInfo,
    });

    try {
      await fieldTrackerServiceProxy.updateProjectInfo(request);
    } catch (error) {
      console.error('Error updating root project info:', error);
      hasApiError.value = true;
      apiErrorMessage.value =
        'Error updating root project info. Please refresh page and try again.';
    } finally {
      // Update the stored project info so UI will immediately reflect the changes without a refresh
      storedProjectName.value = currentProjectInfoUpdateFormValues.value.projectName;
      storedSalesforceId.value = currentProjectInfoUpdateFormValues.value.salesforceId;
      storedSiteLocStreetAddress.value =
        currentProjectInfoUpdateFormValues.value.siteLocStreetAddress;
      storedSiteLocCity.value = currentProjectInfoUpdateFormValues.value.siteLocCity;
      storedSiteLocPostalCode.value = currentProjectInfoUpdateFormValues.value.siteLocPostalCode;
      storedExpectedStartDate.value = currentProjectInfoUpdateFormValues.value.expectedStartDate;
      storedProjectManagerId.value = currentProjectInfoUpdateFormValues.value.projectManagerId;
      storedInstallManagerId.value = currentProjectInfoUpdateFormValues.value.installManagerId;
      storedStateId.value = currentProjectInfoUpdateFormValues.value.stateId;
      storedStateCode.value = stateOptions.value.find(
        (option) => option.id === currentProjectInfoUpdateFormValues.value.stateId
      )?.name;
      storedInstallManagerName.value = installManagerOptions.value.find(
        (option) => option.id === currentProjectInfoUpdateFormValues.value.installManagerId
      )?.name;
      storedProjectManagerName.value = projectManagerOptions.value.find(
        (option) => option.id === currentProjectInfoUpdateFormValues.value.projectManagerId
      )?.name;

      // Update currentProjectInfo in Local Storage so it page is refreshed without closing the project it will use the updated data
      const updatedProjectInfo = {
        ...projectData.value,
        ftProjectId: storedFtProjectId.value,
        rootProjectId: storedRootProjectId.value,
        projectName: storedProjectName.value,
        salesforceId: storedSalesforceId.value,
        siteLocStreetAddress: storedSiteLocStreetAddress.value,
        siteLocCity: storedSiteLocCity.value,
        siteLocPostalCode: storedSiteLocPostalCode.value,
        expectedStartDate: storedExpectedStartDate.value,
        projectManagerId: storedProjectManagerId.value,
        projectManagerName: storedProjectManagerName.value,
        installManagerId: storedInstallManagerId.value,
        installManagerName: storedInstallManagerName.value,
        stateId: storedStateId.value,
        stateCode: storedStateCode.value,
      } as ProjectData;

      localStorage.setItem('currentProjectInfo', JSON.stringify(updatedProjectInfo));
      toolStore.setCurrentProjectInfo(updatedProjectInfo);

      closeModal();

      isLoading.value = false;
      window.location.reload();
    }
  };

  const closeModal = () => {
    emit('update:isOpen', false);
  };

  const fetchProjectInfoFormData = async () => {
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

  onMounted(async () => {
    await fetchProjectInfoFormData();
    // Wait for the next tick to ensure the DOM has been updated
    // This ensures modalRef.value is accessible if it's supposed to be in the DOM
    nextTick().then(async () => {
      const modalElement = modalRef.value as any;

      // Ensure modalElement is not null before proceeding
      if (modalElement instanceof HTMLElement) {
        modalInstance = new Modal(modalElement);
        modalElement.addEventListener('hidden.bs.modal', () => {
          emit('update:isOpen', false);
        });
      } else {
        // Handle the case where modalElement wasn't found as expected
        console.error('Modal element not found');
      }
    });
  });
</script>

<template>
  <VeeForm @submit="onSubmit">
    <div
      id="updateProjectInfoModal"
      ref="modalRef"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="updateProjectInfoModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="updateProjectInfoModalLabel" class="modal-title">Update Project Info</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Project Name Field -->
              <div class="col-md-6">
                <label for="projectName" class="form-label">Project Name *</label>
                <VeeField
                  id="projectName"
                  v-model="projectName"
                  name="projectName"
                  as="input"
                  type="text"
                  class="form-control"
                />
                <div class="text-danger">{{ projectNameError }}</div>
              </div>

              <!-- Salesforce ID Field -->
              <div class="col-md-6">
                <label for="salesforceId" class="form-label">Salesforce ID</label>
                <VeeField
                  id="salesforceId"
                  v-model="salesforceId"
                  name="salesforceId"
                  as="input"
                  type="text"
                  class="form-control"
                />
                <div class="text-danger">{{ salesforceIdError }}</div>
              </div>
            </div>

            <div class="row">
              <!-- Street Address Field -->
              <div class="col-md-12">
                <label for="siteLocStreetAddress">* Street Address</label>
                <VeeField
                  id="siteLocStreetAddress"
                  v-model="siteLocStreetAddress"
                  name="siteLocStreetAddress"
                  class="form-control"
                />
                <span class="text-danger">{{ siteLocStreetError }}</span>
              </div>
            </div>

            <div class="row">
              <!-- Project Name Field -->
              <div class="col-md-6">
                <label for="siteLocCity">* City</label>
                <VeeField
                  id="siteLocCity"
                  v-model="siteLocCity"
                  name="siteLocCity"
                  as="input"
                  class="form-control"
                />
                <span class="text-danger">{{ siteLocCityError }}</span>
              </div>

              <!-- Salesforce Project ID Field -->
              <div class="col-md-6">
                <label for="siteLocPostalCode">* Postal Code</label>
                <VeeField
                  id="siteLocPostalCode"
                  v-model="siteLocPostalCode"
                  name="siteLocPostalCode"
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
                  @input="validateField('stateId')"
                >
                </v-select>
                <span class="text-danger">{{ stateError }}</span>
              </div>
              <div class="col-md-6">
                <label for="expectedStartDate">* Expected Start Date</label>
                <VeeField
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
                  @input="validateField('projectManagerId')"
                >
                </v-select>
                <span class="text-danger">{{ projectManagerError }}</span>
              </div>
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
                  @input="validateField('installManagerId')"
                >
                </v-select>
                <span class="text-danger">{{ installManagerError }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitDisabled">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </VeeForm>
</template>

<style scoped>
  .test {
    color: red;
  }

  .dropdown-container .form-control {
    padding: 0;
    border: none;
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
</style>
