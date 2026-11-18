import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignUpdate } from '../../domain/entities/campaign-update.entity';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_UPDATE_REPOSITORY_PORT } from '../ports/campaign-update.repository.port';
import type { CampaignUpdateRepositoryPort } from '../ports/campaign-update.repository.port';
import type { CreateCampaignUpdateDto } from '../dto/create-campaign-update.dto';
import type { CampaignUpdateResponseDto } from '../dto/campaign-update-response.dto';

@Injectable()
export class CreateCampaignUpdateUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_UPDATE_REPOSITORY_PORT)
    private readonly campaignUpdateRepository: CampaignUpdateRepositoryPort,
  ) {}

  public async execute(dto: CreateCampaignUpdateDto): Promise<CampaignUpdateResponseDto> {
    const campaign = await this.campaignRepository.findAccessById(dto.campaignId);
    if (!campaign) {
      throw new NotFoundException('La campaña especificada no existe.');
    }

    const isOwner = campaign.isOwnedBy(dto.authorUserId);
    const isAdmin = dto.authorRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Solo el creador de la campaña puede publicar actualizaciones.');
    }

    let update: CampaignUpdate;
    try {
      update = CampaignUpdate.create({
        campaignId: dto.campaignId,
        authorUserId: dto.authorUserId,
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl?.trim() || null,
        visibility: dto.visibility,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const saved = await this.campaignUpdateRepository.save(update);

    return {
      id: saved.getId(),
      campaignId: saved.getCampaignId(),
      authorUserId: saved.getAuthorUserId(),
      title: saved.getTitle(),
      body: saved.getBody(),
      imageUrl: saved.getImageUrl(),
      visibility: saved.getVisibility().getValue(),
      publishedAt: saved.getPublishedAt()?.toISOString() ?? null,
      createdAt: saved.getCreatedAt().toISOString(),
      updatedAt: saved.getUpdatedAt().toISOString(),
    };
  }
}
