import { Notification } from './notification.base';
import type { NotificationRecipient, NotificationChannelType } from './notification.types';

export interface KycRequiresDocsPayload {
  userName: string;
  notes: string;
  documentId?: string;
  resubmitUrl?: string;
}

export class KycRequiresDocsNotification extends Notification {
  public readonly payload: KycRequiresDocsPayload;

  constructor(
    recipient: NotificationRecipient,
    notes: string,
    payload?: Partial<KycRequiresDocsPayload>,
    channels: NotificationChannelType[] = ['EMAIL'],
  ) {
    super(recipient, channels);
    this.payload = {
      userName: recipient.name,
      notes: notes || 'Por favor sube una fotografía legible y actualizada de tu documento de identidad.',
      documentId: payload?.documentId,
      resubmitUrl: payload?.resubmitUrl || 'http://localhost:5173',
    };
  }

  public getSubject(): string {
    return 'Se requiere documentación adicional para tu verificación en Brotar';
  }

  public getTemplateKey(): string {
    return 'KYC_REQUIRES_DOCS';
  }

  public getPayload(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}
