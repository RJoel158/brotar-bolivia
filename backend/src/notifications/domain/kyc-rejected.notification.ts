import { Notification } from './notification.base';
import type { NotificationRecipient, NotificationChannelType } from './notification.types';

export interface KycRejectedPayload {
  userName: string;
  rejectionReason: string;
  documentId?: string;
  supportUrl?: string;
}

export class KycRejectedNotification extends Notification {
  public readonly payload: KycRejectedPayload;

  constructor(
    recipient: NotificationRecipient,
    rejectionReason: string,
    payload?: Partial<KycRejectedPayload>,
    channels: NotificationChannelType[] = ['EMAIL'],
  ) {
    super(recipient, channels);
    this.payload = {
      userName: recipient.name,
      rejectionReason: rejectionReason || 'La documentación presentada no cumple con los criterios de validación.',
      documentId: payload?.documentId,
      supportUrl: payload?.supportUrl || 'http://localhost:5173',
    };
  }

  public getSubject(): string {
    return 'Actualización sobre tu solicitud de verificación en Brotar';
  }

  public getTemplateKey(): string {
    return 'KYC_REJECTED';
  }

  public getPayload(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}
