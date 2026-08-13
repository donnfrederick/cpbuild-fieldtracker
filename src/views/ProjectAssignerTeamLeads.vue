<script setup lang="ts">
  import axios from 'axios';
  import { Modal } from 'bootstrap';
  import { ref, onMounted, computed, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter } from 'vue-router';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';

  import TopNavBar from '@/components/TopNavBar.vue';
  import type { IHIProjectsData, TeamLeadsData } from '@/interfaces/project';
  import type { VSelectDropdownData } from '@/interfaces/common';
  import { ProjectAssignerServiceProxy } from '@/shared/service-proxies/service-proxies';

  const authStore = useAuthStore();
  const router = useRouter();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');

  const ihiProjectsData = ref<IHIProjectsData[]>([]);

  // Data for the eligible user dropdown in create modal
  const teamLeadsList = ref<TeamLeadsData[]>([]);
  const vSelectTeamLeadsList = ref<VSelectDropdownData[]>([]);

  // Model for Assign Modal
  const teamLeadId: any = ref(null);
  const currentProject: any = ref({});
  const currentTask: any = ref({});

  // Edit Team Lead Modal
  const editAssignmentModalRef = ref<HTMLElement | null>(null);
  let editAssignmentModalInstance: Modal | null = null;

  const expandedProject = ref<number>(0);

  const showToast = ref(false);
  const toastMessage = ref('');
  const projectAssignerServiceProxy = new ProjectAssignerServiceProxy();

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

  async function getIHIProjects() {
    try {
      await projectAssignerServiceProxy
        .getAllProjectWithTasks()
        .then((response) => {
          ihiProjectsData.value = response as IHIProjectsData[];

          ihiProjectsData.value.forEach((project, key) => {
            ihiProjectsData.value[key].tasks.forEach((task, index) => {
              ihiProjectsData.value[key].tasks[index].teamLeadId =
                task.teamLeadId == null ? 0 : task.teamLeadId;
              ihiProjectsData.value[key].tasks[index].teamLeadName =
                task.teamLeadName == null || task.teamLeadName == ''
                  ? 'Unassigned'
                  : task.teamLeadName;
            });

            if (expandedProject.value == project.projectId) {
              ihiProjectsData.value[key].expanded = true;
            } else {
              ihiProjectsData.value[key].expanded = false;
            }
          });
        })
        .catch((error) => {
          console.error('Service Proxy Error:', error);
        });
    } catch (error) {
      console.log(error);
    }
  }

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

      teamLeadsList.value = response.data;
    } catch (error) {
      console.log(error);
    }
  }

  onMounted(async () => {
    isLoading.value = true;

    await getIHIProjects();
    await getTeamLeads();

    if (editAssignmentModalRef.value) {
      editAssignmentModalInstance = new Modal(editAssignmentModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }

    isLoading.value = false;
  });

  const closeProjectAssigner = () => {
    router.push({ name: 'dashboard' });
  };

  const filterText = ref('');
  const sortKey = ref<keyof IHIProjectsData>('projectName'); // Example default sort key, adjust as needed
  const sortOrder = ref(1); // 1 for ascending, -1 for descending

  // Function to change the sort key and toggle sort order
  function sortTable(key: keyof IHIProjectsData) {
    sortKey.value = key;
    sortOrder.value = sortKey.value === key && sortOrder.value === 1 ? -1 : 1;
  }

  // Function to show an alert message
  function putOnEdit(project: any, task: any) {
    vSelectTeamLeadsList.value = [
      {
        label: 'Unassigned',
        id: 0,
        value: 'Unassigned',
        description: '',
      },
      ...teamLeadsList.value
        .map((tl: TeamLeadsData) => {
          if (tl.scopeAssignments.some((scope: any) => scope.scopeTypeId === task.scopeTypeId)) {
            return {
              label: tl.name,
              id: tl.id,
              value: tl.name,
              description: '',
            };
          }
          return undefined; // Ensures undefined is returned if the condition is not met
        })
        .filter((item): item is VSelectDropdownData => item !== undefined),
    ];

    currentProject.value = project;
    currentTask.value = task;

    const teamLeadFromList = vSelectTeamLeadsList.value.filter(
      (list) => currentProject.value.tasks[0].teamLeadId == list.id
    );
    if (teamLeadFromList.length > 0) {
      teamLeadId.value = currentProject.value.tasks[0].teamLeadId;
    }

    if (editAssignmentModalInstance) {
      editAssignmentModalInstance.show();
    }
  }

  // Function to clear the filter text
  function clearFilter() {
    filterText.value = '';
  }

  // Computed property to filter and sort projects
  const filteredAndSortedProjects = computed(() => {
    return ihiProjectsData.value
      .filter((project) => {
        const projectNameMatch = project.projectName
          .toLowerCase()
          .includes(filterText.value.toLowerCase());
        const tasksMatch =
          project.tasks.length > 0
            ? project.tasks.some(
                (task: any) =>
                  task.scopeTypeName.toLowerCase().includes(filterText.value.toLowerCase()) ||
                  (task.teamLeadName || 'unassigned')
                    .toLowerCase()
                    .includes(filterText.value.toLowerCase())
              )
            : null;
        return projectNameMatch || tasksMatch;
      })
      .sort((a, b) => {
        return (a[sortKey.value] > b[sortKey.value] ? 1 : -1) * sortOrder.value;
      });
  });

  const submitTeamLeadAssignment = async () => {
    isLoading.value = true;

    if (userId.value) {
      if (currentProject.value) {
        const updateProjectRequestBody = {
          scopeTypeId: currentTask.value.scopeTypeId,
          statusId: currentTask.value.statusId,
          updatedBy: userId.value,
          teamLeadId: teamLeadId.value,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/project-assigner/ihi-projects/${currentTask.value.id}/update`,
          targetMethodType: 'PATCH',
        };

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, updateProjectRequestBody, { timeout: 10000 });

          editAssignmentModalInstance?.hide();

          await getIHIProjects();

          showToast.value = true;
          toastMessage.value =
            teamLeadId.value > 0 ? 'Project has been assigned' : 'Project has been unassigned';

          isLoading.value = false;

          setTimeout(() => {
            showToast.value = false;
            toastMessage.value = '';
          }, 5000);
        } catch (error) {
          console.error('Error updating the IHI Unit entry:', error);
        }
      } else {
        alert('All field are required');
        isLoading.value = false;
      }
    } else {
      console.log('User ID not defined');
      isLoading.value = false;
    }
  };

  const expandProject = (project: IHIProjectsData) => {
    expandedProject.value = project.projectId;
    project.expanded = !project.expanded;
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
    <button @click="showToast = false">Close</button>
  </div>

  <div class="body-content project-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12 pt-2">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Project Assigner / Team Leads</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeProjectAssigner">
            Close Tool<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <div class="project-breakdown-list mt-5">
      <div class="input-group mb-3">
        <input
          v-model="filterText"
          type="text"
          placeholder="Filter by project, scope type, or team lead..."
          class="form-control"
        />
        <button
          v-show="filterText"
          class="btn btn-outline-secondary"
          type="button"
          @click="clearFilter"
        >
          &#x2715;
        </button>
      </div>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th class="first-column" @click="sortTable('projectName')">Project Name</th>
            <th class="second-column">Scope Types and Assignments</th>
          </tr>
        </thead>
        <tbody v-if="filteredAndSortedProjects.length > 0">
          <tr v-for="project in filteredAndSortedProjects" :key="project.projectId">
            <td>{{ project.projectName }}</td>
            <td>
              <button class="btn link-type-button" @click="expandProject(project)">
                {{ project.expanded ? '- Hide' : '+ Expand' }}
              </button>
              <div v-if="project.expanded">
                <table class="table mt-2">
                  <thead>
                    <tr>
                      <th>Scope Type</th>
                      <th>Team Lead</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody v-if="project.tasks.length > 0">
                    <tr v-for="(task, index) in project.tasks" :key="index">
                      <td>{{ task.scopeTypeName }}</td>
                      <td
                        :class="{
                          'text-danger':
                            task.teamLeadName == null || task.teamLeadName == 'Unassigned',
                        }"
                      >
                        {{ task.teamLeadName || 'Unassigned' }}
                      </td>

                      <td>
                        <button class="link-type-button" @click="putOnEdit(project, task)">
                          Edit Assignment
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td>
              <strong class="text-danger">No projects added</strong>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div ref="editAssignmentModalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">EDIT ASSIGNMENT</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="dropdownSelect">* Team Leads</label>
            <v-select
              id="installTeamSelect"
              v-model="teamLeadId"
              :options="vSelectTeamLeadsList"
              label="label"
              :reduce="(option: VSelectDropdownData) => option.id"
              class="form-control"
              placeholder="Select from team leads"
            >
              <template #no-options>
                <span>No active team lead.</span>
              </template>
            </v-select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="submitTeamLeadAssignment">
            Assign
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

  .project-viewer {
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

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  .dropdown-container .form-control {
    padding: 0;
    border: none;
  }

  @media (max-width: 526px) {
    .project-viewer {
      margin-top: 103px;
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .project-breakdown-list {
    max-width: 800px;
    padding-bottom: 200px;
    padding-left: 25px;
  }

  input {
    width: calc(100% - 45px); /* Adjust input width to account for the button */
  }

  .link-type-button,
  .input-group button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }

  .input-group button {
    cursor: pointer;
    border: 0;
    background: transparent;
    color: #ccc;
    text-align: center;
    font-size: 1.5rem;
  }

  .input-group button:hover {
    color: #888;
  }

  .input-group {
    width: 350px;
  }

  th {
    font-weight: bold;
  }

  .second-column {
    width: 580px;
  }
</style>
