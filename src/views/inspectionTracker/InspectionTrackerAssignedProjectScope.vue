<script setup lang="ts">
  import type { BreadcrumbItem, KeyValuePair } from '@/interfaces/common';
  import { InspectionTrackerService } from '@/services/inspectionTracker';
  import { useAuthStore } from '@/stores/useAuthStore';
  import type { AssignedProjectScope } from 'api/interfaces/inspectionTracker';
  import { onMounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const isLoading = ref(false);
  const authStore = useAuthStore();
  const router = useRouter();
  const formattedAssignedProjectScope = ref<
    {
      project: KeyValuePair<number, string>;
      scopes: KeyValuePair<number, string>[];
      expanded: false;
    }[]
  >([]);
  const inspectionTrackerService = new InspectionTrackerService();
  const userId = ref<number>(0);

  breadcrumbs.value = [
    {
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      label: 'IHI Tools',
    },
    {
      label: 'Inspection Tracker',
    },
    {
      label: 'Assigned Project Scopes',
    },
  ] as BreadcrumbItem[];

  const goBack = () => {
    router.push({ name: 'dashboard' });
  };

  const goToInspectionQueue = (projectScopeId: number) => {
    console.log('Project Scope ID:', projectScopeId);
    router.push({
      name: 'inspection-tracker-inspection-queue',
      params: {
        projectScopeId,
      },
    });
  };

  const expandProject = (scopeAssignment: any) => {
    scopeAssignment.expanded = !scopeAssignment.expanded;
  };

  const groupByProject = (items: AssignedProjectScope[]) => {
    console.log('groupByProject', items);
    items.forEach((item) => {
      const existingProject = formattedAssignedProjectScope.value.find(
        (p) => p.project.key === item.projectId
      );

      if (!existingProject) {
        formattedAssignedProjectScope.value.push({
          project: { key: item.projectId, value: item.projectName },
          scopes: [{ key: item.projectByScopeId, value: item.scopeTypeName }],
          expanded: false,
        });
      } else {
        const existingScope = existingProject.scopes.find(
          (scope) => scope.key === item.scopeTypeId
        );
        if (!existingScope) {
          existingProject.scopes.push({ key: item.scopeTypeId, value: item.scopeTypeName });
        }
      }
    });
  };

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal ?? 0; // Use nullish coalescing (??) for clarity
    },
    { immediate: true }
  );

  onMounted(async () => {
    isLoading.value = true;

    await inspectionTrackerService.getProjectScope().then((data) => {
      groupByProject(data);
    });

    isLoading.value = false;
  });
</script>

<template>
  <TopNavWithOverlay :is-loading="isLoading" />

  <div class="body-content ft-project-viewer">
    <Breadcrumb :breadcrumbs="breadcrumbs" :close-page-text="'Close Tool'" @return="goBack" />

    <div class="col-md-3 project-container">
      <div
        v-for="activeProject in formattedAssignedProjectScope"
        :key="activeProject.project.key"
        class="project"
      >
        <button class="expand" @click="expandProject(activeProject)">
          <i
            :class="['bi', activeProject.expanded ? 'bi-caret-up-fill' : 'bi-caret-down-fill']"
          ></i>
          {{ activeProject.project.value }}
        </button>
        <div v-if="activeProject.expanded" class="scopes">
          <div
            v-for="(scope, index) in activeProject.scopes"
            :key="index"
            style="margin-left: 2rem"
          >
            <div class="actions mb-2">
              <button class="ml-2" @click="goToInspectionQueue(scope.key)">
                {{ scope.value }}
              </button>
            </div>
            <hr v-if="index != activeProject.scopes.length - 1" />
          </div>
        </div>
        <hr />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .project-container {
    margin: 3rem;
  }
  .project {
    margin: 0.5rem 0;
    padding: 0.7rem 0;
  }

  .project .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 0.7rem;
  }

  .scopes .expand {
    background: transparent;
    border: none;
    outline: none;
    font-size: 16px;
    font-weight: 500;
    display: block;
    margin-left: 1rem;
  }

  .scopes .actions div {
    border-bottom: 1px solid #19a7af;
    padding: 0.3rem;
    margin-left: 2.5rem;
  }

  .scopes .actions div:last-child {
    border-bottom: none;
  }

  .scopes .actions button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }

  hr {
    margin: 0 15px;
    color: #7a7a7a;
  }

  i.bi-caret-down-fill,
  i.bi-caret-up-fill {
    margin-right: 5px;
    color: #19a7af;
  }
</style>
