<script setup lang="ts">
  import type { BlockedUnitsResult } from '@/interfaces/installTracker';
  import { useRoute, useRouter } from 'vue-router';

  defineProps({
    items: {
      type: Object as () => BlockedUnitsResult[],
      required: true,
    },
  });

  const router = useRouter();
  const route = useRoute();

  const showBlockingIssue = (mode: string, issueId: number) => {
    router.push({
      name: 'labor-manager-blocking-issue',
      params: { id: route.params.id, issueId },
      query: { mode },
    });
  };
</script>

<template>
  <div class="sub-tasks-queue-container col-md-4">
    <span class="title"> Blocked Units </span>
    <div v-for="(item, index) in items" :key="index" class="tasks">
      <template v-if="item.blockingIssues.length > 0">
        <hr v-if="index != 0" />

        <div class="task-container">
          <UnitInfo :record="item.blockedUnitByScope" />

          <hr class="mx-4" />
          <div v-for="issue in item.blockingIssues" :key="issue.blockingIssueId" class="task-issue">
            <span class="d-block">
              <strong>Unit Id: </strong>{{ issue.unitId }}, <strong>Phase: </strong
              >{{ issue.unitPhaseName }}, <strong>Status: </strong>{{ issue.unitStatusName }},
              <strong>Progress: </strong>{{ issue.progress }}%
            </span>
            <div class="btn-group d-block">
              <button
                class="sub-task-action-button"
                @click="showBlockingIssue('preview', issue.blockingIssueId)"
              >
                View
              </button>
              <button
                class="sub-task-action-button"
                @click="showBlockingIssue('edit', issue.blockingIssueId)"
              >
                Edit
              </button>
              <button
                class="sub-task-action-button"
                @click="showBlockingIssue('resolve', issue.blockingIssueId)"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .sub-tasks-queue-container {
    background-color: #fff7e8;
    height: auto;
    padding: 22px;
    box-shadow: 0 2px 3px #0000001f;
  }

  .title {
    color: #ff6b00;
    font-weight: 600;
    font-size: 16px;
    line-height: 150%;
  }

  .tasks .task-container {
    width: auto;
    height: auto;
    margin: 10px 0;
    padding: 10px;
    background-color: #ffffff;
  }

  .tasks .task-container .task-issue {
    margin-left: 8px;
  }

  .tasks .task-container .task-label {
    font-weight: 600;
    font-size: 16px;
    line-height: 150%;
    color: #7a7a7a;
    margin-bottom: 16px;
  }

  :deep(.task-container span) {
    font-size: 14px;
    line-height: 150%;
  }

  :deep(.task-container hr) {
    margin: 1rem 0;
  }

  .sub-task-action-button {
    width: 120px;
    height: 32px;
    border-radius: 3px;
    background-color: #19a7af;
    margin-top: 8px;
    color: #ededed;
    border: none;
  }

  .sub-task-action-button:nth-child(2) {
    margin: 0 8px;
  }

  @media (max-width: 526px) {
    .sub-task-action-button {
      width: 100%;
      margin: 0;
      margin-top: 8px;
    }
    .sub-task-action-button:nth-child(2) {
      margin: 0;
      margin-top: 8px;
    }
  }
</style>
