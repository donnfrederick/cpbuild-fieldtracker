<script setup lang="ts">
  // Imports
  import { ref, computed, watchEffect, onMounted } from 'vue';
  import { RouterLink, RouterView, useRouter } from 'vue-router';

  import { useAuthStore } from '../stores/useAuthStore';
  import { useToolStore } from '../stores/toolStore';
  import { useNetworkStore } from '../stores/useNetworkStore';
  import ZeroState from '../components/ZeroState.vue';
  import TopNavBar from '../components/TopNavBar.vue';
  import { storeToRefs } from 'pinia';

  // Variable Initializations
  const authStore = useAuthStore();
  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);
  const router = useRouter();
  const toolStore = useToolStore();
  const message = ref('');
  const collapsed = ref<boolean>(false);
  const selectedTool = ref<string | null>(null);
  const appEnv = import.meta.env.VITE_APP_ENV;

  // Role-based Access Checks
  const isAdmin = computed(() => authStore.hasAdminRole);
  const isControlsManager = computed(() => authStore.hasControlsManagerRole);
  const isInstallDirector = computed(() => authStore.hasInstallDirectorRole);
  const isTeamLead = computed(() => authStore.hasTeamLeadRole);
  const isInstallManager = computed(() => authStore.hasInstallManagerRole);
  const isPowerUser = computed(() => authStore.hasPowerUserRole);
  const isExecutive = computed(() => authStore.hasExecutiveRole);
  const isWorker = computed(() => authStore.hasWorkerRole);
  const isPowerUserOrAbove = computed(
    () => isPowerUser.value || isAdmin.value || isExecutive.value || isInstallDirector.value
  );

  // Sidebar UI Logic
  const collapseIcon = 'bi-arrow-right-circle-fill';
  const expandIcon = 'bi-arrow-left-circle-fill';
  const expandedTogglePosition = '92%';
  const collapsedTogglePosition = '81%';
  const toolIconSmall = '14px';
  const toolIconLarge = '20px';

  const showToastErr = ref(false);
  const toastErrMessage = ref('');

  const toggleIcon = computed(() => (collapsed.value ? collapseIcon : expandIcon));
  const togglePositionLeft = computed(() =>
    collapsed.value ? collapsedTogglePosition : expandedTogglePosition
  );
  const sidebarClass = computed(() => (collapsed.value ? 'collapsed' : 'expanded'));
  const toolIconSize = computed(() => (collapsed.value ? toolIconLarge : toolIconSmall));

  // Field Tracker Access Toggle
  const fieldTrackerAccess = ref<boolean>(false);
  watchEffect(() => {
    fieldTrackerAccess.value =
      authStore.hasAdminRole ||
      authStore.hasControlsManagerRole ||
      authStore.hasInstallManagerRole ||
      authStore.hasProjectManagerRole ||
      authStore.hasEstimatorRole;
  });

  // Offline Tool Restriction Logic
  const offlineAllowedTools = ['labor-manager', 'install-tracker'];

  const disabledToolMap = computed<Record<string, boolean>>(() => {
    if (!isOffline.value) return {};
    return Object.fromEntries(
      (toolStore.tools ?? []).map((tool) => [tool.key, !offlineAllowedTools.includes(tool.key)])
    );
  });

  const isDisabledInOffline = (toolKey: string): boolean => {
    return !!disabledToolMap.value[toolKey];
  };

  // Navigation Handlers
  const openFieldTrackerTool = () => {
    toolStore.openTool(); // Update the store to indicate that the tool is open
    router.push({ name: 'field-tracker' });
  };

  const openDataDictionaryReport = () => {
    router.push({ name: 'data-dictionary-report-view' });
  };

  const redirectToRoute = (routeName: string) => {
    router.push({ name: routeName });
  };

  // Lifecycle Hook
  onMounted(async () => {
    await authStore.fetchAndSetUserInfo();

    if (localStorage.getItem('redirectMsg') !== null) {
      showToastErr.value = true;
      toastErrMessage.value = localStorage.getItem('redirectMsg') || '';
      localStorage.removeItem('redirectMsg');
      setTimeout(() => {
        showToastErr.value = false;
      }, 5000);
    }
  });
</script>

<template>
  <TopNavBar />

  <div class="main-content">
    <!-- Side Menu -->

    <div v-if="showToastErr" class="toast-error-message">
      {{ toastErrMessage }}
      <button @click="showToastErr = false">Close</button>
    </div>

    <div class="sidebar" :class="collapsed ? 'collapsed' : 'expanded'">
      <button
        type="button"
        :style="{ left: togglePositionLeft }"
        :aria-label="
          collapsed
            ? 'side menu toggle button. Menu is currently collapsed'
            : 'side menu toggle button. Menu is currently expanded'
        "
        @click="collapsed = !collapsed"
      >
        <i :class="toggleIcon"></i>
      </button>

      <div :class="sidebarClass">
        <ul class="navbar-nav">
          <!-- Controls Tools Section -->
          <li v-if="fieldTrackerAccess || isInstallDirector" class="nav-item">
            <div class="section-header" area-label="Controls Tools section">Controls Tools</div>
            <ul class="nested-menu">
              <li v-if="fieldTrackerAccess || isInstallDirector" class="nav-item">
                <a
                  v-if="isControlsManager || isAdmin || isInstallDirector"
                  class="side-nav-link"
                  :class="{ disabled: isDisabledInOffline('install-teams') }"
                  @click="!isDisabledInOffline('install-teams') && redirectToRoute('install-teams')"
                >
                  <i class="bi bi-diagram-3" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Install Teams</span>
                </a>
                <a
                  class="side-nav-link"
                  area-label="Link to open the Field Tracker tool"
                  :title="collapsed ? 'Field Tracker tool' : ''"
                  :class="{ disabled: isDisabledInOffline('field-tracker') }"
                  @click="openFieldTrackerTool"
                >
                  <i class="bi bi-table" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Field Tracker</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- IHI Tools Section -->
          <li
            v-if="isInstallDirector || isAdmin || isTeamLead || isWorker || isInstallManager"
            class="nav-item"
          >
            <div class="section-header" area-label="Controls Tools section">IHI Tools</div>
            <ul class="nested-menu">
              <li class="nav-item">
                <a
                  v-if="isInstallDirector || isAdmin"
                  class="side-nav-link"
                  area-label="Link to open Workforce"
                  :class="{ disabled: isDisabledInOffline('workforce') }"
                  @click="redirectToRoute('workforce-team-leads')"
                >
                  <i class="bi bi-people" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Workforce</span>
                </a>
                <a
                  v-if="isInstallDirector || isAdmin"
                  class="side-nav-link"
                  area-label="Link to open Project Assigner"
                  :class="{ disabled: isDisabledInOffline('project-assigner') }"
                  @click="redirectToRoute('project-assigner-team-leads')"
                >
                  <i class="bi bi-person-add" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Project Assigner</span>
                </a>
                <a
                  v-if="isTeamLead || isAdmin || isInstallDirector"
                  class="side-nav-link"
                  area-label="Link to open Project Manager"
                  :class="{ disabled: isDisabledInOffline('labor-manager') }"
                  @click="redirectToRoute('labor-manager-task-summary')"
                >
                  <i class="bi bi-list-check" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Labor Manager</span>
                </a>
                <a
                  v-if="isWorker || isAdmin || isInstallDirector || isTeamLead"
                  class="side-nav-link"
                  area-label="Link to open Install Tracker"
                  :class="{ disabled: isDisabledInOffline('install-tracker') }"
                  @click="redirectToRoute('install-tracker-ready-tasks-summary')"
                >
                  <i class="bi bi-tools" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Install Tracker</span>
                </a>
                <a
                  v-if="isTeamLead || isAdmin || isInstallDirector"
                  class="side-nav-link"
                  area-label="Link to open Inspection Tracker"
                  :class="{ disabled: isDisabledInOffline('inspection-tracker') }"
                  @click="redirectToRoute('inspection-tracker-project-scopes')"
                >
                  <i class="bi bi-clipboard-check" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Inspection Tracker</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Reports Section -->
          <li class="nav-item">
            <div v-if="isPowerUserOrAbove" class="section-header" area-label="Reports section">
              Reports
            </div>
            <ul class="nested-menu">
              <li class="nav-item">
                <a
                  class="side-nav-link"
                  area-label="Link to open the Data Dictionary report"
                  :title="collapsed ? 'Data Dictionary report' : ''"
                  :class="{ disabled: isDisabledInOffline('data-dictionary') }"
                  @click="openDataDictionaryReport"
                >
                  <i class="bi bi-book" :style="{ fontSize: toolIconSize }" />
                  <span v-if="!collapsed" class="tool-link">Data Dictionary</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="tools-content" :class="collapsed ? 'collapsed' : 'expanded'">
      <OfflinePage v-if="isOffline" />
      <ZeroState v-else-if="!isOffline && !selectedTool" />

      <div v-if="selectedTool === 'pcUpdate'">
        <div>
          <RouterLink to="/" style="text-decoration: none">Home &nbsp;</RouterLink>
        </div>
        <RouterView />
        <div class="api-message">api message for testing {{ appEnv }}: {{ message }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  :deep(.installer-edit) {
    background-color: rgba(248, 250, 154, 0.2);
  }
  a {
    color: #3c3c3c;
  }

  a:hover {
    color: #19a7af;
  }

  a:active {
    color: #87e4e9;
  }

  .dropdown-item {
    color: #ededed;
  }

  .sidebar {
    background-color: #ededed;
    height: calc(100vh - 50px);
    width: 200px;
    position: fixed;
    z-index: 10;
    top: 50px;
  }

  .sidebar button {
    border: none;
    position: relative;
    background: transparent;
    color: #19a7af;
    font-size: 20px;
    z-index: 11;
    top: 8px;
  }

  .side-nav-link.disabled {
    color: #bcbcbc;
    pointer-events: none;
    cursor: default;
  }
  .side-nav-link.disabled i {
    color: #bcbcbc;
  }
  .side-nav-link.disabled span {
    color: #bcbcbc;
  }

  .tools-content button {
    margin: 5px;
    padding: 5px;
    border-radius: 5px;
    border: #19a7af 1px solid;
    background-color: white;
    color: #19a7af;
    font-size: 14px;
    cursor: pointer;
  }

  .api-message {
    color: #3c3c3c;
  }

  .expanded {
    width: 200px;
    transition: width 0.3s ease;
  }

  .collapsed {
    width: 90px;
    transition: width 0.3s ease;
  }

  .side-nav-link {
    display: flex;
    padding: 5px 15px;
    text-decoration: none;
    font-size: 14px;
    cursor: pointer;
  }

  .nav-item i {
    margin-right: 10px;
    color: #19a7af;
    cursor: pointer;
  }

  .side-nav-link.selected {
    background-color: #19a7af;
    color: #ededed;
  }
  .side-nav-link.selected i {
    color: #ededed;
  }

  .main-content {
    display: flex;
    flex-direction: row;
  }

  .tools-content {
    background: white;
    width: 500px;
  }

  .tools-content.expanded {
    height: calc(100vh - 50px);
    width: calc(100% - 200px);
    padding: 15px 30px;
    overflow: auto;
    position: fixed;
    top: 50px;
    left: 200px;
    transition: left 0.3s ease;
  }

  .tools-content.collapsed {
    height: calc(100vh - 50px);
    width: calc(100% - 50px);
    padding: 15px 30px;
    overflow: auto;
    position: fixed;
    top: 50px;
    left: 50px;
    transition: left 0.3s ease;
  }

  .section-header {
    color: #3c3c3c;
    font-weight: bold;
    padding: 10px;
  }

  .nested-menu {
    list-style-type: none;
    padding-left: 20px;
  }

  @media (max-width: 584px) {
    .navbar.navbar-dark {
      height: 90px;
    }
    .sidebar {
      top: 90px;
    }

    .sidebar button {
      top: -2px;
    }

    .tools-content.expanded {
      top: 90px;
    }
    .tools-content.collapsed {
      top: 90px;
    }
  }
</style>
