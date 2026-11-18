export type KycStatusType = 'pending' | 'verified' | 'rejected' | 'requires_documentation';

export class KycStatus {
  public static readonly PENDING = new KycStatus('pending');
  public static readonly VERIFIED = new KycStatus('verified');
  public static readonly REJECTED = new KycStatus('rejected');
  public static readonly REQUIRES_DOCUMENTATION = new KycStatus('requires_documentation');

  private constructor(private readonly value: KycStatusType) {}

  public getValue(): KycStatusType {
    return this.value;
  }

  public static fromString(value: string): KycStatus {
    const lower = value.toLowerCase().trim();
    switch (lower) {
      case 'pending':
        return KycStatus.PENDING;
      case 'verified':
        return KycStatus.VERIFIED;
      case 'rejected':
        return KycStatus.REJECTED;
      case 'requires_documentation':
      case 'requires-documentation':
        return KycStatus.REQUIRES_DOCUMENTATION;
      default:
        throw new Error(`Estado KYC/KYB inválido: "${value}".`);
    }
  }

  public equals(other: KycStatus): boolean {
    return this.value === other.value;
  }

  public isPending(): boolean {
    return this.value === 'pending';
  }

  public isVerified(): boolean {
    return this.value === 'verified';
  }

  public isRejected(): boolean {
    return this.value === 'rejected';
  }

  public requiresDocumentation(): boolean {
    return this.value === 'requires_documentation';
  }
}
