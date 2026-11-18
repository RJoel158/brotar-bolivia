export interface CampaignBookmarkResponseDto {
  id: string;
  userId: string;
  campaignId: string;
  kind: 'FAVORITE' | 'FOLLOW';
  createdAt: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignCoverImageUrl: string | null;
  campaignStatus: string;
  campaignGoalAmount: number;
  campaignCurrentAmount: number;
  campaignCurrency: string;
  progressPercentage: number;
  latestUpdateTitle: string | null;
  latestUpdateAt: string | null;
}
