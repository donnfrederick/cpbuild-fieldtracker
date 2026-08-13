<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import { Modal } from 'bootstrap';
  import { TeamLeadDTO } from '@/shared/service-proxies/service-proxies';
  import { SessionStorageService } from '@/util/sessionStorageService';
  import type { MaskingSession } from '@/interfaces/common/maskingSession';

  const props = defineProps({
    teamLead: {
      type: Object as () => TeamLeadDTO | null,
      default: null,
    },
    currentTeamLead: {
      type: Object as () => TeamLeadDTO | null,
      default: null,
    },
    showModal: {
      type: Boolean,
      default: false,
    },
    modalContext: {
      type: String,
      default: '',
    },
  });

  const emit = defineEmits(['closeModal']);

  const modalRef = ref<HTMLElement | null>(null);
  let modalInstance: Modal | null = null;
  const sessionStorageService = new SessionStorageService();

  watch(
    () => props.showModal,
    (newVal) => {
      if (newVal) {
        modalInstance?.show();
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    if (modalRef.value) {
      modalInstance = new Modal(modalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
  });

  const closeModal = (isConfirmed = false) => {
    emit('closeModal', isConfirmed);
    modalInstance?.hide();
  };

  const confirmMasking = () => {
    sessionStorageService.setItem<MaskingSession>('maskingSession', {
      active: true,
      rootTeamLeadId: props.currentTeamLead?.id,
      teamLeadId: props.teamLead?.id,
      teamLeadName: props.teamLead?.name,
    });
    closeModal(true);
  };
</script>
<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal()"></button>
        </div>
        <div class="modal-body">
          <h5 class="text-success text-center mb-4">Mask as {{ props.teamLead?.name }}?</h5>
          <p>
            The Labor Manager will reload to reflect this Team Lead’s assignments and permissions.
            <br />
            Your actions will be recorded as having been performed by you on behalf of this Team
            Lead.
          </p>
          <div class="form-group d-flex justify-content-center py-4">
            <button class="action-button confirm" @click="confirmMasking">Confirm</button>
            <button class="action-button cancel" @click="closeModal()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
  .action-button {
    color: #fff;
    margin: 0 0.2rem;
    padding: 0.3rem 1.8rem;
    border: none;
    border-radius: 3px;
    position: relative;
    z-index: 1;
    touch-action: manipulation;
    pointer-events: auto;
    user-select: auto;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
  .action-button.confirm {
    background: #19a7af;
  }
  .action-button.confirm:disabled {
    background: #5ebabf;
  }
  .action-button.cancel {
    background: #dc3545;
  }
  .action-button.cancel:disabled {
    background: #f25079;
  }
</style>
