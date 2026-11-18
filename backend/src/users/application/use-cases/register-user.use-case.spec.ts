import { jest } from '@jest/globals';
import { RegisterUserUseCase } from './register-user.use-case';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import type { TokenServicePort } from '../ports/token-service.port';
import { User } from '../../domain/entities/user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockHasher: jest.Mocked<PasswordHasherPort>;
  let mockTokenService: jest.Mocked<TokenServicePort>;

  beforeEach(() => {
    mockUserRepo = {
      save: jest.fn().mockImplementation(async (u: User) => u),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockHasher = {
      hash: jest.fn().mockResolvedValue('$2b$10$hashedPassword123'),
      compare: jest.fn(),
    };

    mockTokenService = {
      generateTokens: jest.fn().mockResolvedValue({ accessToken: 'mock-jwt-token' }),
      verifyToken: jest.fn(),
    };

    useCase = new RegisterUserUseCase(mockUserRepo, mockHasher, mockTokenService);
  });

  it('should register a new user successfully and return tokens', async () => {
    const result = await useCase.execute({
      email: 'ana.delgado@brotar.bo',
      password: 'StrongPassword123!',
      fullName: 'Ana Delgado',
      role: 'creator',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('ana.delgado@brotar.bo');
    expect(result.user.role).toBe('creator');
    expect(result.user.kycStatus).toBe('pending');
    expect(result.user.kycSubmittedAt).toBeNull();
    expect(result.user.hasDocumentFront).toBe(false);
    expect(result.user).not.toHaveProperty('kycNotes');
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    expect(mockHasher.hash).toHaveBeenCalledWith('StrongPassword123!');
  });
});
