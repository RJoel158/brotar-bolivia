import { Notification } from './notification.base';
import type { NotificationRecipient, NotificationChannelType } from './notification.types';

export interface PasswordRecoveryPayload {
  userName: string;
  resetUrl: string;
}

export class PasswordRecoveryNotification extends Notification {
  public readonly payload: PasswordRecoveryPayload;

  constructor(
    recipient: NotificationRecipient,
    payload?: Partial<PasswordRecoveryPayload>,
    channels: NotificationChannelType[] = ['EMAIL'],
  ) {
    super(recipient, channels);
    this.payload = {
      userName: recipient.name || 'Usuario Brotar',
      resetUrl: payload?.resetUrl || '',
    };
  }

  public getSubject(): string {
    return 'Restablecimiento de contraseña - Brotar Bolivia';
  }

  public getTemplateKey(): string {
    return 'PASSWORD_RECOVERY';
  }

  public getPayload(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}
