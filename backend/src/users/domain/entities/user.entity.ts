import { UserRole } from '../value-objects/user-role.vo';
import { KycStatus } from '../value-objects/kyc-status.vo';
import { UserValidationRules } from '../rules/user-validation.rules';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  status: string;
  avatarUrl?: string | null;
  documentId?: string | null;
  documentType?: string | null;
  organizationName?: string | null;
  kycSubmittedAt?: Date | null;
  kycReviewedAt?: Date | null;
  kycRejectionReason?: string | null;
  kycNotes?: string | null;
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserCommand {
  id?: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role?: UserRole;
  kycStatus?: KycStatus;
  avatarUrl?: string | null;
  documentId?: string | null;
  documentType?: string | null;
  organizationName?: string | null;
  kycSubmittedAt?: Date | null;
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  mustChangePassword?: boolean;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  public static create(command: CreateUserCommand): User {
    UserValidationRules.validateEmail(command.email);
    UserValidationRules.validateFullName(command.fullName);

    const now = new Date();
    const id = command.id || crypto.randomUUID();

    return new User({
      id,
      email: command.email.toLowerCase().trim(),
      passwordHash: command.passwordHash,
      fullName: UserValidationRules.normalizeFullName(command.fullName),
      phone: command.phone || null,
      role: command.role || UserRole.SPONSOR,
      kycStatus: command.kycStatus || KycStatus.PENDING,
      status: 'active',
      avatarUrl: command.avatarUrl || null,
      documentId: command.documentId || null,
      documentType: command.documentType || 'CI',
      organizationName: command.organizationName || null,
      kycSubmittedAt: command.kycSubmittedAt ?? null,
      kycReviewedAt: null,
      kycRejectionReason: null,
      kycNotes: null,
      documentFrontUrl: command.documentFrontUrl || null,
      documentBackUrl: command.documentBackUrl || null,
      mustChangePassword: command.mustChangePassword ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getEmail(): string {
    return this.props.email;
  }

  public getPasswordHash(): string {
    return this.props.passwordHash;
  }

  public getFullName(): string {
    return this.props.fullName;
  }

  public getPhone(): string | null {
    return this.props.phone ?? null;
  }

  public getRole(): UserRole {
    return this.props.role;
  }

  public getKycStatus(): KycStatus {
    return this.props.kycStatus;
  }

  public getStatus(): string {
    return this.props.status;
  }

  public getAvatarUrl(): string | null {
    return this.props.avatarUrl ?? null;
  }

  public getDocumentId(): string | null {
    return this.props.documentId ?? null;
  }

  public getDocumentType(): string | null {
    return this.props.documentType ?? 'CI';
  }

  public getOrganizationName(): string | null {
    return this.props.organizationName ?? null;
  }

  public getKycSubmittedAt(): Date | null {
    return this.props.kycSubmittedAt ?? null;
  }

  public getKycReviewedAt(): Date | null {
    return this.props.kycReviewedAt ?? null;
  }

  public getKycRejectionReason(): string | null {
    return this.props.kycRejectionReason ?? null;
  }

  public getKycNotes(): string | null {
    return this.props.kycNotes ?? null;
  }

  public getDocumentFrontUrl(): string | null {
    return this.props.documentFrontUrl ?? null;
  }

  public getDocumentBackUrl(): string | null {
    return this.props.documentBackUrl ?? null;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public getMustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }

  public requirePasswordChange(): void {
    this.props.mustChangePassword = true;
    this.props.updatedAt = new Date();
  }

  public clearMustChangePassword(): void {
    this.props.mustChangePassword = false;
    this.props.updatedAt = new Date();
  }

  public submitKyc(data: {
    documentId: string;
    documentType: string;
    organizationName?: string | null;
    documentFrontUrl: string;
    documentBackUrl?: string | null;
    phone?: string | null;
  }): void {
    this.props.documentId = data.documentId.trim();
    this.props.documentType = data.documentType.trim();
    if (data.organizationName !== undefined) {
      this.props.organizationName = data.organizationName ? data.organizationName.trim() : null;
    }
    this.props.documentFrontUrl = data.documentFrontUrl;
    this.props.documentBackUrl = data.documentBackUrl || null;
    if (data.phone) {
      this.props.phone = data.phone.trim();
    }
    this.props.kycStatus = KycStatus.PENDING;
    this.props.kycSubmittedAt = new Date();
    this.props.kycReviewedAt = null;
    this.props.kycRejectionReason = null;
    this.props.updatedAt = new Date();
  }

  public updateKycStatus(newStatus: KycStatus, notes?: string, reason?: string): void {
    this.props.kycStatus = newStatus;
    this.props.kycReviewedAt = new Date();
    if (notes !== undefined) this.props.kycNotes = notes;
    if (reason !== undefined) this.props.kycRejectionReason = reason;
    this.props.updatedAt = new Date();
  }

  public changeRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.status = 'inactive';
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  public changePassword(
    newPasswordHash: string,
    options?: { requireChange?: boolean; clearRequireChange?: boolean },
  ): void {
    this.props.passwordHash = newPasswordHash;
    if (options?.requireChange) {
      this.props.mustChangePassword = true;
    } else if (options?.clearRequireChange) {
      this.props.mustChangePassword = false;
    }
    this.props.updatedAt = new Date();
  }

  public isActive(): boolean {
    return this.props.status === 'active';
  }

  public updateProfile(data: { fullName?: string; phone?: string; avatarUrl?: string }): void {
    if (data.fullName !== undefined) {
      UserValidationRules.validateFullName(data.fullName);
      this.props.fullName = UserValidationRules.normalizeFullName(data.fullName);
    }
    if (data.phone !== undefined) {
      this.props.phone = data.phone;
    }
    if (data.avatarUrl !== undefined) {
      this.props.avatarUrl = data.avatarUrl;
    }
    this.props.updatedAt = new Date();
  }

  public isAdmin(): boolean {
    return this.props.role.isAdmin();
  }

  public isCreator(): boolean {
    return this.props.role.isCreator();
  }

  public isSponsor(): boolean {
    return this.props.role.isSponsor();
  }

  public isVerified(): boolean {
    return this.props.kycStatus.isVerified();
  }
}
