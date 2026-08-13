<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
  import 'vue-select/dist/vue-select.css';

  import TopNavBar from '@/components/TopNavBar.vue';
  import ReadyTasksSummaryButton from '@/components/ReadyTasksSummaryButton.vue';

  import {
    ReadyTasksSummaryDto,
    LaborManagerServiceProxy,
    TaskSubmissionViewerServiceProxy,
  } from '@/shared/service-proxies/service-proxies';

  import { teamLeadsGetApi } from '@/services/projectAssigner';
  import { localStorageHelper } from '@/util/localStorageHelper';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { storeToRefs } from 'pinia';
  import MaskingSelector from '@/components/MaskingSelector.vue';
  import { featureFlags } from '@/config/featureFlags';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import MaskingIndicator from '@/components/MaskingIndicator.vue';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);
  const maskingStore = useMaskingStore();
  const { isMasking } = storeToRefs(maskingStore);
  const offlineModeEnabled = ref<boolean>(featureFlags.offlineMode as boolean);

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');
  const teamLeadId: any = ref(0);

  const laborManagerService = new LaborManagerServiceProxy();
  const taskSubmissionViewerServiceProxy = new TaskSubmissionViewerServiceProxy();

  const readyTasks = ref<ReadyTasksSummaryDto[]>([]);

  const allowedMaskingRole = ref<boolean>(false);

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

  async function getTeamLeads() {
    try {
      if (isOffline.value) {
        teamLeadId.value = localStorageHelper<number>('teamLeadId').get() || 0;
        return;
      }

      const teamLeadIdLocalStorage = localStorageHelper<number>('teamLeadId');
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

      teamLeadIdLocalStorage.set(teamLeadId.value);
    } catch (error) {
      console.error('Error fetching team leads:', error);
    }
  }

  async function getReadyTasksSummary() {
    try {
      await laborManagerService
        .getReadyTasksSummary(teamLeadId.value)
        .then((result: ReadyTasksSummaryDto[]) => {
          readyTasks.value = result;

          readyTasks.value.forEach((scope, index) => {
            readyTasks.value[index].expanded = false;
            readyTasks.value[index].mainTaskExpanded = false;
            readyTasks.value[index].subTaskExpanded = false;
            readyTasks.value[index].inspectionExpanded = false;
            readyTasks.value[index].reinspectionExpanded = false;
          });

          isLoading.value = false;
        })
        .finally(async () => {
          if (!offlineModeEnabled.value) {
            return;
          }

          const taskIds = readyTasks.value.flatMap((r: ReadyTasksSummaryDto) =>
            [
              'submittedMainTasks',
              'submittedSubTasks',
              'pendingInspections',
              'pendingReinspections',
            ].flatMap((key) => (r as any)[key]?.map((t: any) => t.taskId) ?? [])
          );

          if (taskIds.length) {
            await taskSubmissionViewerServiceProxy.getTaskSubmissionViewerDetailsBulkForOffline(
              taskIds
            );
          }
        });
    } catch (error) {
      console.log(error);
    }
  }

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

    if (isOffline.value && userId.value == 0)
      userId.value = localStorageHelper<number | null>('userId').get();
  });

  onMounted(async () => {
    isLoading.value = true;

    const userRoles = authStore.userInfo?.clientPrincipal.allowedRoles || [];
    const allowedRoles = (route.meta?.allowedRoles as string[]) || [];

    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

    allowedMaskingRole.value = userRoles.some((role) =>
      ['admin', 'installdirector'].includes(role)
    );

    if (!hasAllowedRole) {
      router.push({ name: 'dashboard' });
      localStorage.setItem('redirectMsg', 'You do not have permission to access this tool.');
      return;
    }

    await getTeamLeads();
    await getReadyTasksSummary();
  });

  const closeTool = () => {
    router.push({ name: 'dashboard' });
  };

  const expandScope = (scope: ReadyTasksSummaryDto, mode: string) => {
    if (mode == 'projectScope') {
      scope.expanded = !scope.expanded;
    } else if (mode == 'mainTask') {
      scope.mainTaskExpanded = !scope.mainTaskExpanded;
    } else if (mode == 'subTask') {
      scope.subTaskExpanded = !scope.subTaskExpanded;
    } else if (mode == 'inspection') {
      scope.inspectionExpanded = !scope.inspectionExpanded;
    } else {
      scope.reinspectionExpanded = !scope.reinspectionExpanded;
    }
  };

  const redirectToActiveProjectScopes = () => {
    router.push({
      name: 'labor-manager-assigned-projects-active',
    });
  };

  watch(
    () => isMasking.value,
    async () => {
      isLoading.value = true;
      await getReadyTasksSummary();
    }
  );
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
            Tools / Labor Manager / Ready Task Summary</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeTool">
            Close Tool<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <template v-if="!isOffline">
      <MaskingSelector v-if="featureFlags.maskingMode && allowedMaskingRole && !isMasking" />

      <MaskingIndicator v-if="featureFlags.maskingMode && allowedMaskingRole && isMasking" />
    </template>

    <hr />

    <button class="redirect-btn" @click="redirectToActiveProjectScopes">
      <i class="bi bi-eye"></i>
      View Project Scopes
    </button>

    <div class="ready-tasks col-md-4 mb-5">
      <template v-if="readyTasks.length > 0">
        <div v-for="scope in readyTasks" :key="scope.id" class="project-scope">
          <button
            v-if="
              scope.submittedMainTasks.length > 0 ||
              scope.submittedSubTasks.length > 0 ||
              scope.pendingInspections.length > 0 ||
              scope.pendingReinspections.length > 0
            "
            class="scope-header"
            @click="expandScope(scope, 'projectScope')"
          >
            <i
              :class="{
                bi: true,
                'bi-caret-down-fill': !scope.expanded,
                'bi-caret-up-fill': scope.expanded,
              }"
            ></i>
            <span class="text-dark fw-bold">
              {{ scope.projectName }} ({{ scope.scopeTypeName }})
            </span>
          </button>
          <div v-if="scope.expanded" class="types">
            <div v-if="scope.submittedMainTasks.length > 0" class="type">
              <button class="type-header" @click="expandScope(scope, 'mainTask')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.mainTaskExpanded,
                    'bi-caret-up-fill': scope.mainTaskExpanded,
                  }"
                ></i>
                Submitted Main Tasks ({{ scope.submittedMainTasks.length }})
              </button>
              <div v-if="scope.mainTaskExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.submittedMainTasks != undefined"
                  :tasks="scope.submittedMainTasks"
                  tool="laborManager"
                  mode="review"
                />
                <strong v-if="scope.submittedMainTasks?.length == 0" class="text-danger no-task"
                  >No Submitted Main Task</strong
                >
              </div>
            </div>
            <div v-if="scope.submittedSubTasks.length > 0" class="type">
              <button class="type-header" @click="expandScope(scope, 'subTask')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.subTaskExpanded,
                    'bi-caret-up-fill': scope.subTaskExpanded,
                  }"
                ></i>
                Submitted Subtasks ({{ scope.submittedSubTasks.length }})
              </button>
              <div v-if="scope.subTaskExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.submittedSubTasks != undefined"
                  :tasks="scope.submittedSubTasks"
                  :project-id="scope.id"
                  tool="laborManager"
                  mode="review"
                />
                <strong v-if="scope.submittedSubTasks?.length == 0" class="text-danger no-task"
                  >No Submitted Subtask</strong
                >
              </div>
            </div>
            <div v-if="scope.pendingInspections.length > 0" class="type">
              <button class="type-header" @click="expandScope(scope, 'inspection')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.inspectionExpanded,
                    'bi-caret-up-fill': scope.inspectionExpanded,
                  }"
                ></i>
                Pending Clear Inspections ({{ scope.pendingInspections.length }})
              </button>
              <div v-if="scope.inspectionExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.pendingInspections != undefined"
                  :tasks="scope.pendingInspections"
                  :project-id="scope.id"
                  tool="laborManager"
                  mode="inspection"
                />
                <strong v-if="scope.pendingInspections?.length == 0" class="text-danger no-task"
                  >No Pending Inspection</strong
                >
              </div>
            </div>
            <div v-if="scope.pendingReinspections.length > 0" class="type">
              <button class="type-header" @click="expandScope(scope, 'reInspection')">
                <i
                  :class="{
                    bi: true,
                    'bi-caret-down-fill': !scope.reinspectionExpanded,
                    'bi-caret-up-fill': scope.reinspectionExpanded,
                  }"
                ></i>
                Pending Re-Inspections ({{ scope.pendingReinspections.length }})
              </button>
              <div v-if="scope.reinspectionExpanded" class="tasks">
                <ReadyTasksSummaryButton
                  v-if="scope.pendingReinspections != undefined"
                  :tasks="scope.pendingReinspections"
                  :project-id="scope.id"
                  tool="laborManager"
                  mode="inspection"
                />
                <strong v-if="scope.pendingReinspections?.length == 0" class="text-danger no-task"
                  >No Pending Re-Inspection</strong
                >
              </div>
            </div>
          </div>
        </div>
      </template>
      <span v-else class="no-result">No pending tasks to review or inspect.</span>
    </div>
  </div>
</template>

<style scoped>
  .redirect-btn {
    color: #fff;
    background: #19a7af;
    margin: 2rem 0 0.5rem 2rem;
    padding: 0.7rem 1rem;
    border: none;
    border-radius: 5px;
    outline: none;
  }
  .ready-tasks {
    padding: 1rem;
  }
  .ready-tasks .project-scope {
    margin-bottom: 1rem;
  }
  .ready-tasks .project-scope .scope-header {
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
  }
  .ready-tasks .project-scope .types {
    padding: 0.5rem 2rem;
  }
  .ready-tasks .project-scope .types .type-header {
    width: 100%;
    color: #000;
    background: #d8f0f1;
    border: none;
    outline: none;
    text-align: left;
    margin-bottom: 0.7rem;
    font-weight: bolder;
    padding: 0.4rem 0.6rem;
    font-size: 17px;
  }
  .ready-tasks .project-scope .types .tasks .no-task {
    display: block;
    margin-bottom: 0.7rem;
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
    min-width: 400px;
  }

  .breadcrumb-nav {
    font-size: 16px;
    font-weight: 200;
  }

  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
  }

  .bi-x-circle {
    margin-left: 5px;
  }

  i.bi-caret-down-fill,
  i.bi-caret-up-fill {
    margin-right: 5px;
    color: #19a7af;
  }

  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }

  hr {
    margin: 0 15px;
    color: #7a7a7a;
    min-width: 400px;
  }

  .error-message {
    color: #dc3545;
    padding: 10px 30px;
    text-align: center;
    width: 100%;
    background-color: #f8d7da;
  }

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }
  }
</style>
