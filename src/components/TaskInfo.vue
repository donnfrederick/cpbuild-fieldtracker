<script setup lang="ts">
  import type { TaskInfo } from '@/interfaces/common';

  const props = defineProps({
    record: {
      type: Object as () => TaskInfo,
      required: true,
    },
    delimiter: {
      type: String,
      default: '-', // Default delimiter
    },
  });

  const dateParse = (date?: string | Date | null) => {
    if (!date) return '--';

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return date.toString();

    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${month}${props.delimiter}${day}${props.delimiter}${year}`;
  };

  const shouldDisplayBlock = (...values: any[]) => values.some((value) => value);
</script>

<template>
  <span
    v-if="
      shouldDisplayBlock(
        record.taskId,
        record.taskTypeName,
        record.taskStatusName,
        record.scheduledDate
      )
    "
    class="d-block"
  >
    <strong>Task ID: </strong>{{ record.taskId }}, <strong>Type: </strong>{{ record.taskTypeName }},
    <strong>Status: </strong>{{ record.taskStatusName }}, <strong>Scheduled: </strong
    >{{ dateParse(record.scheduledDate) }}
  </span>
  <span v-if="shouldDisplayBlock(record.submittedBy, record.submissionDate)" class="d-block">
    <strong>Submitted By: </strong>{{ record.submittedBy ?? '--' }},
    <strong>Submission Date: </strong>{{ dateParse(record.submissionDate) }}
  </span>
  <span v-if="shouldDisplayBlock(record.createdBy, record.dateCreated)" class="d-block">
    <strong>Date Created: </strong>{{ dateParse(record.dateCreated) }}, <strong>Created by: </strong
    >{{ record.createdBy ?? '--' }}
  </span>
  <span
    v-if="
      shouldDisplayBlock(
        record.parentTaskId,
        record.parentTaskStatusName,
        record.parentTaskTypeName
      )
    "
    class="d-block"
  >
    <strong>Parent Id: </strong>{{ record.parentTaskId }}, <strong>Type: </strong
    >{{ record.parentTaskTypeName ?? '--' }}, <strong>Status: </strong
    >{{ record.parentTaskStatusName ?? '--' }}
  </span>

  <span v-if="record.inspectedBy" class="d-block">
    <strong>Inspected By: </strong>{{ record.inspectedBy }},
  </span>
  <span v-if="record.inspectionDate" class="d-block">
    <strong>Inspection Date: </strong>{{ dateParse(record.inspectionDate) }},
  </span>
</template>
