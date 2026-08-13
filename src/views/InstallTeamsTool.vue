<script setup lang="ts">
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import { Modal } from 'bootstrap';
  import { computed, ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter } from 'vue-router';

  import TopNavBar from '@/components/TopNavBar.vue';

  import type { CellComponent } from 'tabulator-tables';
  import type { InstallTeamData } from '@/interfaces/installTeams';
  import {
    CreateInstallTeamDto,
    FieldTrackerServiceProxy,
    UpdateInstallTeamDto,
  } from '@/shared/service-proxies/service-proxies';
  import type { InstallTeamDto } from '@/shared/service-proxies/service-proxies';

  const authStore = useAuthStore();
  const router = useRouter();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const userRoleString = ref<string>('');

  const installTeamData = ref<InstallTeamData[]>([]);
  const installTeamName: any = ref('');
  const editInstallTeamName: any = ref('');
  // Store initial values for comparison
  const initialEditInstallTeamName = ref<string>('');
  const initialEditInstallTeamStatusTypesId = ref<number | null>(null);

  const installTeamStatusTypesId: any = ref(null);
  const editInstallTeamStatusTypesId: any = ref(null);
  const editInstallTeamId: any = ref(null);
  const isFormValid = computed(() => {
    return installTeamName.value.trim() !== '' && installTeamStatusTypesId.value !== null;
  });

  import { InstallTeamsStatusTypesEnum } from '@/enum';

  const addInstallTeamModalRef = ref<HTMLElement | null>(null);
  let addInstallTeamModalInstance: Modal | null = null;

  const editInstallTeamModalRef = ref<HTMLElement | null>(null);
  let editInstallTeamModalInstance: Modal | null = null;

  const isLoading = ref(false);
  const userId = ref<number | null>(0);

  let table: any = ref(null);
  let tabulator: any = ref(null);

  const fieldTrackerServiceProxy = new FieldTrackerServiceProxy(apiBaseUrl);

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

  async function getInstallTeamsList() {
    try {
      const result = (await fieldTrackerServiceProxy.getInstallTeams()) as InstallTeamDto[];

      installTeamData.value = result.map((r) => ({
        id: r.id,
        teamName: r.teamName,
        // DTO may use "status" or "statusId" — normalize to statusId
        statusId: (r as any).statusId ?? (r as any).status ?? null,
        // Convert string timestamps to Date objects to satisfy InstallTeamData
        createdAt: new Date(r.createdAt),
        createdBy: r.createdBy ?? 0,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt),
        updatedBy: r.updatedBy ?? 0,
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : new Date(0),
        deletedBy: r.deletedBy ?? 0,
        statusName: (r as any).statusName ?? '',
        creatorName: (r as any).creatorName ?? '',
        label: (r as any).label,
      })) as InstallTeamData[];
    } catch (error) {
      console.log(error);
    }
  }

  const initializeTabulator = () => {
    tabulator.value?.destroy();

    tabulator.value = new Tabulator(table.value, {
      height: `calc(100vh - 300px)`,
      rowHeight: 45,
      history: true,
      index: 'id',
      selectableRange: false,
      selectableRowsPersistence: false,
      data: installTeamData.value,
      reactiveData: true,
      layout: 'fitDataTable',
      clipboard: true,
      initialSort: [{ column: 'teamName', dir: 'asc' }],
      columns: [
        {
          title: 'ID',
          field: 'id',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by ID',
          width: 100,
        },
        {
          title: 'Name',
          field: 'teamName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
          width: 200,
        },
        {
          title: 'Status',
          field: 'statusName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
          width: 200,
        },
        {
          title: 'Date Created',
          field: 'createdAt',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Date',
        },
        {
          title: 'Created By',
          field: 'creatorName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Creator Name',
          width: 200,
        },
        {
          title: '',
          headerSort: false,
          width: 100,
          formatter: editButtonFormatter,
          cellClick: function (e, cell) {
            const rowData = cell.getRow().getData();

            if (rowData.teamName != 'IHI Team') {
              handleButtonClick(rowData.id, rowData.teamName, rowData.statusName);
            }
          },
        },
      ],
    });
  };

  onMounted(async () => {
    await getInstallTeamsList();
    initializeTabulator();

    if (addInstallTeamModalRef.value) {
      addInstallTeamModalInstance = new Modal(addInstallTeamModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (editInstallTeamModalRef.value) {
      editInstallTeamModalInstance = new Modal(editInstallTeamModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
  });

  function editButtonFormatter(cell: CellComponent) {
    const rowData = cell.getRow().getData();

    if (rowData.teamName == 'IHI Team') {
      return `<button class="btn" style="color:#D3D3D3; margin-top:-8px; outline:none; border:none; cursor:default; padding: 5px 10px"><i class="bi bi-pencil-square"></i> Edit</button>`;
    } else {
      return `<button class="btn btn-success" style="color:#19A7AF; border:none; margin-top:-8px; background-color:transparent; cursor:pointer; padding: 5px 10px"><i class="bi bi-pencil-square"></i> Edit</button>`;
    }
  }

  const closeInstallTeam = () => {
    router.push({ name: 'dashboard' });
  };

  const handleButtonClick = (id: number, teamName: any, statusName: any) => {
    editInstallTeamId.value = id;
    editInstallTeamName.value = teamName;
    editInstallTeamStatusTypesId.value = statusName;

    // Store initial values when the modal is opened
    initialEditInstallTeamName.value = teamName;
    initialEditInstallTeamStatusTypesId.value = statusName;

    if (editInstallTeamModalInstance) {
      editInstallTeamModalInstance.show();
    }
  };

  const openStatusTypesModal = () => {
    if (addInstallTeamModalInstance) {
      addInstallTeamModalInstance.show();
    }
  };

  const submitNewTeam = async () => {
    if (userId.value) {
      isLoading.value = true;

      try {
        await fieldTrackerServiceProxy.createInstallTeam({
          teamName: installTeamName.value,
          status: installTeamStatusTypesId.value,
          createdBy: userId.value,
        } as CreateInstallTeamDto);
      } catch (error) {
        console.error('Error creating the new Install Team:', error);
      } finally {
        isLoading.value = false;
        window.location.reload();
      }
    } else {
      console.log('User ID not defined');
    }
  };

  // Computed property to check if the form is dirty
  const isEditFormDirty = computed(() => {
    return (
      editInstallTeamName.value.trim() !== initialEditInstallTeamName.value.trim() ||
      editInstallTeamStatusTypesId.value !== initialEditInstallTeamStatusTypesId.value
    );
  });

  const editInstallTeam = async () => {
    if (userId.value) {
      let statusId = editInstallTeamStatusTypesId.value;

      isLoading.value = true;

      try {
        await fieldTrackerServiceProxy.updateInstallTeam({
          id: editInstallTeamId.value,
          teamName: editInstallTeamName.value,
          status: statusId,
          updatedBy: userId.value,
        } as UpdateInstallTeamDto);
      } catch (error) {
        console.error('Error updating the install team', error);
      } finally {
        isLoading.value = false;
        window.location.reload();
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
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Install Teams</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeInstallTeam">
            Close Tool<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <div class="sub-header-content d-flex justify-content-between">
      <button class="btn btn-primary btn-new-project" @click="openStatusTypesModal">
        <i class="bi-plus-circle" />CREATE INSTALL TEAM
      </button>
    </div>

    <div ref="table" class="table-container"></div>
  </div>

  <div
    id="statusTypesModal"
    ref="addInstallTeamModalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="addInstallTeamModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">CREATE INSTALL TEAM</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="team_name">*Team Name</label>
            <input id="team_name" v-model="installTeamName" class="form-control" type="text" />
          </div>
          <div class="form-group">
            <label for="dropdownSelect">* Status</label>
            <select
              v-model="installTeamStatusTypesId"
              class="form-control"
              placeholder="Select an option"
            >
              <option :value="InstallTeamsStatusTypesEnum.active">active</option>
              <option :value="InstallTeamsStatusTypesEnum.inactive">inactive</option>
              <option :value="InstallTeamsStatusTypesEnum.revoked">revoked</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!isFormValid"
            @click="submitNewTeam"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    id="statusTypesModal"
    ref="editInstallTeamModalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="editInstallTeamModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">EDIT INSTALL TEAM</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="team_name">*Team Name</label>
            <input id="team_name" v-model="editInstallTeamName" class="form-control" type="text" />
          </div>
          <div class="form-group">
            <label for="dropdownSelect">* Status</label>
            <select
              v-model="editInstallTeamStatusTypesId"
              class="form-control"
              placeholder="Select an option"
            >
              <option :value="InstallTeamsStatusTypesEnum.active">active</option>
              <option :value="InstallTeamsStatusTypesEnum.inactive">inactive</option>
              <option :value="InstallTeamsStatusTypesEnum.revoked">revoked</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!isEditFormDirty"
            @click="editInstallTeam"
          >
            Save
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

  .btn-primary {
    background-color: #19a7af;
    color: white;
    border: none;
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
</style>
