<script setup lang="ts">
  import type { CurrentUnitDto, TaskDetailDto } from '@/shared/service-proxies/service-proxies';

  defineProps({
    currentUnit: {
      type: Object as () => CurrentUnitDto,
      required: true,
    },
    taskDetails: {
      type: Object as () => TaskDetailDto,
      required: true,
    },
    hideAssignedWorker: {
      type: Boolean,
      default: false,
    },
    taskId: {
      type: Number,
      required: true,
    },
    unitByScopeId: {
      type: Number,
      required: true,
    },
  });
</script>
<template>
  <div class="col-md-4">
    <div class="units">
      <div class="unit">
        <div class="unit-data">
          <p>
            <span>Building: </span>{{ currentUnit?.building }}, <span>Level: </span
            >{{ currentUnit?.level }}, <span>Unit: </span>{{ currentUnit?.unit }},
            <span>Area: </span>{{ currentUnit?.area }}, <span>Unit Type: </span
            >{{ currentUnit?.unitType }}
          </p>
          <p class="mb-3">
            <span>Unit ID: </span>{{ unitByScopeId }}, <span>Unit Phase: </span
            >{{ currentUnit?.currentPhaseName }}, <span>Phase ID: </span
            >{{ currentUnit?.currentPhaseId }} <span>Status: </span
            >{{ currentUnit?.unitStatusName }}, <span>Progress: </span
            >{{ currentUnit?.unitProgressPercent }}%
          </p>
          <div v-if="taskDetails?.secondaryWorkerName != null" class="mb-3">
            <span class="text-success">
              <strong>Secondary Worker: </strong>
              {{ taskDetails?.secondaryWorkerName }}
            </span>
          </div>
          <p>
            <span>Task ID: </span>{{ taskId }}, <span>Task Phase: </span
            >{{ taskDetails?.phaseName }}, <span>Phase ID: </span>{{ taskDetails?.phaseId }}
            <span>Type: </span>{{ taskDetails?.taskTypeName }}, <span>Status: </span
            >{{ taskDetails?.statusName }}
          </p>
          <template v-if="!hideAssignedWorker">
            <p v-if="taskDetails?.assignedWorkerName !== null">
              <span>Assigned Worker: </span>{{ taskDetails?.assignedWorkerName }}
            </p>
            <p v-else>
              <span>Assigned Worker: </span><span class="text-danger d-inline">Unassigned</span>
            </p>
          </template>
          <p
            v-if="
              typeof taskDetails?.submittedAt === 'string' && taskDetails?.submittedAt !== '---'
            "
            class="mb-3"
          >
            <span>Date Submitted: </span>{{ taskDetails?.submittedAt }}, <span>Submitted By: </span
            >{{ taskDetails?.submittedBy }}
          </p>
          <p v-else-if="taskDetails?.submittedAt instanceof Date" class="mb-3">
            <span>Date Submitted: </span>{{ taskDetails?.submittedAt.toLocaleString() }},
            <span>Submitted By: </span>{{ taskDetails?.submittedBy }}
          </p>
          <template v-else>
            <p class="mb-3">
              <span>Date Submitted: </span><span class="text-danger d-inline">Not Submitted</span>
            </p>
          </template>
          <p v-if="taskDetails?.parentTaskId !== null">
            <span>Parent Task ID: </span>{{ taskDetails?.parentTaskId }}, <span>Type: </span
            >{{ taskDetails?.parentTaskTypeName }}, <span>Status: </span
            >{{ taskDetails?.parentStatusName }}
          </p>
        </div>
      </div>
      <hr />
    </div>
  </div>
</template>
<style scoped>
  .unit {
    padding: 2rem 5rem 0 5rem;
    width: 90vw;
    min-width: 390px;
  }
  .units .unit-data p {
    padding: 0;
    margin: 0;
    color: #000;
  }
  .units .unit-data p span {
    font-weight: bold;
  }
  .units hr:last-child {
    display: none;
  }
  @media (max-width: 800px) {
    .unit {
      padding: 1rem 2rem 0 2rem;
    }
  }
</style>
