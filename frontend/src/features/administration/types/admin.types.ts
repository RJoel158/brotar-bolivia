import type { KycStatusType, UserDto } from '../../../shared/api/usersApi.ts';

export type KycQueueType = 'sponsor' | 'creator';

export interface KycRowItem {
  id: string;
  name: string;
  ciDocument: string | null;
  /** Formatted date, only when the user actually uploaded documents. */
  submissionDate: string | null;
  submittedAtIso: string | null;
  status: KycStatusType;
  role: 'sponsor' | 'creator';
  email: string;
  phone?: string | null;
  rawUser: UserDto;
}
