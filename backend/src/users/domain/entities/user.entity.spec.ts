import { User } from './user.entity';
import { UserRole } from '../value-objects/user-role.vo';
import { KycStatus } from '../value-objects/kyc-status.vo';

describe('User Domain Entity', () => {
  it('should create a valid user with default SPONSOR role and PENDING kyc status', () => {
    const user = User.create({
      email: 'juan.perez@example.com',
      passwordHash: '$2b$10$hashedPasswordHere',
      fullName: 'Juan Pérez',
      phone: '+591 70012345',
    });

    expect(user.getId()).toBeDefined();
    expect(user.getEmail()).toBe('juan.perez@example.com');
    expect(user.getRole().isSponsor()).toBe(true);
    expect(user.getKycStatus().isPending()).toBe(true);
    expect(user.getStatus()).toBe('active');
  });

  it('should throw error when email format is invalid', () => {
    expect(() => {
      User.create({
        email: 'invalid-email-string',
        passwordHash: 'hashed',
        fullName: 'Juan Pérez',
      });
    }).toThrow('no tiene un formato válido');
  });

  it('should normalize repeated spaces in the full name', () => {
    const user = User.create({
      email: 'ana@example.com',
      passwordHash: 'hashed',
      fullName: '  Ana   María  Pérez ',
    });
    expect(user.getFullName()).toBe('Ana María Pérez');
  });

  it.each(['Cooperativa 21 de Marzo', "Agro & Cía. (S.R.L.) O'Neil-Ñ"])(
    'should accept the full name "%s"',
    (fullName) => {
      expect(() =>
        User.create({ email: 'x@example.com', passwordHash: 'hashed', fullName }),
      ).not.toThrow();
    },
  );

  it.each([
    ['12345', 'empezar con una letra'],
    ['Juan@#!', 'empezar con una letra'],
    ['A1-', 'al menos 2 letras'],
    ['Al', 'al menos 3 caracteres'],
  ])('should reject the full name "%s"', (fullName, message) => {
    expect(() =>
      User.create({ email: 'x@example.com', passwordHash: 'hashed', fullName }),
    ).toThrow(message);
  });

  it('should allow updating KYC status to verified', () => {
    const user = User.create({
      email: 'creador@brotar.org',
      passwordHash: 'hashed',
      fullName: 'Fundación RIOVERDE',
      role: UserRole.CREATOR,
    });

    expect(user.isVerified()).toBe(false);
    user.updateKycStatus(KycStatus.VERIFIED);
    expect(user.isVerified()).toBe(true);
    expect(user.getKycStatus().isVerified()).toBe(true);
  });
});
