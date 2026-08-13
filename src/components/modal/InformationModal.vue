<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import { Modal } from 'bootstrap';

  const props = defineProps({
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

  const closeModal = () => {
    emit('closeModal');
    modalInstance?.hide();
  };
</script>
<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <p class="text-dark"><i class="bi bi-info-circle-fill"></i> {{ props.modalContext }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
