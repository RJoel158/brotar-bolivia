import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import {
  CAMPAIGN_REVIEW_REPOSITORY_PORT,
  type CampaignReviewRecord,
  type CampaignReviewRepositoryPort,
} from '../ports/campaign-review.repository.port';

export interface CampaignReviewHistoryItemDto {
  id: string;
  campaignId: string;
  reviewerUserId: string;
  reviewerFullName: string | null;
  reviewerEmail: string | null;
  action: CampaignReviewRecord['action'];
  reason: string | null;
  sectionNotes: CampaignReviewRecord['sectionNotes'];
  createdAt: string;
}

@Injectable()
export class GetCampaignReviewsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REVIEW_REPOSITORY_PORT)
    private readonly campaignReviewRepository: CampaignReviewRepositoryPort,
  ) {}

  public async execute(campaignId: string): Promise<CampaignReviewHistoryItemDto[]> {
    const campaign = await this.campaignRepository.findAccessById(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${campaignId}" no encontrada.`);
    }

    const reviews = await this.campaignReviewRepository.findByCampaignId(campaignId);
    return reviews.map((review) => ({
      id: review.id,
      campaignId: review.campaignId,
      reviewerUserId: review.reviewerUserId,
      reviewerFullName: review.reviewerFullName,
      reviewerEmail: review.reviewerEmail,
      action: review.action,
      reason: review.reason,
      sectionNotes: review.sectionNotes,
      createdAt: review.createdAt.toISOString(),
    }));
  }
}
