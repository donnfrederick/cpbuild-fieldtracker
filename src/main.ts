import './assets/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import Breadcrumb from './components/Breadcrumb.vue';
import TaskInfo from './components/TaskInfo.vue';
import UnitInfo from './components/UnitInfo.vue';
import BlockingIssue from './components/BlockingIssue.vue';
import TopNavBar from './components/TopNavBar.vue';
import TopNavWithOverlay from './components/TopNavWithOverlay.vue';
import SubTaskQueue from './components/SubTaskQueue.vue';
import ProjectWorkSubmissionCreateModal from './components/modal/ProjectWorkSubmissionCreateModal.vue';
import MainTasksQueue from './components/MainTasksQueue.vue';
import BlockedUnitsQueue from './components/BlockedUnitsQueue.vue';
import ReadyTasksSummaryButton from './components/ReadyTasksSummaryButton.vue';

// Toast Notification System
import { mountToastNotificationContainer } from '@/plugins/toastNotification';

// Import the network store and start monitoring
import { useNetworkStore } from './stores/useNetworkStore';
import { useMaskingStore } from './stores/useMaskingStore';
import OfflinePage from './views/OfflinePage.vue';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Start listening for online/offline changes globally
const networkStore = useNetworkStore();
networkStore.startMonitoring();

const maskingStore = useMaskingStore();
maskingStore.startMaskMonitoring();

app.mount('#app');

app.component('TopNavWithOverlay', TopNavWithOverlay);
app.component('TopNavBar', TopNavBar);
app.component('BlockingIssue', BlockingIssue);
app.component('Breadcrumb', Breadcrumb);
app.component('TaskInfo', TaskInfo);
app.component('UnitInfo', UnitInfo);
app.component('MainTasksQueue', MainTasksQueue);
app.component('SubTaskQueue', SubTaskQueue);
app.component('ProjectWorkSubmissionCreateModal', ProjectWorkSubmissionCreateModal);
app.component('BlockedUnitsQueue', BlockedUnitsQueue);
app.component('ReadyTasksSummaryButton', ReadyTasksSummaryButton);
app.component('OfflinePage', OfflinePage);

mountToastNotificationContainer();

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}
