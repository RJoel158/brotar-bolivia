import { Notification } from './notification.base';
import type { NotificationRecipient, NotificationChannelType } from './notification.types';

export interface KycApprovedPayload {
  userName: string;
  documentId?: string;
  verifiedAt: Date;
  dashboardUrl?: string;
}

export class KycApprovedNotification extends Notification {
  public readonly payload: KycApprovedPayload;

  constructor(
    recipient: NotificationRecipient,
    payload?: Partial<KycApprovedPayload>,
    channels: NotificationChannelType[] = ['EMAIL'],
  ) {
    super(recipient, channels);
    this.payload = {
      userName: recipient.name,
      documentId: payload?.documentId,
      verifiedAt: payload?.verifiedAt || new Date(),
      dashboardUrl: payload?.dashboardUrl || 'http://localhost:5173',
    };
  }

  public getSubject(): string {
    return '¡Tu identidad ha sido verificada con éxito en Brotar!';
  }

  public getTemplateKey(): string {
    return 'KYC_APPROVED';
  }

  public getPayload(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}
