import { CampaignStatus } from './campaign-status.vo';
import type { CampaignTypeValue } from './campaign-type.vo';

export interface CampaignAccessProps {
  id: string;
  ownerUserId: string;
  status: CampaignStatus;
  campaignType: CampaignTypeValue;
  currency: string;
  goalAmount: number;
}

/**
 * Read-only campaign fields needed to authorize and validate operations on its
 * plan, rewards, updates and review history. It cannot be persisted back.
 */
export class CampaignAccess {
  private constructor(private readonly props: Readonly<CampaignAccessProps>) {}

  public static reconstitute(props: CampaignAccessProps): CampaignAccess {
    return new CampaignAccess({ ...props });
  }

  public getId(): string {
    return this.props.id;
  }

  public getStatus(): CampaignStatus {
    return this.props.status;
  }

  public getCampaignType(): CampaignTypeValue {
    return this.props.campaignType;
  }

  public getCurrency(): string {
    return this.props.currency;
  }

  public getGoalAmount(): number {
    return this.props.goalAmount;
  }

  public isOwnedBy(userId: string): boolean {
    return this.props.ownerUserId === userId;
  }

  public isEditable(): boolean {
    return this.props.status.isEditableByCreator();
  }
}
