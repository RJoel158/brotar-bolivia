import type { CampaignBookmarkRecord } from '../ports/campaign-bookmark.repository.port';
import type { CampaignBookmarkResponseDto } from './campaign-bookmark.dto';

export function toBookmarkResponse(record: CampaignBookmarkRecord): CampaignBookmarkResponseDto {
  const goal = record.campaignGoalAmount > 0 ? record.campaignGoalAmount : 1;
  const progressPercentage = Math.min(
    100,
    Math.round((record.campaignCurrentAmount / goal) * 100),
  );

  return {
    id: record.id,
    userId: record.userId,
    campaignId: record.campaignId,
    kind: record.kind,
    createdAt: record.createdAt.toISOString(),
    campaignTitle: record.campaignTitle,
    campaignSlug: record.campaignSlug,
    campaignCoverImageUrl: record.campaignCoverImageUrl,
    campaignStatus: record.campaignStatus,
    campaignGoalAmount: record.campaignGoalAmount,
    campaignCurrentAmount: record.campaignCurrentAmount,
    campaignCurrency: record.campaignCurrency,
    progressPercentage,
    latestUpdateTitle: record.latestUpdateTitle,
    latestUpdateAt: record.latestUpdateAt?.toISOString() ?? null,
  };
}
