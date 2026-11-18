import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

export interface CampaignViewer {
  id: string;
  role: string;
}

@Injectable()
export class GetCampaignByIdUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  public async execute(
    id: string,
    viewer?: CampaignViewer | null,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${id}" no encontrada.`);
    }

    if (campaign.getStatus().isPublished()) {
      return toCampaignResponseDto(campaign);
    }

    if (!viewer) {
      throw new ForbiddenException('No tienes permiso para ver esta campaña.');
    }

    const isOwner = campaign.isOwnedBy(viewer.id);
    const isAdmin = viewer.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para ver esta campaña.');
    }

    return toCampaignResponseDto(campaign);
  }
}
