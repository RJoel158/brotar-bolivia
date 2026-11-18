import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUserUseCase } from './login-user.use-case';

describe('LoginUserUseCase account status', () => {
  it('does not issue tokens to an inactive account even with a correct password', async () => {
    const repository = { findByEmail: jest.fn().mockResolvedValue({
      getPasswordHash: () => 'stored-hash', isActive: () => false,
    }) };
    const hasher = { compare: jest.fn().mockResolvedValue(true) };
    const tokens = { generateTokens: jest.fn() };
    const useCase = new LoginUserUseCase(repository as never, hasher as never, tokens as never);
    await expect(useCase.execute({ email: 'inactive@example.test', password: 'password' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokens.generateTokens).not.toHaveBeenCalled();
  });
});
