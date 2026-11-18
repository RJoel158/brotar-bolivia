import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_UPDATE_REPOSITORY_PORT } from '../ports/campaign-update.repository.port';
import type { CampaignUpdateRepositoryPort } from '../ports/campaign-update.repository.port';
import type { CampaignUpdateResponseDto } from '../dto/campaign-update-response.dto';

export interface GetCampaignUpdatesQuery {
  campaignId: string;
  user?: {
    id: string;
    role: string;
  } | null;
}

@Injectable()
export class GetCampaignUpdatesUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_UPDATE_REPOSITORY_PORT)
    private readonly campaignUpdateRepository: CampaignUpdateRepositoryPort,
  ) {}

  public async execute(query: GetCampaignUpdatesQuery): Promise<CampaignUpdateResponseDto[]> {
    const campaign = await this.campaignRepository.findAccessById(query.campaignId);
    if (!campaign) {
      throw new NotFoundException('La campaña especificada no existe.');
    }

    let canViewSupporterUpdates = false;

    if (query.user) {
      if (query.user.role === 'admin' || campaign.isOwnedBy(query.user.id)) {
        canViewSupporterUpdates = true;
      } else {
        canViewSupporterUpdates = await this.campaignUpdateRepository.isUserCampaignSupporter(
          query.campaignId,
          query.user.id,
        );
      }
    }

    const allowedVisibilities = canViewSupporterUpdates
      ? ['public', 'supporters_only']
      : ['public'];

    const items = await this.campaignUpdateRepository.findByCampaignId(
      query.campaignId,
      allowedVisibilities,
    );

    return items.map(({ update, authorName, authorAvatarUrl }) => ({
      id: update.getId(),
      campaignId: update.getCampaignId(),
      authorUserId: update.getAuthorUserId(),
      authorName,
      authorAvatarUrl,
      title: update.getTitle(),
      body: update.getBody(),
      imageUrl: update.getImageUrl(),
      visibility: update.getVisibility().getValue(),
      publishedAt: update.getPublishedAt()?.toISOString() ?? null,
      createdAt: update.getCreatedAt().toISOString(),
      updatedAt: update.getUpdatedAt().toISOString(),
    }));
  }
}
