import { Campaign as PrismaCampaign, Prisma } from '@prisma/client';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignStatus } from '../../domain/value-objects/campaign-status.vo';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';
import type { CampaignCategoryType } from '../../domain/value-objects/campaign-category.vo';
import type { CampaignTypeValue } from '../../domain/value-objects/campaign-type.vo';
import type { FundingModelType } from '../../domain/value-objects/funding-model.vo';

function decimalToNumber(value: Prisma.Decimal | number): number {
  if (typeof value === 'number') {
    return value;
  }
  return value.toNumber();
}

export type PrismaCampaignWithRelations = PrismaCampaign & {
  users?: { full_name?: string | null; organization_name?: string | null } | null;
  organizations?: { legal_name?: string | null } | null;
};

export type PrismaCampaignAccessRow = Pick<
  PrismaCampaign,
  'id' | 'owner_user_id' | 'status' | 'campaign_type' | 'currency' | 'goal_amount'
>;

export class PrismaCampaignMapper {
  public static toAccess(raw: PrismaCampaignAccessRow): CampaignAccess {
    return CampaignAccess.reconstitute({
      id: raw.id,
      ownerUserId: raw.owner_user_id,
      status: CampaignStatus.fromString(raw.status),
      campaignType: raw.campaign_type as CampaignTypeValue,
      currency: raw.currency,
      goalAmount: decimalToNumber(raw.goal_amount),
    });
  }

  public static toDomain(raw: PrismaCampaignWithRelations): Campaign {
    const creatorName = raw.users?.full_name ?? null;
    const organizationName = raw.organizations?.legal_name ?? raw.users?.organization_name ?? null;

    return Campaign.reconstitute({
      id: raw.id,
      ownerUserId: raw.owner_user_id,
      organizationId: raw.organization_id,
      category: raw.category as CampaignCategoryType,
      title: raw.title,
      slug: raw.slug,
      location: raw.location,
      shortSummary: raw.short_summary,
      coverImageUrl: raw.cover_image_url,
      campaignType: raw.campaign_type as CampaignTypeValue,
      fundingModel: raw.funding_model as FundingModelType,
      goalAmount: decimalToNumber(raw.goal_amount),
      currentAmount: decimalToNumber(raw.current_amount),
      currency: raw.currency,
      startDate: raw.start_date,
      endDate: raw.end_date,
      status: CampaignStatus.fromString(raw.status),
      problem: raw.problem,
      solution: raw.solution,
      beneficiaries: raw.beneficiaries,
      expectedImpact: raw.expected_impact,
      impactIndicators: raw.impact_indicators,
      reviewNotes: raw.review_notes ?? null,
      reviewRejectionReason: raw.review_rejection_reason ?? null,
      creatorName,
      organizationName,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      publishedAt: raw.published_at,
    });
  }

  public static toPersistence(campaign: Campaign): Prisma.CampaignUncheckedCreateInput {
    return {
      id: campaign.getId(),
      owner_user_id: campaign.getOwnerUserId(),
      organization_id: campaign.getOrganizationId(),
      category: campaign.getCategory(),
      title: campaign.getTitle(),
      slug: campaign.getSlug(),
      location: campaign.getLocation(),
      short_summary: campaign.getShortSummary(),
      cover_image_url: campaign.getCoverImageUrl(),
      campaign_type: campaign.getCampaignType(),
      funding_model: campaign.getFundingModel(),
      goal_amount: campaign.getGoalAmount(),
      current_amount: campaign.getCurrentAmount(),
      currency: campaign.getCurrency(),
      start_date: campaign.getStartDate(),
      end_date: campaign.getEndDate(),
      status: campaign.getStatus().getValue(),
      problem: campaign.getProblem(),
      solution: campaign.getSolution(),
      beneficiaries: campaign.getBeneficiaries(),
      expected_impact: campaign.getExpectedImpact(),
      impact_indicators: campaign.getImpactIndicators(),
      review_notes: campaign.getReviewNotes(),
      review_rejection_reason: campaign.getReviewRejectionReason(),
      created_at: campaign.getCreatedAt(),
      updated_at: campaign.getUpdatedAt(),
      published_at: campaign.getPublishedAt(),
    };
  }

  public static toUpdatePersistence(
    campaign: Campaign,
  ): Prisma.CampaignUncheckedUpdateInput {
    const data = this.toPersistence(campaign);
    const { id: _id, ...updateData } = data;
    return updateData;
  }
}
