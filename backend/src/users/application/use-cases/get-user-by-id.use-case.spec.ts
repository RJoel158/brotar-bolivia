import { jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = '33333333-3333-4333-8333-333333333333';
const FRONT_IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

function buildOwner(): User {
  const user = User.create({
    id: OWNER_ID,
    email: 'creadora@brotar.bo',
    passwordHash: 'hash',
    fullName: 'Creadora Brotar',
    role: UserRole.CREATOR,
  });
  user.submitKyc({
    documentId: '1234567',
    documentType: 'CI',
    documentFrontUrl: FRONT_IMAGE,
  });
  user.updateKycStatus(
    KycStatus.REQUIRES_DOCUMENTATION,
    'Nota interna del revisor',
    'Sube el reverso de tu carnet.',
  );
  return user;
}

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase;
  let repo: jest.Mocked<UserRepositoryPort>;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
      findById: jest.fn<UserRepositoryPort['findById']>().mockResolvedValue(buildOwner()),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepositoryPort>;
    useCase = new GetUserByIdUseCase(repo);
  });

  it('lets the owner read their own record, including documents, without internal notes', async () => {
    const result = await useCase.execute(OWNER_ID, { id: OWNER_ID, role: 'creator' });

    expect(result).not.toHaveProperty('kycNotes');
    expect(result.documentFrontUrl).toBe(FRONT_IMAGE);
    expect(result.documentId).toBe('1234567');
    expect(result.kycRejectionReason).toBe('Sube el reverso de tu carnet.');
    expect(result.hasDocumentFront).toBe(true);
  });

  it('gives an admin the full record for review, including internal notes', async () => {
    const result = await useCase.execute(OWNER_ID, { id: ADMIN_ID, role: 'admin' });

    expect(result).toHaveProperty('kycNotes', 'Nota interna del revisor');
    expect(result.documentFrontUrl).toBe(FRONT_IMAGE);
  });

  it('rejects another non-admin user without looking the record up', async () => {
    await expect(
      useCase.execute(OWNER_ID, { id: OTHER_ID, role: 'sponsor' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      useCase.execute(OWNER_ID, { id: OTHER_ID, role: 'creator' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('answers 404 to an admin only when the user does not exist', async () => {
    repo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute(OTHER_ID, { id: ADMIN_ID, role: 'admin' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('executeForOwner never includes internal notes', async () => {
    const result = await useCase.executeForOwner(OWNER_ID);

    expect(result).not.toHaveProperty('kycNotes');
    expect(result.id).toBe(OWNER_ID);
  });
});
