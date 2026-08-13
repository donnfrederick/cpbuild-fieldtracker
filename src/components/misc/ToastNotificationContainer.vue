<script setup lang="ts">
  import { NotificationType } from '@/enum/notification/notificationType';
  import { useNotificationStore } from '@/stores/useNotificationStore';
  import { ref } from 'vue';

  const notificationStore = useNotificationStore();
  const expanded = ref(false);

  function removeNotification(id: number) {
    notificationStore.removeNotification(id);
  }

  function toggleExpand() {
    expanded.value = !expanded.value;
  }

  function getBackground(type: NotificationType): string {
    switch (type) {
      case NotificationType.Message:
        return '#19a7af';
      case NotificationType.Error:
        return '#dc3545';
      case NotificationType.Success:
        return '#58be8f';
      default:
        return '#333';
    }
  }
</script>
<template>
  <div class="notification-toast-container">
    <!-- Expanded view -->
    <template v-if="expanded">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="notification-toast"
        :style="{ backgroundColor: getBackground(notification.type) }"
        @click="removeNotification(notification.id)"
      >
        <span>{{ notification.message }}</span>
        <button class="close-btn" @click.stop="removeNotification(notification.id)">✖</button>
      </div>
      <div class="notification-toast summary" @click="toggleExpand">Collapse ▲</div>
    </template>

    <!-- Collapsed view -->
    <template v-else>
      <div
        v-for="notification in notificationStore.notifications.slice(0, 2)"
        :key="notification.id"
        class="notification-toast"
        :style="{ backgroundColor: getBackground(notification.type) }"
        @click="removeNotification(notification.id)"
      >
        <span>{{ notification.message }}</span>
        <button class="close-btn" @click.stop="removeNotification(notification.id)">✖</button>
      </div>

      <div
        v-if="notificationStore.notifications.length > 2"
        class="notification-toast summary"
        @click="toggleExpand"
      >
        +{{ notificationStore.notifications.length - 2 }} more ▼
      </div>
    </template>
  </div>
</template>

<style scoped>
  .notification-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 9999;
  }

  .notification-toast {
    background: #19a7af;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }

  .notification-toast.summary {
    background: #555;
    font-weight: bold;
    justify-content: center;
    cursor: pointer;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    margin-left: 0.5rem;
    font-size: 0.9rem;
  }

  .notification-toast span {
    color: white;
  }

  .notification-toast.summary {
    background: #555 !important;
    /* keep summary distinct */
  }
</style>
