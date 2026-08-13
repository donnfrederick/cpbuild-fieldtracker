<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
  import 'vue-select/dist/vue-select.css';
  import { storeToRefs } from 'pinia';
  import { featureFlags } from '@/config/featureFlags';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import {
    ActiveIHIProjectDto,
    LaborManagerServiceProxy,
  } from '@/shared/service-proxies/service-proxies';
  import TopNavBar from '@/components/TopNavBar.vue';
  import MaskingSelector from '@/components/MaskingSelector.vue';
  import MaskingIndicator from '@/components/MaskingIndicator.vue';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const maskingStore = useMaskingStore();
  const { isMasking } = storeToRefs(maskingStore);

  const isLoading = ref(false);
  const userId = ref<number>(0);
  const userRoleString = ref<string>('');

  const laborManagerService = new LaborManagerServiceProxy();

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

  const ihiProjects = ref<ActiveIHIProjectDto[]>([]);

  async function getIHIProjects() {
    try {
      await laborManagerService
        .getActiveIHIProjectsByTeamLeadId(userId.value)
        .then((result: ActiveIHIProjectDto[]) => {
          ihiProjects.value = result;
          ihiProjects.value.forEach((project, index) => {
            ihiProjects.value[index].expanded = false;
          });
        });
    } catch (error) {
      console.log(error);
    }
  }

  async function handlePrintLabels(projectId: number) {
    // Dynamically import the service only when needed
    const { default: generateLabelsPDF } = await import('@/services/unitLabelsService');

    // Call the function
    await generateLabelsPDF(projectId);
  }

  onMounted(async () => {
    isLoading.value = true;

    console.log('featureFlags.maskingMode', featureFlags.maskingMode);

    const userRoles = authStore.userInfo?.clientPrincipal.allowedRoles || [];
    const allowedRoles = (route.meta.allowedRoles as string[]) || [];

    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

    allowedMaskingRole.value = userRoles.some((role) =>
      ['admin', 'installdirector'].includes(role)
    );

    if (!hasAllowedRole) {
      router.push({ name: 'dashboard' });
      localStorage.setItem('redirectMsg', 'You do not have permission to access this tool.');
      return;
    }

    await getIHIProjects();

    isLoading.value = false;
  });

  const closeTool = () => {
    router.push({ name: 'dashboard' });
  };

  const expand = (key: number) => {
    ihiProjects.value[key].expanded = !ihiProjects.value[key].expanded;
  };

  const viewScope = (id: number) => {
    router.push({ name: 'labor-manager-project-scope', params: { id } });
  };

  const redirectToReadyTaskViewer = () => {
    router.push({
      name: 'labor-manager-task-summary',
    });
  };

  watch(
    () => isMasking.value,
    async () => {
      isLoading.value = true;

      try {
        await getIHIProjects();
      } catch (error) {
        console.error(error);
      } finally {
        isLoading.value = false;
      }
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
            Tools / Labor Manager / Assigned Active Projects</span
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

    <MaskingSelector v-if="featureFlags.maskingMode && allowedMaskingRole && !isMasking" />

    <MaskingIndicator v-if="featureFlags.maskingMode && allowedMaskingRole && isMasking" />

    <hr />

    <button class="redirect-btn" @click="redirectToReadyTaskViewer">
      <i class="bi bi-eye"></i>
      View Task Summary
    </button>

    <div class="team-lead-assignments">
      <div class="col-md-3">
        <ul v-if="ihiProjects.length > 0">
          <li v-for="(project, key) in ihiProjects" :key="key" class="project-container">
            <button type="button" class="fw-bold project-button" @click="expand(key)">
              <i
                :class="{
                  bi: true,
                  'bi-caret-down-fill': !project.expanded,
                  'bi-caret-up-fill': project.expanded,
                }"
              ></i>
              {{ project.projectName }}
            </button>
            <div v-if="project.expanded" class="scopes">
              <ul>
                <li v-for="task in project.tasks" :key="task.id" class="scope-item">
                  <div class="d-flex align-items-center">
                    <!-- Scope link -->
                    <span class="scope-link me-3" @click="viewScope(task.id)">
                      {{ task.scopeTypeName }}
                    </span>

                    <!-- Print QR Codes Button -->
                    <button
                      class="btn btn-primary btn-sm d-flex align-items-center print-button"
                      @click="handlePrintLabels(task.id)"
                    >
                      <i class="bi bi-qr-code-scan me-2"></i>
                      <span class="print-button-text">Print Unit Labels</span>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </li>
        </ul>
        <p v-else class="text-danger">
          <i class="bi bi-exclamation-circle"></i> No project has been assigned
        </p>
      </div>
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
  .show-assigned-scope {
    color: #54a6ff;
    cursor: pointer;
  }
  .custom-checkbox {
    display: inline;
    margin-right: 1rem;
  }
  .checkbox-input {
    display: none;
  }
  .checkbox-label {
    width: 20px;
    height: 20px;
    border: 2px solid #c0d9db;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s, border-color 0.3s;
  }
  .checkbox-input:checked + .checkbox-label {
    background-color: #007bff;
    border: 1px solid #007bff;
  }
  .checkbox-input:checked + .checkbox-label::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .scope-assignments {
    margin: 3rem;
  }
  .scope-assignments h6 {
    color: #000;
  }
  .scope-assignments .project {
    margin: 0.5rem 0;
    padding: 0.7rem 0;
  }
  .scope-assignments .project .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 0.7rem;
  }
  .scope-assignments .scopes .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 16px;
    font-weight: 500;
    display: block;
    margin-left: 1rem;
  }
  .scope-assignments .scopes .actions div {
    border-bottom: 1px solid #19a7af;
    padding: 0.3rem;
    margin-left: 2.5rem;
  }
  .scope-assignments .scopes .actions div:last-child {
    border-bottom: none;
  }
  .scope-assignments .scopes .actions button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
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

  i.bi-caret-down-fill,
  i.bi-caret-up-fill {
    margin-right: 5px;
    color: #19a7af;
  }

  .bi-x-circle {
    margin-left: 5px;
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

  .scope-link {
    cursor: pointer;
    text-decoration: none;
    color: #19a7af;
    font-weight: 500;
    font-size: 16px;
  }

  /* Style for the button */
  .print-button {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px; /* Text size */
    padding: 0.4rem 0.6rem;
    background-color: #19a7af; /* Custom color */
    color: #fff;
    border: none;
    border-radius: 4px;
  }

  .print-button-text {
    font-size: 12px; /* Smaller font size for the text */
  }

  .print-button:hover {
    background-color: #b3e7ea; /* Slightly darker hover color */
  }

  .print-button:active {
    background-color: #19a7af; /* Darker active color */
  }

  /* Style for the QR code icon */
  .print-button i {
    font-size: 1rem; /* Icon size */
    margin-right: 0.5rem; /* Space between icon and text */
  }

  /* Spacing between items */
  .scope-item {
    margin-bottom: 0.5rem; /* Space between list items */
  }

  .team-lead-assignments {
    padding: 1rem;
  }
  .team-lead-assignments ul li {
    border-bottom: 1px solid #a2a2a2;
    padding: 1rem;
  }
  .team-lead-assignments ul li:last-child {
    border-bottom: none;
  }
  .team-lead-assignments ul li button {
    background: transparent;
    outline: none;
    border: none;
    font-size: 18px;
    color: #3c3c3c;
  }
  .team-lead-assignments .scopes ul li {
    color: #000;
    font-size: 100%;
    list-style: none;
    border-bottom: 1px solid #cacaca;
    padding: 0.5rem;
  }
  .team-lead-assignments .scopes ul li:last-child {
    border-bottom: none;
  }
  .project-container {
    width: 80vw;
    max-width: 800px;
    min-width: 380px;
    margin-right: 30px;
    padding-right: 10px;
  }
  /* .project-button {
    width: 90vw;
    max-width: 800px;
    min-width: 400px;
    text-align: left;
} */
  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }
    .team-lead-assignments {
      margin-top: 0;
      padding: 0;
    }
  }
</style>
