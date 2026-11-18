import { UserDtoMapper } from './user-dto.mapper';
import { User } from '../../domain/entities/user.entity';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

function buildReviewedUser(): User {
  const user = User.create({
    email: 'patrocinador@brotar.bo',
    passwordHash: 'hash',
    fullName: 'Patrocinador Brotar',
  });
  user.submitKyc({
    documentId: '7654321',
    documentType: 'CI',
    documentFrontUrl: 'data:image/jpeg;base64,/9j/4AAQ',
    documentBackUrl: 'data:image/jpeg;base64,/9j/4BBQ',
  });
  user.updateKycStatus(KycStatus.REJECTED, 'Revisar con supervisor', 'Documento vencido.');
  return user;
}

describe('UserDtoMapper', () => {
  it('owner view omits internal notes but keeps the user-visible message', () => {
    const dto = UserDtoMapper.toOwnerResponseDto(buildReviewedUser());

    expect(dto).not.toHaveProperty('kycNotes');
    expect(dto.kycRejectionReason).toBe('Documento vencido.');
    expect(dto.documentFrontUrl).toContain('base64');
  });

  it('summary view for listings omits the base64 images and reports which ones exist', () => {
    const dto = UserDtoMapper.toSummaryDto(buildReviewedUser());

    expect(dto).not.toHaveProperty('documentFrontUrl');
    expect(dto).not.toHaveProperty('documentBackUrl');
    expect(dto.hasDocumentFront).toBe(true);
    expect(dto.hasDocumentBack).toBe(true);
    expect(dto.kycNotes).toBe('Revisar con supervisor');
  });

  it('does not report a submission for a user who never sent documents', () => {
    const dto = UserDtoMapper.toSummaryDto(
      User.create({ email: 'nuevo@brotar.bo', passwordHash: 'hash', fullName: 'Nuevo Usuario' }),
    );

    expect(dto.kycSubmittedAt).toBeNull();
    expect(dto.hasDocumentFront).toBe(false);
    expect(dto.hasDocumentBack).toBe(false);
  });
});
