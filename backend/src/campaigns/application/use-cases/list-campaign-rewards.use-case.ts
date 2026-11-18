import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_REWARD_REPOSITORY_PORT } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardRepositoryPort } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardResponseDto } from '../dto/campaign-reward-response.dto';
import { toCampaignRewardResponseDto } from '../dto/campaign-reward-mapper';
import type { CampaignViewer } from './get-campaign-by-id.use-case';

export interface ListCampaignRewardsQuery {
  campaignId: string;
  viewer?: CampaignViewer | null;
}

@Injectable()
export class ListCampaignRewardsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
  ) {}

  public async execute(query: ListCampaignRewardsQuery): Promise<CampaignRewardResponseDto[]> {
    const campaign = await this.campaignRepository.findAccessById(query.campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${query.campaignId}" no encontrada.`);
    }

    if (!campaign.getStatus().isPublished()) {
      const viewer = query.viewer;
      const canView = !!viewer && (viewer.role === 'admin' || campaign.isOwnedBy(viewer.id));
      if (!canView) {
        throw new ForbiddenException('No tienes permiso para ver esta campaña.');
      }
    }

    const rewards = await this.campaignRewardRepository.findByCampaignId(campaign.getId());
    return rewards.map((reward) => toCampaignRewardResponseDto(reward));
  }
}
