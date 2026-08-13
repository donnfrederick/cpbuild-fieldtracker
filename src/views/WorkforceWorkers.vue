<script setup lang="ts">
  import axios from 'axios';
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import { Modal } from 'bootstrap';
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter } from 'vue-router';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';
  import TopNavBar from '@/components/TopNavBar.vue';
  import type { RawRoleTypesData, RoleTypesData } from '@/interfaces/workforce';
  import type { VSelectDropdownData } from '@/interfaces/common';
  import type { WorkerStatusTypesData } from '@/interfaces/status';
  import {
    CreateWorkerDto,
    EligibleUserDto,
    EligibleUserTypeEnum,
    ScopeTypeWithRoleDto,
    WorkerDto,
    WorkForceServiceProxy,
    WorkerRoleTypeDto,
  } from '@/shared/service-proxies/service-proxies';

  const authStore = useAuthStore();
  const router = useRouter();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');

  let table: any = ref(null);
  let tabulator: any = ref(null);

  // Data for the tabulator
  const workersData = ref<WorkerDto[]>([]);

  // Data for role types list
  const rawRoleTypes = ref<RawRoleTypesData[]>([]);
  const roleTypesData = ref<RoleTypesData[]>([]);

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
  const editWorkerName: any = ref('');

  // Add Worker Modal
  const addWorkerModalRef = ref<HTMLElement | null>(null);
  let addWorkerModalInstance: Modal | null = null;

  // Edit Worker Modal
  const editWorkerModalRef = ref<HTMLElement | null>(null);
  let editWorkerModalInstance: Modal | null = null;

  // This var is used to disable process button
  const isClear: any = ref(false);
  const isClearForEdit: any = ref(false);
  const workForceServiceproxy = new WorkForceServiceProxy();

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

  async function getRoleTypesList() {
    try {
      await workForceServiceproxy.getWorkerRoleTypesList().then((result: WorkerRoleTypeDto) => {
        rawRoleTypes.value = result.roles;

        result.byScope.forEach((role: any) => {
          const roleData = {
            scope: role.scopeName,
            isChecked: false,
            roles: [],
          };
          selectedScopeTypes.value.push(roleData);
          editSelectedScopeTypes.value.push(roleData);
          roleTypesData.value.push({
            scopeName: role.scopeName,
            roleTypeNames: role.roleTypeNames.split(', '),
          });
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function getWorkersList() {
    try {
      await workForceServiceproxy.getWorkersList().then((result: WorkerDto[]) => {
        workersData.value = result;

        workersData.value.forEach((worker: WorkerDto, key: any) => {
          const currentWorkerData = workersData.value.find((data) => data.id == worker.id);
          const roleTypeIds = currentWorkerData?.workerRoleTypeIds.split(', ');

          let roleAssignment: any = [];

          roleTypeIds?.forEach((roleTypeId) => {
            const roleType: any = rawRoleTypes.value.find(
              (type) => type.id == parseInt(roleTypeId)
            );

            const filteredRoleAssignment = roleAssignment.filter(
              (role: any) => role.scope == roleType.scopeName
            );

            let roleData: any;

            if (filteredRoleAssignment.length > 0) {
              roleData = filteredRoleAssignment[0];
              roleData.roles.push(roleType.roleTypeName);
            } else {
              roleData = {
                scope: roleType.scopeName,
                roles: [],
              };
              roleData.roles.push(roleType.roleTypeName);

              roleAssignment.push(roleData);
            }
          });

          workersData.value[key].roleAssignment = roleAssignment;
        });
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
      data: workersData.value,
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
          title: 'Name',
          field: 'name',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Name',
          width: 200,
        },
        {
          title: 'Scope Types',
          field: 'scopeTypes',
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
          title: 'Roles',
          field: 'roleAssignment',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Filter by Role',
          width: 250,
          formatter: function (cell) {
            console.log('cell', cell);
            const cellElement = cell.getElement();
            cellElement.style.whiteSpace = 'normal';
            cellElement.style.wordBreak = 'break-word';

            const cellValue = cell.getValue();

            if (!Array.isArray(cellValue)) {
              return '';
            }

            return cellValue
              .map(
                (item) =>
                  `<div style="margin-bottom: 4px;"><strong>${item.scope}</strong>: ${item.roles
                    .join(', ')
                    .replace(/, ([^,]*)$/, ' & $1')}</div>`
              )
              .join('');
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
          formatter: editButtonFormatter,
          cellClick: function (e, cell) {
            resetEditSelectedScopeTypes();
            const rowData = cell.getRow().getData();

            editId.value = rowData.id;

            editWorkerName.value = rowData.name;

            workerStatusTypesId.value = workerStatusTypesList.value.find(
              (status: any) => status.status_name === rowData.statusName
            )?.id;

            const currentWorkerData = workersData.value.find((data) => data.id == rowData.id);
            const roleTypeIds = currentWorkerData?.workerRoleTypeIds.split(', ');
            roleTypeIds?.forEach((roleTypeId) => {
              const roleType = rawRoleTypes.value.find((type) => type.id == parseInt(roleTypeId));

              const currentSelected = editSelectedScopeTypes.value.find(
                (scopeTypes: any) => scopeTypes.scope == roleType?.scopeName
              );
              currentSelected.isChecked = true;
              currentSelected.roles.push(roleType?.roleTypeName);
            });

            openEditWorkerModal();
          },
        },
      ],
    });
  };

  const fetchEligibleUsers = async () => {
    try {
      await workForceServiceproxy
        .getEligibleUsers(EligibleUserTypeEnum.Worker)
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
      console.error('Error fetching Eligible Users List data:', error);
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
    await init();
  });

  const init = async () => {
    await getRoleTypesList();
    await getWorkersList();

    initializeTabulator();
    await fetchEligibleUsers();
    await fetchWorkerStatusTypesList();

    if (addWorkerModalRef.value) {
      addWorkerModalInstance = new Modal(addWorkerModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    if (editWorkerModalRef.value) {
      editWorkerModalInstance = new Modal(editWorkerModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
  };

  const resetEditSelectedScopeTypes = () => {
    editSelectedScopeTypes.value.forEach((row: any) => {
      row.isChecked = false;
      row.roles = [];
    });
  };

  const editButtonFormatter = () => {
    return `<button class="btn btn-link text-primary text-decoration-none" style="margin-top: -8px;padding: 5px 10px;font-size: 100%;"><i class="bi bi-pencil-square"></i> View/Edit</button>`;
  };

  const closeWorkers = () => {
    router.push({ name: 'workforce-team-leads' });
  };

  const openAddNewWorkerModal = () => {
    if (addWorkerModalInstance) {
      addWorkerModalInstance.show();
    }
  };

  const closeAddNewWorkerModal = () => {
    if (addWorkerModalInstance) {
      addWorkerModalInstance.hide();
    }
  };

  const openEditWorkerModal = () => {
    if (editWorkerModalInstance) {
      editWorkerModalInstance.show();
    }
  };

  const checkIfRoleSelected = (scopeName: any) => {
    const selectedScopeTypeData = selectedScopeTypes.value.find(
      (scopeTypes: any) => scopeTypes.scope == scopeName
    );
    if (selectedScopeTypeData) {
      if (selectedScopeTypeData.isChecked) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const checkEditIfRoleSelected = (scopeName: any) => {
    const selectedScopeTypeData = editSelectedScopeTypes.value.find(
      (scopeTypes: any) => scopeTypes.scope == scopeName
    );
    if (selectedScopeTypeData) {
      if (selectedScopeTypeData.isChecked) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const checkSelectedScopeTypeData = (scopeName: any) => {
    const selectedScopeTypeData = selectedScopeTypes.value.find(
      (scopeTypes: any) => scopeTypes.scope == scopeName
    );

    if (selectedScopeTypeData.isChecked) {
      selectedScopeTypeData.isChecked = false;
      selectedScopeTypeData.roles = [];
    } else {
      selectedScopeTypeData.isChecked = true;
    }
  };

  const checkEditSelectedScopeTypeData = (scopeName: any) => {
    const selectedScopeTypeData = editSelectedScopeTypes.value.find(
      (scopeTypes: any) => scopeTypes.scope == scopeName
    );

    if (selectedScopeTypeData.isChecked) {
      selectedScopeTypeData.isChecked = false;
      selectedScopeTypeData.roles = [];
    } else {
      selectedScopeTypeData.isChecked = true;
    }
  };

  watch(
    eligibleUserId,
    (newVal) => {
      isClear.value = false;
      if (newVal != null) {
        selectedScopeTypes.value.forEach((val: any) => {
          if (val.isChecked && val.roles.length > 0) {
            isClear.value = true;
            return;
          }
        });
      }
    },
    { deep: true }
  );

  watch(
    selectedScopeTypes,
    (newVal) => {
      isClear.value = false;
      if (eligibleUserId.value != null) {
        newVal.forEach((val: any) => {
          if (val.isChecked && val.roles.length > 0) {
            isClear.value = true;
            return;
          }
        });
      }
    },
    { deep: true }
  );

  watch(
    editSelectedScopeTypes,
    (newVal) => {
      isClearForEdit.value = false;

      newVal.forEach((val: any) => {
        if (val.isChecked && val.roles.length > 0) {
          isClearForEdit.value = true;
          return;
        }
      });
    },
    { deep: true }
  );

  const submitNewWorker = async () => {
    if (userId.value) {
      if (eligibleUserId.value && selectedScopeTypes.value.length > 0) {
        isLoading.value = true;
        try {
          const scopeTypeWithRoles = [] as ScopeTypeWithRoleDto[];

          selectedScopeTypes.value.forEach((selectedScopeType: any) => {
            if (selectedScopeType.isChecked)
              scopeTypeWithRoles.push({
                scopeTypeName: selectedScopeType.scope,
                roles: selectedScopeType.roles,
              } as ScopeTypeWithRoleDto);
          });

          await workForceServiceproxy.createWorker({
            workerUserId: eligibleUserId.value,
            createdBy: userId.value,
            scopeTypeWithRoles,
          } as CreateWorkerDto);
        } catch (error) {
          console.error('Worker Create Error:', error);
        } finally {
          isLoading.value = false;
          closeAddNewWorkerModal();
          await init();
        }
      } else {
        alert('All field are required');
      }
    } else {
      console.log('User ID not defined');
    }
  };

  const submitEditWorker = async () => {
    let roleTypeIds: any = [];

    editSelectedScopeTypes.value.forEach((row: any) => {
      if (row.isChecked && row.roles.length > 0) {
        row.roles.forEach((role: string) => {
          roleTypeIds.push(
            rawRoleTypes.value.find(
              (type) => type.scopeName == row.scope && type.roleTypeName === role
            )?.id
          );
        });
      }
    });

    if (userId.value) {
      if (editId.value && editSelectedScopeTypes.value.length > 0) {
        const editWorkerRequestBody = {
          roleTypeIds,
          workerStatusTypesId: workerStatusTypesId.value,
          updatedBy: userId.value,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/workforce/workers/${editId.value}/update`,
          targetMethodType: 'POST',
        };

        isLoading.value = true;

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, editWorkerRequestBody, { timeout: 10000 });
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
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Workforce Manager / Workers</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeWorkers">
            Close Workers View<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <div class="sub-header-content d-flex justify-content-between">
      <button class="btn btn-primary btn-new-project" @click="openAddNewWorkerModal">
        <i class="bi-plus-circle" />ADD WORKER
      </button>
    </div>

    <div ref="table" class="table-container"></div>

    <div
      ref="addWorkerModalRef"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="editTeamLeadModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="pasteModalLabel" class="modal-title">ADD NEW WORKER</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="dropdownSelect">* New Worker</label>
              <v-select
                v-model="eligibleUserId"
                :options="vSelectEligibleUsersList"
                label="label"
                :reduce="(option: VSelectDropdownData) => option.id"
                class="form-control"
                placeholder="Select from available users"
              >
                <template #no-options>
                  <span>No eligible users to be a worker.</span>
                </template>
              </v-select>
            </div>
            <div class="form-group mt-3">
              <label>* <strong>Scope Types</strong> (must choose at least one)</label>
            </div>
            <div class="form-group">
              <div v-for="(role, key) in roleTypesData" :key="role.scopeName" class="form-check">
                <input
                  :id="'scopeType_' + key"
                  class="form-check-input cursor-pointer"
                  type="checkbox"
                  name="scopeType"
                  :value="role.scopeName"
                  @click="checkSelectedScopeTypeData(role.scopeName)"
                />
                <label class="form-check-label cursor-pointer" :for="'scopeType_' + key">{{
                  role.scopeName
                }}</label>
                <div class="form-group">
                  <label>* <strong>Roles</strong></label>
                  <div class="d-flex flex-wrap gap-2">
                    <div
                      v-for="(roleType, index) in role.roleTypeNames"
                      :key="roleType + '_' + index"
                      class="form-check"
                    >
                      <input
                        :id="'roleType_' + key + '_' + index"
                        v-model="selectedScopeTypes[key].roles"
                        class="form-check-input cursor-pointer"
                        type="checkbox"
                        :disabled="!checkIfRoleSelected(role.scopeName)"
                        :value="roleType"
                      />
                      <label
                        class="form-check-label cursor-pointer"
                        :for="'roleType_' + key + '_' + index"
                        >{{ roleType }}</label
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!isClear"
              @click="submitNewWorker"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      ref="editWorkerModalRef"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="addTeamLeadModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="pasteModalLabel" class="modal-title">EDIT WORKER</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <h3 class="text-dark">{{ editWorkerName }}</h3>
            </div>
            <div class="form-group mt-3">
              <label>* <strong>Scope Types</strong> (must choose at least one)</label>
            </div>
            <div class="form-group">
              <div v-for="(role, key) in roleTypesData" :key="role.scopeName" class="form-check">
                <input
                  :id="'editScopeType_' + key"
                  class="form-check-input cursor-pointer"
                  type="checkbox"
                  name="scopeType"
                  :value="role.scopeName"
                  :checked="editSelectedScopeTypes[key].isChecked"
                  @click="checkEditSelectedScopeTypeData(role.scopeName)"
                />
                <label class="form-check-label cursor-pointer" :for="'editScopeType_' + key">{{
                  role.scopeName
                }}</label>
                <div class="form-group">
                  <label>* <strong>Roles</strong></label>
                  <div class="d-flex flex-wrap gap-2">
                    <div
                      v-for="(roleType, index) in role.roleTypeNames"
                      :key="roleType + '_' + index"
                      class="form-check"
                    >
                      <input
                        :id="'editRoleType_' + key + '_' + index"
                        v-model="editSelectedScopeTypes[key].roles"
                        class="form-check-input cursor-pointer"
                        type="checkbox"
                        :disabled="!checkEditIfRoleSelected(role.scopeName)"
                        :value="roleType"
                      />
                      <label
                        class="form-check-label cursor-pointer"
                        :for="'editRoleType_' + key + '_' + index"
                        >{{ roleType }}</label
                      >
                    </div>
                  </div>
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
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!isClearForEdit"
              @click="submitEditWorker"
            >
              Update
            </button>
          </div>
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
