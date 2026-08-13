<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute } from 'vue-router';
  import 'vue-select/dist/vue-select.css';

  import TopNavBar from '@/components/TopNavBar.vue';
  import type { ProjectAssinmentData, Tasks } from '@/interfaces/project';
  import { teamLeadsGetApi } from '@/services/projectAssigner';
  import { teamLeadActiveIHIProjectApi } from '@/services/laborManager';
  import type { InstallTrackerTaskQueue } from '@/interfaces/installTracker';
  import { InspectionTrackerService } from '@/services/inspectionTracker';
  import type { InspectionsMainTasks } from '@apiInterface/inspectionTracker/inspectionsMainTasks';
  import type { PendingReInspectionTasks } from '@apiInterface/inspectionTracker/pendingReInspections';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { ModeTool } from '@/interfaces/common/modeTool';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');
  const sessionStorageService = new SessionStorageService();

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
  const mainTasks = ref<InspectionsMainTasks[]>([]);
  const reInspectionTasks = ref<PendingReInspectionTasks[]>([]);
  const inspectionTrackerService = new InspectionTrackerService();

  async function getTeamLeads() {
    try {
      const response = await teamLeadsGetApi({
        userRoles: userRoleString.value,
      });

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
      const { data } = await teamLeadActiveIHIProjectApi({
        teamLeadId: teamLeadId.value,
        userRoles: userRoleString.value,
      });

      ihiProject.value = data.projectAssignment.find((proj: any) =>
        proj.tasks.some((task: any) => task.id == route.params.projectScopeId)
      );

      if (ihiProject.value != null) {
        tasks.value = ihiProject.value.tasks.filter(
          (task: any) => task.id == route.params.projectScopeId
        );
      }
    } catch (error) {
      console.error('getIHIProjects error:', error);
    }
  }

  onMounted(async () => {
    isLoading.value = true;

    // Load necessary data
    await getTeamLeads();
    await getIHIProjects();

    await inspectionTrackerService
      .getInpectionMainTasks(Number(route.params.projectScopeId))
      .then((result) => {
        mainTasks.value = result;
      });

    await inspectionTrackerService
      .getPendingReInspectionTasks(Number(route.params.projectScopeId))
      .then((result) => {
        reInspectionTasks.value = result;
      });

    isLoading.value = false;
  });

  const closeTool = () => {
    router.push({
      name: 'inspection-tracker-project-scopes',
    });
  };

  const goToCompletedInspections = () => {
    router.push({
      name: 'inspection-tracker-completed-inspections',
      params: {
        projectScopeId: route.params.projectScopeId,
      },
    });
  };

  const goToTaskSubmission = (item: InstallTrackerTaskQueue) => {
    const sessionKey = `taskSubmissionViewer_task_${item.taskId}`;
    sessionStorageService.setItem<ModeTool>(sessionKey, {
      mode: 'inspection',
      tool: 'inspectionTracker',
    });
    router.push({
      name: 'task-submission-viewer',
      params: {
        projectId: route.params.projectScopeId,
        unitId: item.unitByScopeId,
        taskId: item.taskId,
      },
    });
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
            Tools / Inspection Tracker / {{ ihiProject?.projectName }} ({{
              tasks[0]?.scopeTypeName
            }}) / Inspection Queue</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeTool">
            Go Back<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <template v-if="!isLoading">
      <div v-if="!isLoading" class="inspection-queue">
        <h4 class="text-dark fw-bold">
          {{ ihiProject?.projectName }} ({{ tasks[0]?.scopeTypeName }})
        </h4>
        <button class="view-completed-inspections" @click="goToCompletedInspections">
          View Completed Inspections
        </button>

        <SubTaskQueue
          v-if="reInspectionTasks.length > 0"
          :items="reInspectionTasks"
          class="mb-4"
          :title="'Re-inspection Queue'"
          :start-action-text="'Start Inspection'"
          @start-action="goToTaskSubmission"
        />
        <MainTasksQueue
          v-if="mainTasks.length > 0"
          :items="mainTasks"
          class="mb-4"
          :title="'Inspection Queue'"
        >
          <template #taskLabel> <div class="d-none"></div> </template>
          <template #actions="{ item: item }">
            <button class="task-action-button" @click="goToTaskSubmission(item)">
              Start Inspection
            </button>
          </template>
        </MainTasksQueue>
      </div>
    </template>
  </div>
</template>
<style scoped>
  .inspection-queue {
    padding: 2rem 3rem;
  }
  .view-completed-inspections {
    color: #19a7af;
    background: transparent;
    font-weight: bold;
    font-size: 18px;
    border: none;
    outline: none;
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

  hr {
    margin: 0 15px;
    color: #7a7a7a;
  }

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }
  }

  .task-action-button,
  :deep(.sub-task-action-button) {
    width: 145px;
  }

  :deep(.tasks .task-container, .tasks .task-container.current) {
    background-color: transparent !important;
    padding: 20px 0;
  }
</style>
