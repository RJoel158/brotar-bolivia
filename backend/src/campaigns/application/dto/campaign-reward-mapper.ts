import type { CampaignReward } from '../../domain/entities/campaign-reward.entity';
import type { CampaignRewardResponseDto } from './campaign-reward-response.dto';

export function toCampaignRewardResponseDto(reward: CampaignReward): CampaignRewardResponseDto {
  return {
    id: reward.getId(),
    campaignId: reward.getCampaignId(),
    title: reward.getTitle(),
    description: reward.getDescription(),
    minimumContribution: reward.getMinimumContribution(),
    currency: reward.getCurrency(),
    quantityTotal: reward.getQuantityTotal(),
    quantityClaimed: reward.getQuantityClaimed(),
    quantityRemaining: reward.getQuantityRemaining(),
    isSoldOut: reward.isSoldOut(),
    isActive: reward.isActive(),
    estimatedDeliveryOn: reward.getEstimatedDeliveryOn(),
    createdAt: reward.getCreatedAt().toISOString(),
    updatedAt: reward.getUpdatedAt().toISOString(),
  };
}
