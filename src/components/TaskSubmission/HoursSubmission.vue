<script setup lang="ts">
  import type { TaskSubmissionViewerWorkHourSubmissionDto } from '@/shared/service-proxies/service-proxies';

  defineProps({
    submittedHours: {
      type: Object as () => TaskSubmissionViewerWorkHourSubmissionDto[],
      default: () => ({}),
    },
  });
</script>
<template>
  <div class="hours-submission col-md-4">
    <h6>Hours Submission Log (for this task)</h6>
    <!-- <button @click="redirectToHoursSubmittedEditor">
            Go to Hours Submission Editor
        </button> -->
    <table>
      <thead>
        <tr>
          <th>Worker</th>
          <th>Date</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Hours</th>
          <th>Submission Notes</th>
        </tr>
      </thead>
      <tbody v-if="submittedHours && submittedHours.length > 0">
        <tr v-for="list in submittedHours" :key="list.id || list.createdAt || list.workerName">
          <td>{{ list?.workerName }}</td>
          <td>{{ list?.createdAt }}</td>
          <td>{{ list?.submitTypeName }}</td>
          <td>{{ list?.quantity }}</td>
          <td>{{ list?.hours }}</td>
          <td>{{ list?.submissionNotes }}</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td class="text-danger">No work hour submissions yet</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
  table {
    width: 90vw;
    max-width: 700px;
    min-width: 390px;
  }
  table thead {
    background: #f9f9f9;
  }
  table thead tr {
    border-bottom: 1px solid #858585;
  }
  table thead tr th {
    border-right: 1px solid #858585;
    text-align: center;
    padding: 0.5 0.8rem;
    font-weight: bolder;
  }
  table thead tr th:last-child {
    border-right: none;
  }
  table tbody tr {
    border-bottom: 1px solid #858585;
  }
  table tbody tr:last-child {
    border-bottom: none;
  }
  table tbody tr td {
    border-right: 1px solid #858585;
    text-align: center;
    padding: 0.5rem;
  }
  table tbody tr td:last-child {
    border-right: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 275px;
  }
  .hours-submission {
    margin: 2rem 5rem;
    color: #212121;
  }
  .hours-submission h6 {
    color: #212121;
    font-weight: bold;
  }
  .hours-submission button {
    background: transparent;
    border: none;
    outline: none;
    color: #19a7af;
  }
  @media (max-width: 800px) {
    .hours-submission {
      margin: 2rem;
    }
  }
</style>
