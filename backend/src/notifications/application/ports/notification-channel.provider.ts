import type { Notification } from '../../domain/notification.base';
import type { NotificationChannelType } from '../../domain/notification.types';

export const NOTIFICATION_CHANNEL_PROVIDERS = 'NOTIFICATION_CHANNEL_PROVIDERS';

export interface NotificationChannelProvider {
  readonly channel: NotificationChannelType;
  assertAvailable?(): void | Promise<void>;
  send(notification: Notification): Promise<void>;
}
