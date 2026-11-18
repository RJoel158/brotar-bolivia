import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

@Injectable()
export class PublishCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  public async execute(campaignId: string): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findById(campaignId);

    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${campaignId}" no encontrada.`);
    }

    try {
      campaign.publish();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo publicar la campaña.';
      throw new ConflictException(message);
    }

    const saved = await this.campaignRepository.update(campaign);
    return toCampaignResponseDto(saved);
  }
}
