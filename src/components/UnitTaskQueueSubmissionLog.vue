<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import type { WorkHourSubmissions } from '@/interfaces/workforce';
  import type { ProjectByScopeDetails } from '@/interfaces/installTracker';

  const props = defineProps({
    workHourSubmissions: {
      type: Object as () => WorkHourSubmissions[],
      required: true,
    },
    projectByScopeDetails: {
      type: Object as () => ProjectByScopeDetails,
      required: true,
    },
    workerId: {
      type: Number,
      required: true,
    },
    projectByScopeId: {
      type: Number,
      required: true,
    },
  });

  const emit = defineEmits(['openEditModal', 'openViewModal', 'deleteLog']);

  const submissionLogExpanded = ref<boolean>(false);

  const dateNow = ref<string>('');

  onMounted(async () => {
    const dateToday = new Date();
    dateNow.value = `${(dateToday.getMonth() + 1).toString().padStart(2, '0')}-${dateToday
      .getDate()
      .toString()
      .padStart(2, '0')}-${dateToday.getFullYear()}`;
  });

  const toggleSubmissionLog = () => {
    submissionLogExpanded.value = !submissionLogExpanded.value;
  };

  const openEditModal = (log: WorkHourSubmissions) => {
    emit('openEditModal', log);
  };
  const openViewModal = (log: WorkHourSubmissions) => {
    emit('openViewModal', log);
  };
  const deleteLog = (id: number) => {
    emit('deleteLog', id);
  };
</script>
<template>
  <div class="submission-log">
    <button class="extract" @click="toggleSubmissionLog">
      <i :class="['bi', submissionLogExpanded ? 'bi-caret-up-fill' : 'bi-caret-down-fill']"></i>
      Work Hour Submissions for {{ props.projectByScopeDetails.projectName }} ({{
        props.projectByScopeDetails.scopeTypeName
      }})
    </button>
    <div v-if="submissionLogExpanded" class="logs">
      <div v-for="log in props.workHourSubmissions" :key="log.id" class="d-flex">
        <h6>
          {{ log.submissionDate }}
          <span v-if="log.submissionDate == dateNow"> (today) </span>
          -
          <strong>
            {{ log.submitTypeName }}
          </strong>
          -
          <strong>
            {{ log.taskTypeName }}
          </strong>
          -
          <strong>
            {{ log.payTypeName }}
          </strong>
          -
          {{ log.hours }}
        </h6>
        <button
          v-if="log.submissionDate == dateNow && log.taskStatusId <= 3"
          data-test="edit-button"
          @click="openEditModal(log)"
        >
          Edit
        </button>
        <button @click="openViewModal(log)">View</button>
        <button
          v-if="log.submissionDate == dateNow && log.taskStatusId <= 3"
          @click="deleteLog(log.id)"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
<style>
  .submission-log {
    margin: 3rem;
  }
  .submission-log .extract {
    font-size: 18px;
    font-weight: bold;
    background: transparent;
    border: none;
    outline: none;
  }
  .submission-log .logs {
    padding: 0.5rem 1rem;
    color: #000;
  }
  .submission-log .logs button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }
</style>
