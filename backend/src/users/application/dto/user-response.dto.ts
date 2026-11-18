/** Full record, only for administrators. */
export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  kycStatus: string;
  status: string;
  avatarUrl: string | null;
  documentId: string | null;
  documentType: string | null;
  organizationName: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  /** Message visible to the user: rejection reason or requested documentation. */
  kycRejectionReason: string | null;
  /** Internal reviewer notes; never sent to the account owner or third parties. */
  kycNotes: string | null;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  hasDocumentFront: boolean;
  hasDocumentBack: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What the account owner may see about themselves. */
export type OwnerUserResponseDto = Omit<UserResponseDto, 'kycNotes'>;

/** Admin listings: same data without the base64 document images. */
export type UserSummaryResponseDto = Omit<UserResponseDto, 'documentFrontUrl' | 'documentBackUrl'>;
