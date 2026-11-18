import { Campaign } from '../../domain/entities/campaign.entity';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';

function toIsoOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function toCampaignResponseDto(campaign: Campaign): CampaignResponseDto {
  return {
    id: campaign.getId(),
    ownerUserId: campaign.getOwnerUserId(),
    organizationId: campaign.getOrganizationId(),
    category: campaign.getCategory(),
    title: campaign.getTitle(),
    slug: campaign.getSlug(),
    location: campaign.getLocation(),
    shortSummary: campaign.getShortSummary(),
    coverImageUrl: campaign.getCoverImageUrl(),
    campaignType: campaign.getCampaignType(),
    fundingModel: campaign.getFundingModel(),
    goalAmount: campaign.getGoalAmount(),
    currentAmount: campaign.getCurrentAmount(),
    currency: campaign.getCurrency(),
    startDate: toIsoOrNull(campaign.getStartDate()),
    endDate: toIsoOrNull(campaign.getEndDate()),
    status: campaign.getStatus().getValue(),
    problem: campaign.getProblem(),
    solution: campaign.getSolution(),
    beneficiaries: campaign.getBeneficiaries(),
    expectedImpact: campaign.getExpectedImpact(),
    impactIndicators: campaign.getImpactIndicators(),
    reviewNotes: campaign.getReviewNotes(),
    reviewRejectionReason: campaign.getReviewRejectionReason(),
    creatorName: campaign.getCreatorName(),
    organizationName: campaign.getOrganizationName(),
    progressPercentage: campaign.getProgressPercentage(),
    createdAt: campaign.getCreatedAt().toISOString(),
    updatedAt: campaign.getUpdatedAt().toISOString(),
    publishedAt: toIsoOrNull(campaign.getPublishedAt()),
  };
}
