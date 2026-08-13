<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { TeamLeadServiceProxy, TeamLeadDTO } from '@/shared/service-proxies/service-proxies';
  import MaskingConfirmModal from '@/components/modal/MaskingConfirmModal.vue';
  import { useAuthStore } from '@/stores/useAuthStore';

  const authStore = useAuthStore();

  const teamLeadService = new TeamLeadServiceProxy();

  const activeTeamLeads = ref<TeamLeadDTO[]>([]);

  const currentTeamLead = ref<TeamLeadDTO | null>(null);

  const showConfirmModal = ref<boolean>(false);

  const teamLead = ref<TeamLeadDTO | null>(null);

  async function getActiveTeamLeads() {
    try {
      await teamLeadService.getActiveTeamLeads().then((result: any) => {
        if (result && result.length > 0) {
          const currentUserId = authStore.tdUserId;
          activeTeamLeads.value = result.filter((tl: TeamLeadDTO) => tl.userId !== currentUserId);
          currentTeamLead.value =
            result.find((tl: TeamLeadDTO) => tl.userId === currentUserId) || null;
        }
      });
    } catch (error) {
      console.error('Error fetching active team leads:', error);
    }
  }

  onMounted(async () => {
    await getActiveTeamLeads();
  });

  const showConfirmModalEvent = (isConfirmed: boolean) => {
    if (!isConfirmed) teamLead.value = null;
    showConfirmModal.value = false;
  };

  const teamLeadChoose = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;

    if (selectedValue !== null) {
      showConfirmModal.value = true;
    }
  };
</script>
<template>
  <div class="team-lead-masking">
    <h6 class="text-dark">
      <i class="bi bi-emoji-sunglasses"></i>
      Need to Mask as a Specific Team Lead?
    </h6>
    <div class="form-group my-3">
      <select v-model="teamLead" @change="teamLeadChoose">
        <option :value="null">Choose Team Lead</option>
        <option v-for="tl in activeTeamLeads" :key="tl.id" :value="tl">{{ tl.name }}</option>
      </select>
    </div>
  </div>
  <MaskingConfirmModal
    :team-lead="teamLead"
    :current-team-lead="currentTeamLead"
    :show-modal="showConfirmModal"
    @close-modal="showConfirmModalEvent"
  />
</template>
<style scoped>
  .team-lead-masking {
    padding: 2rem 0 1rem 2rem;
  }
  .team-lead-masking select {
    border: none;
    outline: none;
    color: #19a7af;
  }
</style>
