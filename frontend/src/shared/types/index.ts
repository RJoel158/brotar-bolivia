export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'creator' | 'sponsor';

export type KycStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'requires_documentation';

export interface UserProfile extends BaseEntity {
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  status: string;
  avatarUrl: string | null;
  documentId?: string | null;
  documentType?: string | null;
  organizationName?: string | null;
  kycSubmittedAt?: string | null;
  kycReviewedAt?: string | null;
  /** Visible to the user: rejection reason or requested documentation. */
  kycRejectionReason?: string | null;
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  hasDocumentFront?: boolean;
  hasDocumentBack?: boolean;
  /** true tras recuperación o alta con clave temporal; hay que cambiarla antes de usar la app. */
  mustChangePassword?: boolean;
}

export interface EcoProjectSummary extends BaseEntity {
  title: string;
  slug: string;
  description: string;
  category:
    | 'reforestacion'
    | 'energia-renovable'
    | 'conservacion'
    | 'reciclaje'
    | 'agricultura-sostenible';
  targetAmount: number;
  currentAmount: number;
  backersCount: number;
  deadline: string;
  coverImage: string;
  location: string;
  creatorName: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
