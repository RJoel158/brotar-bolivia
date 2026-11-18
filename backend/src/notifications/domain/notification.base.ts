import type { NotificationChannelType, NotificationRecipient, NotificationMetadata } from './notification.types';

export abstract class Notification {
  public readonly recipient: NotificationRecipient;
  public readonly channels: NotificationChannelType[];
  public readonly metadata: NotificationMetadata;

  constructor(
    recipient: NotificationRecipient,
    channels: NotificationChannelType[] = ['EMAIL'],
    metadata?: Partial<NotificationMetadata>,
  ) {
    this.recipient = recipient;
    this.channels = channels;
    this.metadata = {
      createdAt: new Date(),
      ...metadata,
    };
  }

  public abstract getSubject(): string;
  public abstract getTemplateKey(): string;
  public abstract getPayload(): Record<string, unknown>;
}
