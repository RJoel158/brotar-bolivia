import { apiClient } from './apiClient.ts';

export type KycStatusType = 'pending' | 'verified' | 'rejected' | 'requires_documentation';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  kycStatus: KycStatusType;
  status: string;
  avatarUrl: string | null;
  documentId?: string | null;
  documentType?: string | null;
  organizationName?: string | null;
  kycSubmittedAt?: string | null;
  kycReviewedAt?: string | null;
  /** Visible to the user: rejection reason or requested documentation. */
  kycRejectionReason?: string | null;
  /** Internal reviewer notes; only present in admin responses. */
  kycNotes?: string | null;
  /** Only present in single-user responses; listings use the `has*` flags. */
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  hasDocumentFront?: boolean;
  hasDocumentBack?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedUsersResponse {
  data: UserDto[];
  meta: PaginationMeta;
}

export interface UserFilterParams {
  role?: string;
  kycStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'creator' | 'sponsor';
  phone?: string;
  avatarUrl?: string;
  documentId?: string;
  documentType?: string;
  organizationName?: string;
  kycStatus?: KycStatusType;
}

export interface SubmitKycPayload {
  documentId: string;
  documentType: string;
  organizationName?: string;
  phone?: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
}

export const usersApi = {
  async getUsers(params?: UserFilterParams): Promise<PaginatedUsersResponse> {
    const { data } = await apiClient.get<PaginatedUsersResponse>('/users', {
      params,
    });
    return data;
  },

  async getUserById(id: string): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>(`/users/${id}`);
    return data;
  },

  async createUser(payload: CreateUserPayload): Promise<UserDto> {
    const { data } = await apiClient.post<UserDto>('/users', payload);
    return data;
  },

  async submitKyc(payload: SubmitKycPayload): Promise<UserDto> {
    const { data } = await apiClient.post<UserDto>('/users/me/kyc', payload);
    return data;
  },

  async updateKycStatus(id: string, kycStatus: KycStatusType, notes?: string, reason?: string): Promise<UserDto> {
    const { data } = await apiClient.patch<UserDto>(`/users/${id}/kyc-status`, {
      kycStatus,
      notes,
      rejectionReason: reason,
    });
    return data;
  },

  async updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<UserDto> {
    const { data } = await apiClient.patch<UserDto>(`/users/${id}/status`, { status });
    return data;
  },

  async deactivateUser(id: string): Promise<UserDto> {
    const { data } = await apiClient.delete<UserDto>(`/users/${id}`);
    return data;
  },

  async getProfile(): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>('/users/me');
    return data;
  },

  async updateProfile(payload: {
    fullName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<UserDto> {
    const { data } = await apiClient.patch<UserDto>('/users/me', payload);
    return data;
  },
};
