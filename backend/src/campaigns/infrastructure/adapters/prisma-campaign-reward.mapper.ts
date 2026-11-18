import { Prisma } from '@prisma/client';
import type { campaign_rewards } from '@prisma/client';
import { CampaignReward } from '../../domain/entities/campaign-reward.entity';

/** DATE columns come back as UTC midnight; reading UTC keeps the calendar day. */
function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** The domain allows at most 2 decimals, so toFixed(2) is exact. */
function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export class PrismaCampaignRewardMapper {
  public static toDomain(record: campaign_rewards): CampaignReward {
    return CampaignReward.reconstitute({
      id: record.id,
      campaignId: record.campaign_id,
      title: record.title,
      description: record.description,
      minimumContribution: record.min_amount.toNumber(),
      currency: record.currency,
      quantityTotal: record.quantity_total,
      quantityClaimed: record.quantity_claimed,
      isActive: record.is_active,
      estimatedDeliveryOn: toIsoDate(record.estimated_delivery_on),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  /** quantity_claimed and is_active keep their database defaults on insert. */
  public static toPersistence(reward: CampaignReward): Prisma.campaign_rewardsUncheckedCreateInput {
    return {
      id: reward.getId(),
      campaign_id: reward.getCampaignId(),
      title: reward.getTitle(),
      description: reward.getDescription(),
      min_amount: toDecimal(reward.getMinimumContribution()),
      currency: reward.getCurrency(),
      quantity_total: reward.getQuantityTotal(),
      estimated_delivery_on: fromIsoDate(reward.getEstimatedDeliveryOn()),
      created_at: reward.getCreatedAt(),
      updated_at: reward.getUpdatedAt(),
    };
  }

  /** Never writes quantity_claimed (only payment confirmation does) nor currency. */
  public static toUpdatePersistence(
    reward: CampaignReward,
  ): Prisma.campaign_rewardsUncheckedUpdateInput {
    return {
      title: reward.getTitle(),
      description: reward.getDescription(),
      min_amount: toDecimal(reward.getMinimumContribution()),
      quantity_total: reward.getQuantityTotal(),
      estimated_delivery_on: fromIsoDate(reward.getEstimatedDeliveryOn()),
      updated_at: reward.getUpdatedAt(),
    };
  }
}
