import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';
import type { UserResponseDto } from '../../application/dto/user-response.dto';
import { UserDtoMapper } from '../../application/mappers/user-dto.mapper';

export type PrismaUserRole = 'admin' | 'creator' | 'sponsor';
export type PrismaKycStatus = 'pending' | 'verified' | 'rejected' | 'requires_documentation';

export interface PrismaUserModel {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: string;
  kyc_status: string;
  status: string;
  avatar_url: string | null;
  document_id?: string | null;
  document_type?: string | null;
  organization_name?: string | null;
  kyc_submitted_at?: Date | null;
  kyc_reviewed_at?: Date | null;
  kyc_rejection_reason?: string | null;
  kyc_notes?: string | null;
  document_front_url?: string | null;
  document_back_url?: string | null;
  must_change_password?: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PrismaUserMapper {
  public static toDomain(raw: PrismaUserModel): User {
    const roleVo = UserRole.fromString(raw.role);
    const kycVo = KycStatus.fromString(raw.kyc_status);

    return User.reconstitute({
      id: raw.id,
      email: raw.email,
      passwordHash: raw.password_hash,
      fullName: raw.full_name,
      phone: raw.phone,
      role: roleVo,
      kycStatus: kycVo,
      status: raw.status,
      avatarUrl: raw.avatar_url,
      documentId: raw.document_id,
      documentType: raw.document_type,
      organizationName: raw.organization_name,
      kycSubmittedAt: raw.kyc_submitted_at,
      kycReviewedAt: raw.kyc_reviewed_at,
      kycRejectionReason: raw.kyc_rejection_reason,
      kycNotes: raw.kyc_notes,
      documentFrontUrl: raw.document_front_url,
      documentBackUrl: raw.document_back_url,
      mustChangePassword: Boolean(raw.must_change_password),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  public static toPersistence(user: User): {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    phone: string | null;
    role: PrismaUserRole;
    kyc_status: PrismaKycStatus;
    status: string;
    avatar_url: string | null;
    document_id: string | null;
    document_type: string | null;
    organization_name: string | null;
    kyc_submitted_at: Date | null;
    kyc_reviewed_at: Date | null;
    kyc_rejection_reason: string | null;
    kyc_notes: string | null;
    document_front_url: string | null;
    document_back_url: string | null;
    created_at: Date;
    updated_at: Date;
  } {
    return {
      id: user.getId(),
      email: user.getEmail(),
      password_hash: user.getPasswordHash(),
      full_name: user.getFullName(),
      phone: user.getPhone(),
      role: user.getRole().getValue() as PrismaUserRole,
      kyc_status: user.getKycStatus().getValue() as PrismaKycStatus,
      status: user.getStatus(),
      avatar_url: user.getAvatarUrl(),
      document_id: user.getDocumentId(),
      document_type: user.getDocumentType(),
      organization_name: user.getOrganizationName(),
      kyc_submitted_at: user.getKycSubmittedAt(),
      kyc_reviewed_at: user.getKycReviewedAt(),
      kyc_rejection_reason: user.getKycRejectionReason(),
      kyc_notes: user.getKycNotes(),
      document_front_url: user.getDocumentFrontUrl(),
      document_back_url: user.getDocumentBackUrl(),
      created_at: user.getCreatedAt(),
      updated_at: user.getUpdatedAt(),
    };
  }

  public static toResponseDto(user: User): UserResponseDto {
    return UserDtoMapper.toResponseDto(user);
  }
}
