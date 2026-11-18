import { CampaignStatus } from '../value-objects/campaign-status.vo';
import { CampaignCategory, CampaignCategoryType } from '../value-objects/campaign-category.vo';
import { CampaignType, CampaignTypeValue } from '../value-objects/campaign-type.vo';
import { FundingModel, FundingModelType } from '../value-objects/funding-model.vo';
import { CampaignValidationRules } from '../rules/campaign-validation.rules';

export interface CampaignProps {
  id: string;
  ownerUserId: string;
  organizationId: string | null;
  category: CampaignCategoryType;
  title: string;
  slug: string;
  location: string | null;
  shortSummary: string | null;
  coverImageUrl: string | null;
  campaignType: CampaignTypeValue;
  fundingModel: FundingModelType;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  startDate: Date | null;
  endDate: Date | null;
  status: CampaignStatus;
  problem: string | null;
  solution: string | null;
  beneficiaries: string | null;
  expectedImpact: string | null;
  impactIndicators: string | null;
  reviewNotes: string | null;
  reviewRejectionReason: string | null;
  creatorName?: string | null;
  organizationName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface CreateCampaignCommand {
  id?: string;
  ownerUserId: string;
  organizationId?: string | null;
  category: string;
  title: string;
  slug?: string;
  location?: string | null;
  shortSummary?: string | null;
  coverImageUrl?: string | null;
  campaignType: string;
  fundingModel: string;
  goalAmount: number;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  problem?: string | null;
  solution?: string | null;
  beneficiaries?: string | null;
  expectedImpact?: string | null;
  impactIndicators?: string | null;
}

export interface UpdateCampaignDetails {
  title?: string;
  category?: string;
  campaignType?: string;
  fundingModel?: string;
  goalAmount?: number;
  organizationId?: string | null;
  shortSummary?: string | null;
  coverImageUrl?: string | null;
  location?: string | null;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  problem?: string | null;
  solution?: string | null;
  beneficiaries?: string | null;
  expectedImpact?: string | null;
  impactIndicators?: string | null;
}

export class Campaign {
  private constructor(private readonly props: CampaignProps) {}

  public static create(command: CreateCampaignCommand): Campaign {
    CampaignValidationRules.validateTitle(command.title);
    CampaignValidationRules.validateShortSummary(command.shortSummary);
    CampaignValidationRules.validateCategory(command.category);
    CampaignValidationRules.validateCampaignType(command.campaignType);
    CampaignValidationRules.validateFundingModel(command.fundingModel);
    CampaignValidationRules.validateGoalAmount(command.goalAmount);
    CampaignValidationRules.validateEndDate(command.endDate ?? null);

    const category = CampaignCategory.fromString(command.category).getValue();
    const campaignType = CampaignType.fromString(command.campaignType).getValue();
    const fundingModel = FundingModel.fromString(command.fundingModel).getValue();
    const now = new Date();
    const id = command.id || crypto.randomUUID();
    const slug = command.slug?.trim() || CampaignValidationRules.generateSlug(command.title);

    return new Campaign({
      id,
      ownerUserId: command.ownerUserId,
      organizationId: command.organizationId ?? null,
      category,
      title: command.title.trim(),
      slug,
      location: command.location ?? null,
      shortSummary: command.shortSummary?.trim() || null,
      coverImageUrl: command.coverImageUrl ?? null,
      campaignType,
      fundingModel,
      goalAmount: command.goalAmount,
      currentAmount: 0,
      currency: command.currency?.trim() || 'BOB',
      startDate: command.startDate ?? null,
      endDate: command.endDate ?? null,
      status: CampaignStatus.DRAFT,
      problem: command.problem ?? null,
      solution: command.solution ?? null,
      beneficiaries: command.beneficiaries ?? null,
      expectedImpact: command.expectedImpact ?? null,
      impactIndicators: command.impactIndicators ?? null,
      reviewNotes: null,
      reviewRejectionReason: null,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });
  }

  public static reconstitute(props: CampaignProps): Campaign {
    return new Campaign(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getOwnerUserId(): string {
    return this.props.ownerUserId;
  }

  public getOrganizationId(): string | null {
    return this.props.organizationId;
  }

  public getCategory(): CampaignCategoryType {
    return this.props.category;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getSlug(): string {
    return this.props.slug;
  }

  public getLocation(): string | null {
    return this.props.location;
  }

  public getShortSummary(): string | null {
    return this.props.shortSummary;
  }

  public getCoverImageUrl(): string | null {
    return this.props.coverImageUrl;
  }

  public getCampaignType(): CampaignTypeValue {
    return this.props.campaignType;
  }

  public getFundingModel(): FundingModelType {
    return this.props.fundingModel;
  }

  public getGoalAmount(): number {
    return this.props.goalAmount;
  }

  public getCurrentAmount(): number {
    return this.props.currentAmount;
  }

  public getCurrency(): string {
    return this.props.currency;
  }

  public getStartDate(): Date | null {
    return this.props.startDate;
  }

  public getEndDate(): Date | null {
    return this.props.endDate;
  }

  public getStatus(): CampaignStatus {
    return this.props.status;
  }

  public getProblem(): string | null {
    return this.props.problem;
  }

  public getSolution(): string | null {
    return this.props.solution;
  }

  public getBeneficiaries(): string | null {
    return this.props.beneficiaries;
  }

  public getExpectedImpact(): string | null {
    return this.props.expectedImpact;
  }

  public getImpactIndicators(): string | null {
    return this.props.impactIndicators;
  }

  public getReviewNotes(): string | null {
    return this.props.reviewNotes;
  }

  public getReviewRejectionReason(): string | null {
    return this.props.reviewRejectionReason;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public getPublishedAt(): Date | null {
    return this.props.publishedAt;
  }

  public getCreatorName(): string | null {
    return this.props.creatorName ?? null;
  }

  public getOrganizationName(): string | null {
    return this.props.organizationName ?? null;
  }

  public isOwnedBy(userId: string): boolean {
    return this.props.ownerUserId === userId;
  }

  public isEditable(): boolean {
    return this.props.status.isEditableByCreator();
  }

  public updateDetails(changes: UpdateCampaignDetails): void {
    if (!this.isEditable()) {
      throw new Error(
        `No se puede editar una campaña en estado "${this.props.status.getValue()}".`,
      );
    }

    if (changes.title !== undefined) {
      CampaignValidationRules.validateTitle(changes.title);
      this.props.title = changes.title.trim();
    }

    if (changes.category !== undefined) {
      CampaignValidationRules.validateCategory(changes.category);
      this.props.category = CampaignCategory.fromString(changes.category).getValue();
    }

    if (changes.campaignType !== undefined) {
      CampaignValidationRules.validateCampaignType(changes.campaignType);
      this.props.campaignType = CampaignType.fromString(changes.campaignType).getValue();
    }

    if (changes.fundingModel !== undefined) {
      CampaignValidationRules.validateFundingModel(changes.fundingModel);
      this.props.fundingModel = FundingModel.fromString(changes.fundingModel).getValue();
    }

    if (changes.goalAmount !== undefined) {
      CampaignValidationRules.validateGoalAmount(changes.goalAmount);
      this.props.goalAmount = changes.goalAmount;
    }

    if (changes.organizationId !== undefined) {
      this.props.organizationId = changes.organizationId;
    }

    if (changes.shortSummary !== undefined) {
      CampaignValidationRules.validateShortSummary(changes.shortSummary);
      this.props.shortSummary = changes.shortSummary?.trim() || null;
    }

    if (changes.coverImageUrl !== undefined) {
      this.props.coverImageUrl = changes.coverImageUrl?.trim() || null;
    }

    if (changes.location !== undefined) {
      this.props.location = changes.location?.trim() || null;
    }

    if (changes.currency !== undefined) {
      this.props.currency = changes.currency.trim() || 'BOB';
    }

    if (changes.startDate !== undefined || changes.endDate !== undefined) {
      const nextEndDate = changes.endDate !== undefined ? changes.endDate : this.props.endDate;
      CampaignValidationRules.validateEndDate(nextEndDate);
    }

    if (changes.startDate !== undefined) {
      this.props.startDate = changes.startDate;
    }
    if (changes.endDate !== undefined) {
      this.props.endDate = changes.endDate;
    }

    if (changes.problem !== undefined) {
      this.props.problem = changes.problem?.trim() || null;
    }
    if (changes.solution !== undefined) {
      this.props.solution = changes.solution?.trim() || null;
    }
    if (changes.beneficiaries !== undefined) {
      this.props.beneficiaries = changes.beneficiaries?.trim() || null;
    }
    if (changes.expectedImpact !== undefined) {
      this.props.expectedImpact = changes.expectedImpact?.trim() || null;
    }
    if (changes.impactIndicators !== undefined) {
      this.props.impactIndicators = changes.impactIndicators?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  public addFunds(amount: number): void {
    if (amount <= 0) {
      throw new Error('El monto a aportar debe ser mayor a 0.');
    }
    if (!this.props.status.canReceiveFunds()) {
      throw new Error(
        `No se pueden recibir fondos en una campaña en estado "${this.props.status.getValue()}".`,
      );
    }
    if (this.hasExpired()) {
      throw new Error('La campaña ya ha alcanzado su fecha límite.');
    }

    this.props.currentAmount += amount;
    this.props.updatedAt = new Date();

    if (this.props.currentAmount >= this.props.goalAmount) {
      this.props.status = CampaignStatus.COMPLETED;
    }
  }

  public submitForReview(): void {
    if (!this.props.status.canSubmitForReview()) {
      throw new Error(
        `No se puede enviar a revisión una campaña en estado "${this.props.status.getValue()}".`,
      );
    }

    CampaignValidationRules.validateTitle(this.props.title);
    CampaignValidationRules.validateCategory(this.props.category);
    CampaignValidationRules.validateCampaignType(this.props.campaignType);
    CampaignValidationRules.validateFundingModel(this.props.fundingModel);
    CampaignValidationRules.validateGoalAmount(this.props.goalAmount);

    if (!this.props.shortSummary || this.props.shortSummary.trim().length === 0) {
      throw new Error('El resumen corto es obligatorio para enviar a revisión.');
    }
    CampaignValidationRules.validateShortSummary(this.props.shortSummary);

    if (!this.props.location || this.props.location.trim().length === 0) {
      throw new Error('La ubicación es obligatoria para enviar a revisión.');
    }

    this.props.status = CampaignStatus.PENDING_REVIEW;
    this.props.updatedAt = new Date();
  }

  public approve(notes?: string | null): void {
    if (!this.props.status.isPendingReview()) {
      throw new Error(
        `Solo se pueden aprobar campañas en pending_review. Estado actual: "${this.props.status.getValue()}".`,
      );
    }
    this.props.status = CampaignStatus.APPROVED;
    this.props.reviewNotes = notes?.trim() || null;
    this.props.reviewRejectionReason = null;
    this.props.updatedAt = new Date();
  }

  public reject(reason: string): void {
    if (!this.props.status.isPendingReview()) {
      throw new Error(
        `Solo se pueden rechazar campañas en pending_review. Estado actual: "${this.props.status.getValue()}".`,
      );
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new Error('El motivo de rechazo es obligatorio.');
    }
    this.props.status = CampaignStatus.REJECTED;
    this.props.reviewRejectionReason = trimmed;
    this.props.reviewNotes = null;
    this.props.updatedAt = new Date();
  }

  public requestChanges(notes: string): void {
    if (!this.props.status.isPendingReview()) {
      throw new Error(
        `Solo se pueden solicitar cambios a campañas en pending_review. Estado actual: "${this.props.status.getValue()}".`,
      );
    }
    const trimmed = notes.trim();
    if (!trimmed) {
      throw new Error('Las observaciones para solicitar cambios son obligatorias.');
    }
    this.props.status = CampaignStatus.CHANGES_REQUESTED;
    this.props.reviewNotes = trimmed;
    this.props.reviewRejectionReason = null;
    this.props.updatedAt = new Date();
  }

  public publish(): void {
    if (!this.props.status.isApproved()) {
      throw new Error(
        `Solo se pueden publicar campañas en estado approved. Estado actual: "${this.props.status.getValue()}".`,
      );
    }
    if (this.hasExpired()) {
      throw new Error('No se puede publicar una campaña vencida.');
    }
    this.props.status = CampaignStatus.PUBLISHED;
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    this.props.status = CampaignStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public hasExpired(currentDate: Date = new Date()): boolean {
    if (!this.props.endDate) {
      return false;
    }
    return this.props.endDate.getTime() < currentDate.getTime();
  }

  public isFunded(): boolean {
    return this.props.currentAmount >= this.props.goalAmount;
  }

  public getProgressPercentage(): number {
    if (this.props.goalAmount <= 0) return 0;
    return Math.min(100, Math.round((this.props.currentAmount / this.props.goalAmount) * 100));
  }
}
