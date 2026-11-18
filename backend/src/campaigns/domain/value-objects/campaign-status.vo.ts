export type CampaignStatusType =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'changes_requested'
  | 'rejected'
  | 'published'
  | 'completed'
  | 'cancelled';

export class CampaignStatus {
  public static readonly DRAFT = new CampaignStatus('draft');
  public static readonly PENDING_REVIEW = new CampaignStatus('pending_review');
  public static readonly APPROVED = new CampaignStatus('approved');
  public static readonly CHANGES_REQUESTED = new CampaignStatus('changes_requested');
  public static readonly REJECTED = new CampaignStatus('rejected');
  public static readonly PUBLISHED = new CampaignStatus('published');
  public static readonly COMPLETED = new CampaignStatus('completed');
  public static readonly CANCELLED = new CampaignStatus('cancelled');

  private constructor(private readonly value: CampaignStatusType) {}

  public getValue(): CampaignStatusType {
    return this.value;
  }

  public static fromString(value: string): CampaignStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'draft':
        return CampaignStatus.DRAFT;
      case 'pending_review':
        return CampaignStatus.PENDING_REVIEW;
      case 'approved':
        return CampaignStatus.APPROVED;
      case 'changes_requested':
        return CampaignStatus.CHANGES_REQUESTED;
      case 'rejected':
        return CampaignStatus.REJECTED;
      case 'published':
        return CampaignStatus.PUBLISHED;
      case 'completed':
        return CampaignStatus.COMPLETED;
      case 'cancelled':
        return CampaignStatus.CANCELLED;
      default:
        throw new Error(`Invalid campaign status: ${value}`);
    }
  }

  public equals(other: CampaignStatus): boolean {
    return this.value === other.value;
  }

  public isDraft(): boolean {
    return this.value === 'draft';
  }

  public isEditableByCreator(): boolean {
    return this.value === 'draft' || this.value === 'changes_requested';
  }

  public canSubmitForReview(): boolean {
    return this.value === 'draft' || this.value === 'changes_requested';
  }

  public isPendingReview(): boolean {
    return this.value === 'pending_review';
  }

  public isApproved(): boolean {
    return this.value === 'approved';
  }

  public isPublished(): boolean {
    return this.value === 'published';
  }

  public isCompleted(): boolean {
    return this.value === 'completed';
  }

  public isCancelled(): boolean {
    return this.value === 'cancelled';
  }

  public canReceiveFunds(): boolean {
    return this.value === 'published';
  }
}
