import { CampaignRewardValidationRules } from '../rules/campaign-reward-validation.rules';

export interface CampaignRewardProps {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  minimumContribution: number;
  /** Copied from the campaign when the reward is created. */
  currency: string;
  /** `null` means unlimited availability. */
  quantityTotal: number | null;
  /** Confirmed contributions that claimed this reward. */
  quantityClaimed: number;
  isActive: boolean;
  /** Calendar date without time, YYYY-MM-DD. */
  estimatedDeliveryOn: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignRewardCommand {
  id?: string;
  campaignId: string;
  currency: string;
  title: string;
  description: string;
  minimumContribution: number;
  quantityTotal: number | null;
  estimatedDeliveryOn: string;
}

export interface UpdateCampaignRewardDetails {
  title?: string;
  description?: string;
  minimumContribution?: number;
  quantityTotal?: number | null;
  estimatedDeliveryOn?: string;
}

export class CampaignReward {
  private constructor(private readonly props: CampaignRewardProps) {}

  public static create(command: CreateCampaignRewardCommand, now: Date = new Date()): CampaignReward {
    CampaignRewardValidationRules.validateTitle(command.title);
    CampaignRewardValidationRules.validateDescription(command.description);
    CampaignRewardValidationRules.validateMinimumContribution(command.minimumContribution);
    CampaignRewardValidationRules.validateQuantityTotal(command.quantityTotal);
    CampaignRewardValidationRules.validateDeliveryDate(command.estimatedDeliveryOn, now);

    return new CampaignReward({
      id: command.id || crypto.randomUUID(),
      campaignId: command.campaignId,
      title: command.title.trim(),
      description: command.description.trim(),
      minimumContribution: command.minimumContribution,
      currency: command.currency,
      quantityTotal: command.quantityTotal,
      quantityClaimed: 0,
      isActive: true,
      estimatedDeliveryOn: command.estimatedDeliveryOn,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds a stored reward without re-validating: past delivery dates stay readable. */
  public static reconstitute(props: CampaignRewardProps): CampaignReward {
    return new CampaignReward({ ...props });
  }

  /**
   * Applies only the provided fields and keeps the id. All changes are validated
   * before any is applied. The delivery date is only checked against today when
   * it differs from the stored one.
   */
  public updateDetails(changes: UpdateCampaignRewardDetails, now: Date = new Date()): void {
    if (changes.title !== undefined) {
      CampaignRewardValidationRules.validateTitle(changes.title);
    }
    if (changes.description !== undefined) {
      CampaignRewardValidationRules.validateDescription(changes.description);
    }
    if (changes.minimumContribution !== undefined) {
      CampaignRewardValidationRules.validateMinimumContribution(changes.minimumContribution);
    }
    if (changes.quantityTotal !== undefined) {
      CampaignRewardValidationRules.validateQuantityTotal(changes.quantityTotal);
    }
    const nextDeliveryOn = changes.estimatedDeliveryOn;
    const deliveryDateChanged =
      nextDeliveryOn !== undefined && nextDeliveryOn !== this.props.estimatedDeliveryOn;
    if (deliveryDateChanged) {
      CampaignRewardValidationRules.validateDeliveryDate(nextDeliveryOn, now);
    }

    if (changes.title !== undefined) {
      this.props.title = changes.title.trim();
    }
    if (changes.description !== undefined) {
      this.props.description = changes.description.trim();
    }
    if (changes.minimumContribution !== undefined) {
      this.props.minimumContribution = changes.minimumContribution;
    }
    if (changes.quantityTotal !== undefined) {
      this.props.quantityTotal = changes.quantityTotal;
    }
    if (deliveryDateChanged) {
      this.props.estimatedDeliveryOn = nextDeliveryOn;
    }
    this.props.updatedAt = now;
  }

  /** Changes only whether new contributions may select this reward. */
  public setActive(isActive: boolean, now: Date = new Date()): void {
    this.props.isActive = isActive;
    this.props.updatedAt = now;
  }

  /**
   * A stored reward counts for review when it is active and its fields still
   * satisfy the rules. The delivery date is only checked as a valid date, the
   * same way an unchanged date is kept on edit.
   */
  public isValidForReview(): boolean {
    if (!this.props.isActive) {
      return false;
    }
    try {
      CampaignRewardValidationRules.validateTitle(this.props.title);
      CampaignRewardValidationRules.validateDescription(this.props.description);
      CampaignRewardValidationRules.validateMinimumContribution(this.props.minimumContribution);
      CampaignRewardValidationRules.validateQuantityTotal(this.props.quantityTotal);
    } catch {
      return false;
    }
    return CampaignRewardValidationRules.isValidIsoDate(this.props.estimatedDeliveryOn);
  }

  public belongsTo(campaignId: string): boolean {
    return this.props.campaignId === campaignId;
  }

  public getId(): string {
    return this.props.id;
  }

  public getCampaignId(): string {
    return this.props.campaignId;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getDescription(): string {
    return this.props.description;
  }

  public getMinimumContribution(): number {
    return this.props.minimumContribution;
  }

  public getCurrency(): string {
    return this.props.currency;
  }

  public getQuantityTotal(): number | null {
    return this.props.quantityTotal;
  }

  public getQuantityClaimed(): number {
    return this.props.quantityClaimed;
  }

  /** `null` when the reward is unlimited. */
  public getQuantityRemaining(): number | null {
    if (this.props.quantityTotal === null) {
      return null;
    }
    return Math.max(this.props.quantityTotal - this.props.quantityClaimed, 0);
  }

  public isSoldOut(): boolean {
    return this.getQuantityRemaining() === 0;
  }

  public isActive(): boolean {
    return this.props.isActive;
  }

  public getEstimatedDeliveryOn(): string {
    return this.props.estimatedDeliveryOn;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
