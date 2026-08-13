<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import InformationModal from './modal/InformationModal.vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const maskingStore = useMaskingStore();

  const maskingDetails = ref({
    active: true,
    teamLeadId: 0,
    teamLeadName: '',
  });

  const showInfoModal = ref(false);

  onMounted(() => {
    const storedMaskingDetails = sessionStorage.getItem('maskingSession');
    if (storedMaskingDetails) {
      maskingDetails.value = JSON.parse(storedMaskingDetails);
    }
  });

  const stopMaskingHandler = async () => {
    const xconf = window.confirm('Are you sure you want to exit masking mode?');

    if (xconf) {
      await maskingStore.stopMasking();
      router.push({ name: 'labor-manager-task-summary' });
    }
  };

  const closeInfoModalHandler = () => {
    showInfoModal.value = false;
  };
</script>
<template>
  <div class="col-md-12">
    <div class="col-md-5 p-4">
      <h6 class="text-danger fw-bold align-items-center">
        You are impersonating Team Lead: {{ maskingDetails.teamLeadName }}
        <button class="show-info">
          <i class="bi bi-info-circle" @click="showInfoModal = true"></i>
        </button>
      </h6>
      <button class="stop-masking" @click="stopMaskingHandler">
        <i class="bi bi-x-circle"></i> Stop Masking
      </button>
    </div>
  </div>
  <InformationModal
    :show-modal="showInfoModal"
    modal-context="All data shown in this tool reflects their assignments and permissions. Any actions you take
        will be recorded as performed by you, on behalf of this Team Lead."
    @close-modal="closeInfoModalHandler"
  />
</template>
<style scoped>
  .stop-masking {
    background: none;
    font-weight: bolder;
    border: none;
    outline: none;
    color: #19a7af;
    cursor: pointer;
  }
  .show-info {
    background: none;
    border: none;
    outline: none;
    color: #212121;
    cursor: pointer;
    font-size: 125%;
  }
</style>
