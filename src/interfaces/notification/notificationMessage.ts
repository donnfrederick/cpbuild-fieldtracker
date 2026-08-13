import { NotificationEventTypeEnum } from '@/enum/notification/notificationEventTypeEnum';
import { NotificationType } from '@/enum/notification/notificationType';

export interface NotificationMessage {
  userId: number;
  message: string;
  payload: object;
  eventType: NotificationEventTypeEnum;
  type: NotificationType;
}
