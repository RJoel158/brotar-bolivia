export interface CreateCampaignUpdateDto {
  campaignId: string;
  authorUserId: string;
  authorRole?: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  visibility?: 'public' | 'supporters_only';
}
