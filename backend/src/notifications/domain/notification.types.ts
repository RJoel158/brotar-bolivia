export type NotificationChannelType = 'EMAIL' | 'SMS' | 'PUSH' | 'SOCKET';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface NotificationMetadata {
  createdAt: Date;
  correlationId?: string;
  source?: string;
}
