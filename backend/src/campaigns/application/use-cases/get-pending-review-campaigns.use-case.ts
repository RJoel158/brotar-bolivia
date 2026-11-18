import { Inject, Injectable } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

@Injectable()
export class GetPendingReviewCampaignsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  public async execute(): Promise<CampaignResponseDto[]> {
    const campaigns = await this.campaignRepository.findAll({
      status: 'pending_review',
    });

    return campaigns
      .slice()
      .sort((a, b) => a.getCreatedAt().getTime() - b.getCreatedAt().getTime())
      .map(toCampaignResponseDto);
  }
}
