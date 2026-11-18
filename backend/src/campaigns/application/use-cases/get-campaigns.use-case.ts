import { Inject, Injectable } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { FilterCampaignsDto } from '../dto/filter-campaigns.dto';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

@Injectable()
export class GetCampaignsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  public async execute(filter?: FilterCampaignsDto): Promise<CampaignResponseDto[]> {
    const campaigns = await this.campaignRepository.findAll(filter);
    return campaigns.map(toCampaignResponseDto);
  }
}
