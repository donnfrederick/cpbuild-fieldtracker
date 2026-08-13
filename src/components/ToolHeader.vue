<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import ConfirmModal from './ConfirmModal.vue';
  import { useToolStore } from '@/stores/toolStore';

  const router = useRouter();
  const showModal = ref(false);
  const toolStore = useToolStore();

  watch(
    () => toolStore.showConfirmModal,
    (newValue) => {
      showModal.value = newValue;
    }
  );

  const props = defineProps<{
    toolName: string;
  }>();

  const toggleModal = () => {
    const newValue = !showModal.value;
    showModal.value = newValue;
    toolStore.setShowConfirmModal(newValue);
  };

  const handleConfirm = async () => {
    if (showModal.value) {
      showModal.value = false; // Close the modal first
      await new Promise((r) => setTimeout(r, 300)); // Add a delay of 300ms
      toolStore.closeTool(); // Close the tool
      router.push({ name: 'dashboard' }); // Navigate to dashboard
    }
  };

  const handleCancel = () => {
    showModal.value = false;
    toolStore.resetConfirmmodal();
  };

  const handleModalHide = () => {
    showModal.value = false;
    toolStore.resetConfirmmodal();
  };
</script>

<template>
  <div class="header-body d-flex justify-content-between">
    <span class="tool-name">{{ props.toolName }}</span>
    <button class="btn-close-tool" @click="toggleModal">
      Close Tool<i class="bi-x-circle"></i>
    </button>
  </div>
  <hr />
  <ConfirmModal
    v-model="showModal"
    :title="'Close Tool Without Saving?'"
    @modal-hide="handleModalHide"
  >
    Any unsaved changes will be lost. Are you sure you want to close the tool?
    <template #footer>
      <button class="btn" @click="handleCancel">Cancel</button>
      <button class="btn btn-danger" @click="handleConfirm">Confirm</button>
    </template>
  </ConfirmModal>
</template>

<style scoped>
  .header-body {
    color: #19a7af;
    width: 100%;
    padding: 10px 30px;
    min-width: 350px;
  }

  .tool-name {
    font-size: 21px;
    font-weight: 700;
  }

  .bi-x-circle {
    margin-left: 5px;
    color: #7a7a7a;
  }

  .btn-close-tool {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding-left: 5px;
  }

  hr {
    margin: 0 30px;
    color: #7a7a7a;
  }
</style>
