<script setup lang="ts">
  import axios from 'axios';
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import { Modal } from 'bootstrap';
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { StatusTypeEnum } from '@/enum/statusTypeEnum';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter } from 'vue-router';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';
  import TopNavBar from '@/components/TopNavBar.vue';
  import type { TeamLeadsData } from '@/interfaces/workforce';
  import type { VSelectDropdownData } from '@/interfaces/common';
  import type { WorkerStatusTypesData } from '@/interfaces/status';
  import {
    EligibleUserDto,
    EligibleUserTypeEnum,
    FieldTrackerServiceProxy,
    ScopeTypeDto,
    WorkForceServiceProxy,
    TeamLeadServiceProxy,
    TeamLeadDTO,
    CreateTeamLeadRequestDto,
  } from '@/shared/service-proxies/service-proxies';

  const authStore = useAuthStore();
  const router = useRouter();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const teamLeadService = new TeamLeadServiceProxy();

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');

  let table: any = ref(null);
  let tabulator: any = ref(null);

  // Data for the tabulator
  const teamLeadsData = ref<TeamLeadsData[]>([]);

  // Data for scope types list
  const scopeTypesData = ref<ScopeTypeDto[]>([]);

  // Data for the eligible user dropdown in create modal
  const eligibleUsersList = ref<EligibleUserDto[]>([]);
  const vSelectEligibleUsersList = ref<VSelectDropdownData[]>([]);

  // Data for the worker status types dropdown in edit modal
  const workerStatusTypesList = ref<WorkerStatusTypesData[]>([]);
  const vSelectWorkerStatusTypesList = ref<VSelectDropdownData[]>([]);

  // Add modal data
  const eligibleUserId: any = ref(null);
  const selectedScopeTypes: any = ref([]);

  // Edit modal adta
  const editId: any = ref(0);
  const editSelectedScopeTypes: any = ref([]);
  const workerStatusTypesId: any = ref(null);
  const teamLeadName: any = ref('');

  // Add Team Lead Modal
  const addTeamLeadModalRef = ref<HTMLElement | null>(null);
  let addTeamLeadModalInstance: Modal | null = null;

  // Edit Team Lead Modal
  const editTeamLeadModalRef = ref<HTMLElement | null>(null);
  let editTeamLeadModalInstance: Modal | null = null;

  const workForceServiceproxy = new WorkForceServiceProxy();
  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy();

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

  function getStatusDisplayName(statusId: number): string {
    const statusName = StatusTypeEnum[statusId];
    if (statusName && typeof statusName === 'string') {
      return statusName.charAt(0).toUpperCase() + statusName.slice(1).toLowerCase();
    }
    return 'Unknown';
  }

  async function getTeamLeadsList() {
    try {
      await teamLeadService.getAllTeamLeads().then((result: any) => {
        if (result && result.length > 0) {
          teamLeadsData.value = result.map((tl: TeamLeadDTO) => {
            return {
              id: tl.id,
              name: tl.name,
              scopeNames: tl.teamLeadScopeAssignments?.map((sta) => sta.scopeName).join(', ') || '',
              statusName: getStatusDisplayName(tl.statusId),
            };
          });
        }
      });
    } catch (error) {
      console.error('Error fetching active team leads:', error);
    }
  }

  async function getScopeTypesList() {
    try {
      await fieldTrackerServiceProxy.getScopeTypes().then((result: ScopeTypeDto[]) => {
        scopeTypesData.value = result;
      });
    } catch (error) {
      console.log(error);
    }
  }

  const initializeTabulator = () => {
    tabulator.value?.destroy();

    tabulator.value = new Tabulator(table.value, {
      height: `calc(100vh - 300px)`,
      history: true,
      index: 'id',
      selectableRange: false,
      selectableRowsPersistence: false,
      data: teamLeadsData.value,
      reactiveData: true,
      layout: 'fitDataTable',
      clipboard: true,
      initialSort: [{ column: 'id', dir: 'asc' }],
      columns: [
        {
          title: 'ID',
          field: 'id',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by ID',
          width: 150,
        },
        {
          title: 'Team Lead',
          field: 'name',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
          width: 200,
        },
        {
          title: 'Scope Types',
          field: 'scopeNames',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Scope Type',
          width: 250,
          formatter: function (cell) {
            // Get the cell's text and set it as inner HTML
            const cellElement = cell.getElement();
            cellElement.style.whiteSpace = 'normal';
            cellElement.style.wordBreak = 'break-word';

            // Return the cell value to display it
            return cell.getValue();
          },
        },
        {
          title: 'Status',
          field: 'statusName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Status',
          width: 150,
          formatter: (cell) => {
            const statusName = cell.getValue();
            return statusName
              ? statusName.charAt(0).toUpperCase() + statusName.slice(1).toLowerCase()
              : '';
          },
        },
        {
          title: '',
          headerSort: false,
          width: 100,
          formatter: editButtonFormatter,
          cellClick: function (e, cell) {
            const rowData = cell.getRow().getData();

            teamLeadName.value = rowData.name;

            const scopeTypesToArr = rowData.scopeNames.split(', ');
            editSelectedScopeTypes.value = [];
            scopeTypesToArr.forEach((scopeName: any) => {
              editSelectedScopeTypes.value.push(
                scopeTypesData.value.find((scope: any) => scope.scope_name == scopeName)?.id
              );
            });

            workerStatusTypesId.value = workerStatusTypesList.value.find(
              (status: any) => status.status_name === rowData.statusName
            )?.id;

            editId.value = rowData.id;
            openEditTeamLeadModal();
          },
        },
      ],
    });
  };

  const fetchEligibleUsers = async () => {
    try {
      await workForceServiceproxy
        .getEligibleUsers(EligibleUserTypeEnum.TeamLead)
        .then((result: EligibleUserDto[]) => {
          eligibleUsersList.value = result;
          vSelectEligibleUsersList.value = result.map((eligibleUser: EligibleUserDto) => {
            return {
              label: eligibleUser.name,
              id: eligibleUser.id,
              value: eligibleUser.name,
              description: '',
            };
          });
        });
    } catch (error) {
      console.error('Error fetching Eligible Users(Team Lead):', error);
    }
  };

  const fetchWorkerStatusTypesList = async () => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/field-tracker/worker/status-types`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      workerStatusTypesList.value = response.data;
      vSelectWorkerStatusTypesList.value = response.data.map(
        (statusType: WorkerStatusTypesData) => {
          return {
            label: statusType.status_name,
            id: statusType.id,
            value: statusType.status_name,
            description: '',
          };
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  onMounted(async () => {
    await getTeamLeadsList();
    await getScopeTypesList();

    initializeTabulator();
    await fetchEligibleUsers();
    await fetchWorkerStatusTypesList();

    if (addTeamLeadModalRef.value) {
      addTeamLeadModalInstance = new Modal(addTeamLeadModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (editTeamLeadModalRef.value) {
      editTeamLeadModalInstance = new Modal(editTeamLeadModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
  });

  function editButtonFormatter() {
    return `<button class="btn btn-link text-primary text-decoration-none" style="margin-top: -8px;padding: 5px 10px;font-size: 100%;"><i class="bi bi-pencil-square"></i> Edit</button>`;
  }

  const closeWorkforce = () => {
    router.push({ name: 'dashboard' });
  };

  const openTeamLeadModal = () => {
    if (addTeamLeadModalInstance) {
      addTeamLeadModalInstance.show();
    }
  };

  const openEditTeamLeadModal = () => {
    if (editTeamLeadModalInstance) {
      editTeamLeadModalInstance.show();
    }
  };

  const submitNewTeamLead = async () => {
    if (userId.value) {
      if (eligibleUserId.value && selectedScopeTypes.value.length > 0) {
        isLoading.value = true;

        const createTeamLeadDto = new CreateTeamLeadRequestDto({
          userId: eligibleUserId.value,
          scopeTypeIds: selectedScopeTypes.value,
          createdBy: userId.value,
        });

        try {
          await teamLeadService.createTeamLead(createTeamLeadDto);
        } catch (error) {
          console.error('Error creating team lead:', error);
        } finally {
          isLoading.value = false;
          window.location.reload();
        }
      } else {
        alert('All field are required');
      }
    } else {
      console.log('User ID not defined');
    }
  };

  const submitEditTeamLead = async () => {
    if (userId.value) {
      console.log(editId.value, editSelectedScopeTypes.value);
      if (editId.value && editSelectedScopeTypes.value.length > 0) {
        const editTeamRequestBody = {
          scopeTypeIds: editSelectedScopeTypes.value,
          workerStatusTypesId: workerStatusTypesId.value,
          updatedBy: userId.value,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/workforce/team-leads/${editId.value}/update`,
          targetMethodType: 'PATCH',
        };

        isLoading.value = true;

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, editTeamRequestBody, { timeout: 10000 });
        } catch (error) {
          console.error('Error creating the new Field Tracker project:', error);
        } finally {
          isLoading.value = false;
          window.location.reload();
        }
      } else {
        alert('All field are required');
      }
    } else {
      console.log('User ID not defined');
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

  <div class="body-content ft-project-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12 pt-2">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Workforce Manager / Team Leads</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeWorkforce">
            Close Tool<i class="bi-x-circle" />
          </button>
          <br />
          <button
            class="btn-close-ft-project link-type-button"
            @click="router.push({ name: 'workforce-workers' })"
          >
            <i class="bi bi-person-lines-fill" /> View/Edit Workers
          </button>
        </div>
      </div>
    </div>

    <hr />

    <div class="sub-header-content d-flex justify-content-between">
      <button class="btn btn-primary btn-new-project" @click="openTeamLeadModal">
        <i class="bi-plus-circle" />ADD NEW TEAM LEAD
      </button>
    </div>

    <div ref="table" class="table-container"></div>
  </div>

  <div
    ref="addTeamLeadModalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="addTeamLeadModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">ADD NEW TEAM LEAD</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="dropdownSelect">* Eligible Users</label>
            <v-select
              id="installTeamSelect"
              v-model="eligibleUserId"
              :options="vSelectEligibleUsersList"
              label="label"
              :reduce="(option: VSelectDropdownData) => option.id"
              class="form-control"
              placeholder="Select from available users"
            >
              <template #no-options>
                <span>No eligible users to be a team lead.</span>
              </template>
            </v-select>
          </div>
          <div class="form-group mt-3">
            <label>* Scope Types (must choose at least one)</label>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <div v-for="(scopeType, key) in scopeTypesData" :key="scopeType.id" class="form-check">
              <input
                :id="'scopeType_' + key"
                v-model="selectedScopeTypes"
                class="form-check-input cursor-pointer"
                type="checkbox"
                name="scopeType"
                :value="scopeType.id"
              />
              <label class="form-check-label cursor-pointer" :for="'scopeType_' + key">{{
                scopeType.scopeName
              }}</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="submitNewTeamLead">Process</button>
        </div>
      </div>
    </div>
  </div>

  <div
    ref="editTeamLeadModalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="editTeamLeadModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">EDIT TEAM LEAD</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <h3 class="text-dark">{{ teamLeadName }}</h3>
          </div>
          <div class="form-group d-flex">
            <h3><i class="bi bi-exclamation-circle"></i></h3>
            <small style="color: #9f6464"
              >Setting a team lead to “inactive” or changes to scope types will not affect projects
              scopes already assigned to this team lead, but will affect what options are available
              for future project scope assignments</small
            >
          </div>
          <div class="form-group mt-3">
            <label>* Scope Types (must choose at least one)</label>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <div v-for="(scopeType, key) in scopeTypesData" :key="scopeType.id" class="form-check">
              <input
                :id="'editScopeType_' + key"
                v-model="editSelectedScopeTypes"
                class="form-check-input cursor-pointer"
                type="checkbox"
                name="scopeType"
                :value="scopeType.id"
              />
              <label class="form-check-label cursor-pointer" :for="'editScopeType_' + key">{{
                scopeType.scopeName
              }}</label>
            </div>
          </div>
          <div class="form-group">
            <label for="dropdownSelect">Status</label>
            <v-select
              id="installTeamSelect"
              v-model="workerStatusTypesId"
              :options="vSelectWorkerStatusTypesList"
              label="label"
              :reduce="(option: VSelectDropdownData) => option.id"
              class="form-control"
              placeholder="Select an option"
            >
            </v-select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="submitEditTeamLead">Save</button>
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

  .toast-message button {
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
  }

  .cursor-pointer {
    cursor: pointer;
  }
</style>
