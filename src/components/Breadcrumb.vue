<script setup lang="ts">
  import type { BreadcrumbItem } from '@/interfaces/common';
  const props = defineProps({
    breadcrumbs: {
      type: Array as () => BreadcrumbItem[],
      required: true,
    },
    closePageText: {
      type: String,
      default: 'Go Back',
    },
  });

  const emit = defineEmits(['return']);

  const closePage = () => {
    emit('return');
  };
</script>

<template>
  <div class="header-body container-fluid">
    <div class="row">
      <div class="col-lg-8 col-md-8 col-sm-12 col-12">
        <span v-for="(item, index) in props.breadcrumbs" :key="index" class="breadcrumb-nav">
          <span v-if="index != props.breadcrumbs.length && index != 0"> / </span>
          <router-link v-if="!!item.path" :to="item.path" class="breadcrumb-link">
            {{ item.label }}
          </router-link>
          <span v-else>{{ item.label }}</span>
        </span>
      </div>
      <div
        class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
      >
        <button class="btn-close-ft-project link-type-button" @click="closePage">
          {{ props.closePageText }}
          <i class="bi-x-circle" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .breadcrumb-nav {
    font-size: 16px;
    font-weight: 200;
  }
  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
  }
  :deep(span) {
    color: #3c3c3c;
  }
</style>
