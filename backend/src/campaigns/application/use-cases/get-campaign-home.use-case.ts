import { Inject, Injectable } from '@nestjs/common';
import { CAMPAIGN_HOME_PORT } from '../ports/campaign-home.repository.port';
import type { CampaignHomeRepositoryPort } from '../ports/campaign-home.repository.port';
import { toCampaignResponseDto } from '../dto/campaign-mapper';
@Injectable()
export class GetCampaignHomeUseCase {
  constructor(@Inject(CAMPAIGN_HOME_PORT) private readonly repository: CampaignHomeRepositoryPort) {}
  async execute() {
    const data = await this.repository.getSummary();
    return { ...data, featured: data.featured ? toCampaignResponseDto(data.featured) : null };
  }
}
