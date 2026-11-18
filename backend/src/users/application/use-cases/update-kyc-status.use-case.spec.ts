import { jest } from '@jest/globals';
import { UpdateKycStatusUseCase } from './update-kyc-status.use-case';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { NotificationService } from '../../../notifications/application/notification.service';
import { KycRequiresDocsNotification } from '../../../notifications/domain/kyc-requires-docs.notification';
import type { Notification } from '../../../notifications/domain/notification.base';
import { User } from '../../domain/entities/user.entity';

describe('UpdateKycStatusUseCase', () => {
  let user: User;
  let repo: jest.Mocked<UserRepositoryPort>;
  let dispatch: jest.Mock<(notification: Notification) => Promise<void>>;
  let useCase: UpdateKycStatusUseCase;

  beforeEach(() => {
    user = User.create({
      email: 'creadora@brotar.bo',
      passwordHash: 'hash',
      fullName: 'Creadora Brotar',
    });
    repo = {
      save: jest.fn(),
      findById: jest.fn<UserRepositoryPort['findById']>().mockResolvedValue(user),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn<UserRepositoryPort['update']>().mockImplementation(async (u) => u),
      delete: jest.fn(),
    } as jest.Mocked<UserRepositoryPort>;
    dispatch = jest.fn<(notification: Notification) => Promise<void>>().mockResolvedValue();
    useCase = new UpdateKycStatusUseCase(repo, { dispatch } as unknown as NotificationService);
  });

  it('keeps the documentation request visible to the user and the internal note private', async () => {
    const result = await useCase.execute(user.getId(), {
      kycStatus: 'requires_documentation',
      notes: 'Comparar con registro anterior',
      rejectionReason: 'Sube una foto legible del reverso.',
    });

    expect(result.kycRejectionReason).toBe('Sube una foto legible del reverso.');
    expect(result.kycNotes).toBe('Comparar con registro anterior');
    const sent = dispatch.mock.calls[0]?.[0];
    expect(sent).toBeInstanceOf(KycRequiresDocsNotification);
    expect((sent as KycRequiresDocsNotification).payload.notes).toBe(
      'Sube una foto legible del reverso.',
    );
  });
});
