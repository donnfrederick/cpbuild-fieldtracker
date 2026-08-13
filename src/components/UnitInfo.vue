<script setup lang="ts">
  import type { UnitInfo } from '@/interfaces/common';

  defineProps({
    record: {
      type: Object as () => UnitInfo,
      required: true,
    },
  });
</script>

<template>
  <span class="d-block">
    <strong>Building: </strong>{{ record.building }}, <strong>Level: </strong>{{ record.level }},
    <strong>Unit: </strong>{{ record.unit }}, <strong>Area: </strong>{{ record.area }},
    <strong>Unit Type: </strong>{{ record.unitType }}
  </span>
  <span class="d-block">
    <strong>Unit ID: </strong>{{ record.unitByScopeId }}, <strong>Phase: </strong
    >{{ record.unitPhaseName }}, <strong>Status: </strong>{{ record.unitStatusName }},
    <strong>Progress: </strong>{{ record.progress }}%
  </span>
</template>
