import type { UserSummaryResponseDto } from './user-response.dto';

export interface UpdateKycDto {
  kycStatus: 'pending' | 'verified' | 'rejected' | 'requires_documentation';
  /** Internal reviewer notes. */
  notes?: string;
  /** Visible to the user: rejection reason or the documentation being requested. */
  rejectionReason?: string;
}

export interface FilterUsersDto {
  role?: string;
  kycStatus?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedUsersResponseDto {
  data: UserSummaryResponseDto[];
  meta: PaginationMeta;
}
