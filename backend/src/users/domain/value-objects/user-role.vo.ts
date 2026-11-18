export type UserRoleType = 'admin' | 'creator' | 'sponsor';

export class UserRole {
  public static readonly ADMIN = new UserRole('admin');
  public static readonly CREATOR = new UserRole('creator');
  public static readonly SPONSOR = new UserRole('sponsor');

  private constructor(private readonly value: UserRoleType) {}

  public getValue(): UserRoleType {
    return this.value;
  }

  public static fromString(value: string): UserRole {
    const lower = value.toLowerCase().trim();
    switch (lower) {
      case 'admin':
        return UserRole.ADMIN;
      case 'creator':
        return UserRole.CREATOR;
      case 'sponsor':
        return UserRole.SPONSOR;
      default:
        throw new Error(`Rol de usuario inválido: "${value}". Permitidos: admin, creator, sponsor.`);
    }
  }

  public equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  public isAdmin(): boolean {
    return this.value === 'admin';
  }

  public isCreator(): boolean {
    return this.value === 'creator';
  }

  public isSponsor(): boolean {
    return this.value === 'sponsor';
  }
}
