<script setup lang="ts">
  import { ref, onMounted, watch, onUnmounted } from 'vue';
  import type { Ref } from 'vue';
  import { Modal } from 'bootstrap';

  const emit = defineEmits(['update:modelValue', 'modal-hide']);

  const props = defineProps({
    title: {
      type: String,
      default: 'OK',
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  });

  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue && modalInstance) {
        modalInstance.show();
      } else if (!newValue && modalInstance) {
        modalInstance.hide();
      }
    }
  );

  const modalRef: Ref<Element | null> = ref(null);
  let modalInstance: Modal | null = null;

  onMounted(() => {
    if (modalRef.value) {
      modalInstance = new Modal(modalRef.value, {
        keyboard: false,
        backdrop: 'static',
      });
      modalRef.value.addEventListener('hidden.bs.modal', () => {
        emit('modal-hide');
        emit('update:modelValue', false);
      });
    }
  });

  onUnmounted(() => {
    if (modalInstance) {
      modalInstance.dispose();
      modalInstance = null;
    }
  });

  const closeModal = () => {
    if (modalInstance) {
      modalInstance.hide();
    }
  };
</script>

<template>
  <div ref="modalRef" class="modal fade" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ props.title }}</h5>
          <button type="button" class="btn btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer">
            <button type="button" class="btn btn-primary" @click="closeModal">Close</button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .modal-title {
    color: #19a7af;
    font-weight: 700;
  }

  .modal-body {
    color: #3c3c3c;
  }
</style>
