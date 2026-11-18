export interface CampaignStoryItemDto {
  id: string;
  campaignId: string;
  campaignTitle: string;
  creatorName: string;
  creatorAvatarUrl?: string | null;
  coverImageUrl?: string | null;
  category: string;
  isUnread?: boolean;
  latestUpdateTitle?: string;
  latestUpdateBody?: string | null;
  latestUpdateImageUrl?: string | null;
  progressPercentage: number;
  createdAt?: string;
}


