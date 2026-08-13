<script setup lang="ts">
  defineProps({
    isLoading: {
      type: Boolean,
      default: false,
    },
  });
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
</template>
