export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'creator' | 'sponsor';
  phone?: string;
  avatarUrl?: string;
  documentId?: string;
  documentType?: string;
  organizationName?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected' | 'requires_documentation';
}
