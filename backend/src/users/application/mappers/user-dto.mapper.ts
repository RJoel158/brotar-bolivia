import { User } from '../../domain/entities/user.entity';
import type {
  OwnerUserResponseDto,
  UserResponseDto,
  UserSummaryResponseDto,
} from '../dto/user-response.dto';

export class UserDtoMapper {
  public static toResponseDto(user: User): UserResponseDto {
    const documentFrontUrl = user.getDocumentFrontUrl();
    const documentBackUrl = user.getDocumentBackUrl();
    return {
      id: user.getId(),
      email: user.getEmail(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      role: user.getRole().getValue(),
      kycStatus: user.getKycStatus().getValue(),
      status: user.getStatus(),
      avatarUrl: user.getAvatarUrl(),
      documentId: user.getDocumentId(),
      documentType: user.getDocumentType(),
      organizationName: user.getOrganizationName(),
      kycSubmittedAt: user.getKycSubmittedAt()?.toISOString() ?? null,
      kycReviewedAt: user.getKycReviewedAt()?.toISOString() ?? null,
      kycRejectionReason: user.getKycRejectionReason(),
      kycNotes: user.getKycNotes(),
      documentFrontUrl,
      documentBackUrl,
      hasDocumentFront: Boolean(documentFrontUrl),
      hasDocumentBack: Boolean(documentBackUrl),
      mustChangePassword: user.getMustChangePassword(),
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString(),
    };
  }

  public static toOwnerResponseDto(user: User): OwnerUserResponseDto {
    const { kycNotes: _internalNotes, ...ownerView } = UserDtoMapper.toResponseDto(user);
    return ownerView;
  }

  public static toSummaryDto(user: User): UserSummaryResponseDto {
    const {
      documentFrontUrl: _front,
      documentBackUrl: _back,
      ...summary
    } = UserDtoMapper.toResponseDto(user);
    return summary;
  }
}
