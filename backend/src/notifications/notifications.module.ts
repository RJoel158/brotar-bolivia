import { Module } from '@nestjs/common';
import { EmailTemplateRenderer } from './infrastructure/templates/email-template.renderer';
import { EmailChannelProvider } from './infrastructure/providers/email-channel.provider';
import { NotificationService } from './application/notification.service';

@Module({
  providers: [
    EmailTemplateRenderer,
    EmailChannelProvider,
    NotificationService,
  ],
  exports: [
    NotificationService,
    EmailTemplateRenderer,
  ],
})
export class NotificationsModule {}
