export interface CampaignUpdateResponseDto {
  id: string;
  campaignId: string;
  authorUserId: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  title: string;
  body: string;
  imageUrl: string | null;
  visibility: 'public' | 'supporters_only';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
