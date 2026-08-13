import { createVNode, render } from 'vue';
import ToastNotificationContainer from '@/components/misc/ToastNotificationContainer.vue';

export function mountToastNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'global-toast-notification-container';
  document.body.appendChild(container);

  const vnode = createVNode(ToastNotificationContainer);
  render(vnode, container);
}
