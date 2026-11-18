import { Injectable, Logger } from '@nestjs/common';
import type { Notification } from '../domain/notification.base';
import type { NotificationChannelType } from '../domain/notification.types';
import type { NotificationChannelProvider } from './ports/notification-channel.provider';
import { EmailChannelProvider } from '../infrastructure/providers/email-channel.provider';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly providers = new Map<NotificationChannelType, NotificationChannelProvider>();

  constructor(emailProvider: EmailChannelProvider) {
    this.registerProvider(emailProvider);
  }

  public registerProvider(provider: NotificationChannelProvider): void {
    this.providers.set(provider.channel, provider);
    this.logger.log(`Canal de notificación registrado: [${provider.channel}]`);
  }

  public async assertAvailable(channel: NotificationChannelType): Promise<void> {
    const provider = this.providers.get(channel);
    if (!provider) throw new Error(`Canal no configurado: ${channel}`);
    await provider.assertAvailable?.();
  }

  public async dispatch(notification: Notification, options: { requireDelivery?: boolean } = {}): Promise<void> {
    const channels = notification.channels || ['EMAIL'];

    for (const channel of channels) {
      const provider = this.providers.get(channel);
      if (provider) {
        try {
          if (options.requireDelivery) await this.assertAvailable(channel);
          await provider.send(notification);
        } catch (error) {
          this.logger.error(`Error despachando notificación por el canal [${channel}]:`, error);
          if (options.requireDelivery) throw error;
        }
      } else {
        if (options.requireDelivery) throw new Error(`Canal no configurado: ${channel}`);
        this.logger.warn(`Canal de notificación no soportado o no configurado: [${channel}]`);
      }
    }
  }
}
