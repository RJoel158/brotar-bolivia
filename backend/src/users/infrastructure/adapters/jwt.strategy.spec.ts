import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import type { UserRepositoryPort } from '../../application/ports/user.repository.port';

describe('JwtStrategy current account state', () => {
  beforeEach(() => { process.env.JWT_SECRET ||= 'test-only-signing-key-for-unit-tests'; });
  const payload = { sub: '22222222-2222-4222-8222-222222222222', email: 'old@example.test', role: 'admin', kycStatus: 'verified' };
  it.each([null, { isActive: () => false }])('rejects a missing or inactive account', async (user) => {
    const repository = { findById: jest.fn().mockResolvedValue(user) };
    const strategy = new JwtStrategy(repository as unknown as UserRepositoryPort);
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rejects a malformed subject before calling persistence', async () => {
    const repository = { findById: jest.fn() };
    const strategy = new JwtStrategy(repository as unknown as UserRepositoryPort);
    await expect(strategy.validate({ ...payload, sub: 'not-a-uuid' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.findById).not.toHaveBeenCalled();
  });
  it('uses current role and KYC instead of stale token claims', async () => {
    const user = {
      isActive: () => true, getId: () => '22222222-2222-4222-8222-222222222222', getEmail: () => 'current@example.test',
      getRole: () => ({ getValue: () => 'creator' }),
      getKycStatus: () => ({ getValue: () => 'pending' }),
    };
    const repository = { findById: jest.fn().mockResolvedValue(user) };
    const strategy = new JwtStrategy(repository as unknown as UserRepositoryPort);
    await expect(strategy.validate(payload)).resolves.toEqual(expect.objectContaining({
      id: '22222222-2222-4222-8222-222222222222', email: 'current@example.test', role: 'creator', kycStatus: 'pending',
    }));
  });
});
