<script setup lang="ts">
  import axios from 'axios';
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import { storeToRefs } from 'pinia';
  import 'vue-select/dist/vue-select.css';
  import TopNavBar from '@/components/TopNavBar.vue';
  import type { ProjectAssinmentData, Tasks } from '@/interfaces/project';
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

  const units: any = ref([]);

  const issueDetails: any = ref({});

  const showToast = ref(false);
  const toastMessage = ref('');

  const showToastErr = ref(false);
  const toastErrMessage = ref('');

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

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  const teamLeadId: any = ref(0);
  const ihiProject = ref<ProjectAssinmentData | null>(null);
  const tasks = ref<Tasks[]>([]);

  async function getTeamLeads() {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/project-assigner/team-leads/active/list`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      // Find the team lead where `tl.userId` matches `userId.value`
      const matchingTeamLead = response.data.find((tl: any) => tl.userId === userId.value);

      // If a match is found, set `teamLeadId.value` to `tl.id`
      if (matchingTeamLead) {
        teamLeadId.value = matchingTeamLead.id;
      } else {
        console.error('No matching team lead found for the current user.');
        teamLeadId.value = 0; // Reset teamLeadId to 0 if no match is found
      }
    } catch (error) {
      console.error('Error fetching team leads:', error);
    }
  }

  async function getIHIProjects() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/labor-manager/team-leads/${teamLeadId.value}/active-ihi-projects`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      ihiProject.value = data.projectAssignment.find((proj: any) =>
        proj.tasks.some((task: any) => task.id == route.params.id)
      );

      if (ihiProject.value != null) {
        tasks.value = ihiProject.value.tasks.filter((task: any) => task.id == route.params.id);

        console.log(tasks.value);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getIssueDetails() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/ihi-unit/blocking-issue-details/${route.params.issueId}`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      issueDetails.value = data;
    } catch (error) {
      console.log(error);
    }
  }

  async function getUnitsList() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/project-by-scope/${route.params.id}/units-info/list`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      units.value = data.result.filter((unit: any) => unit.id == issueDetails.value.unitId);

      units.value.forEach((unit: any, key: any) => {
        if (unit.blockingIssues) {
          unit.blockingIssues = unit.blockingIssues.filter(
            (blockingIssue: any) => blockingIssue.id == route.params.issueId
          );

          unit.blockingIssues.forEach((blockingIssue: any, num: number) => {
            const date = new Date(blockingIssue.createdAt);
            units.value[key].blockingIssues[num].createdAt = `${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getDate()
              .toString()
              .padStart(2, '0')}-${date.getFullYear()}`;
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
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

    // Define the allowed modes
    const allowedModes = ['resolve', 'edit', 'preview'];
    const mode = typeof route.query.mode === 'string' ? route.query.mode : '';

    // If the mode is not in the allowed list, redirect and return early
    if (!allowedModes.includes(mode)) {
      console.error('Invalid mode parameter. Redirecting...');
      router.push({
        name: 'labor-manager-project-scope',
        params: { id: route.params.id },
      });
      return;
    }

    // Load necessary data
    await getTeamLeads();
    await getIHIProjects();
    await getIssueDetails();
    await getUnitsList();

    isLoading.value = false;
  });

  const closeIssue = () => {
    window.history.back();
  };

  interface ResolutionDetails {
    details: string;
    statusId: number;
    unitId: number;
  }

  const hasBeenSubmitted = () => {
    isLoading.value = true;
  };

  const hasBeenUpdated = async (newIssueDetails: string) => {
    isLoading.value = true;

    if (newIssueDetails != '') {
      const updateProjectRequestBody = {
        issueDetails: newIssueDetails,
        updatedBy: userId.value,
        userRoles: userRoleString.value,
        targetUrl: `${apiBaseUrl}/units-by-scope/blocking-issues/${route.params.issueId}/update`,
        targetMethodType: 'PATCH',
      };

      try {
        await axios.post(`${apiBaseUrl}/api-proxy`, updateProjectRequestBody, { timeout: 10000 });

        window.location.reload();
      } catch (error) {
        showToastErr.value = true;
        toastErrMessage.value = 'An error occured';

        setTimeout(() => {
          showToastErr.value = false;
          toastErrMessage.value = '';
        }, 5000);

        console.error('Error updating blocking issue:', error);
      }
    } else {
      showToastErr.value = true;
      toastErrMessage.value = 'Issue Details cannot be empty';

      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);
    }
  };

  const submitResolution = async (resolution: ResolutionDetails) => {
    if (resolution.details != '' && resolution.statusId != 1) {
      const updateProjectRequestBody = {
        resolutionDetails: resolution.details,
        statusId: resolution.statusId,
        unitId: resolution.unitId,
        resolvedBy: userId.value,
        userRoles: userRoleString.value,
        targetUrl: `${apiBaseUrl}/units-by-scope/blocking-issues/${route.params.issueId}/resolve`,
        targetMethodType: 'PATCH',
      };

      try {
        await axios.post(`${apiBaseUrl}/api-proxy`, updateProjectRequestBody, { timeout: 10000 });

        showToast.value = true;
        toastMessage.value = 'Successfully Updated';

        setTimeout(() => {
          showToast.value = false;
          toastMessage.value = '';

          closeIssue();
        }, 5000);
      } catch (error) {
        showToastErr.value = true;
        toastErrMessage.value = 'An error occured';

        setTimeout(() => {
          showToastErr.value = false;
          toastErrMessage.value = '';
        }, 5000);

        console.error('Error updating blocking issue:', error);
      } finally {
        isLoading.value = false;
      }
    } else {
      showToastErr.value = true;
      toastErrMessage.value = 'Resolution Details and Status are required';

      setTimeout(() => {
        showToastErr.value = false;
        toastErrMessage.value = '';
      }, 5000);
    }
  };
  const removeImage = async (uploadId: number) => {
    isLoading.value = true;

    const reqBody = {
      deletedBy: userId.value,
      userRoles: userRoleString.value,
      targetUrl: `${apiBaseUrl}/blob/${uploadId}/delete`,
      targetMethodType: 'PATCH',
    };

    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, reqBody, {
        timeout: 120000,
      });

      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };
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
    <button
      @click="
        () => {
          (showToast = false), closeIssue();
        }
      "
    >
      Close
    </button>
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
            Tools / Labor Manager / {{ ihiProject?.projectName }} ({{ tasks[0]?.scopeTypeName }}) /
            Blocking Issue</span
          >
        </div>
      </div>
    </div>

    <hr />

    <MaskingIndicator v-if="isMasking" />

    <hr />

    <div class="col-md-4">
      <div class="units">
        <template v-for="unit in units" :key="unit.id">
          <div class="unit-data">
            <p class="mb-3">
              <span>Building: </span>{{ unit.building }}, <span>Level: </span>{{ unit.level }},
              <span>Unit: </span>{{ unit.unit }}, <span>Unit Type: </span>{{ unit.unitType }}
            </p>
            <p>
              <span>Planned Qty: </span>
              <template
                v-if="
                  unit.quantities != null &&
                  unit.quantities.installedQuantities.plannedQuantities != 0
                "
              >
                {{ unit.quantities.installedQuantities.plannedQuantities }}
              </template>
              - <span>Assembled: </span>0, <span>Installed: </span>0
            </p>
            <p>
              <span>Added Qty: </span>
              <template
                v-if="
                  unit.quantities != null &&
                  unit.quantities.installedQuantities.addedQuantities != 0
                "
              >
                {{ unit.quantities.installedQuantities.addedQuantities }}
              </template>
              - <span>Assembled: </span>0, <span>Installed: </span>0
            </p>
            <br />
            <p>
              <template v-if="unit.blockingIssues != null">
                <div v-for="blockingIssue in unit.blockingIssues" :key="blockingIssue.id">
                  <br />
                  <span>Issue ID: </span>{{ blockingIssue.id }}, <span>Issue Type: </span
                  >{{ blockingIssue.issueTypeName }}, <span>Responsible Party: </span
                  >{{ blockingIssue.responsiblePartyTypeName }}, <span>Created: </span
                  >{{ blockingIssue.createdAt }}, <span>Status: </span
                  >{{ blockingIssue.statusName }}

                  <BlockingIssue
                    :issue="blockingIssue"
                    :is-visible="true"
                    :mode="typeof route.query.mode === 'string' ? route.query.mode : undefined"
                    @close="closeIssue"
                    @resolved="submitResolution"
                    @submitted="hasBeenSubmitted"
                    @remove-image="removeImage"
                    @updated="hasBeenUpdated"
                  />
                </div>
              </template>
            </p>
          </div>
          <hr />
        </template>
      </div>
    </div>
  </div>
</template>
<style scoped>
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
    padding: 0;
  }
  .units {
    margin-top: 2rem;
    width: 90vw;
    max-width: 800px;
    min-width: 350px;
  }
  .units .unit-data {
    padding: 2rem 5rem;
  }
  .units .unit-data p {
    padding: 0;
    margin: 0;
    color: #000;
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
    font-size: 100%;
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
    width: 100%;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }

  .ft-project-viewer {
    overflow-y: auto; /* Enables vertical scrolling if content overflows */
    height: 100vh; /* Optional: Adjust if you want a specific height */
    margin-top: 62px;
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

  :deep(.tabulator-row.highlight-new-row) {
    background-color: #ffff99; /* Light yellow background */
    transition: background-color 0.5s ease-in;
  }

  :deep(.tabulator-row.fade-highlight) {
    transition: background-color 0.5s ease-out;
    background-color: transparent;
  }

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  .table-container {
    min-height: 300px;
    max-height: 70vh;
    overflow-y: auto;
    width: 95%;
    margin: 1rem auto;
  }

  .dropdown-container .form-control {
    padding: 0;
    border: none;
  }

  :deep(.calculated-field) {
    background-color: rgba(237, 237, 237, 0.6);
  }

  :deep(.vs__dropdown-toggle) {
    border: none;
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
    display: block;
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

  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }
    .units .unit-data {
      padding: 0 1.5rem;
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }
</style>
