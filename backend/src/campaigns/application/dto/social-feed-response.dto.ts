export interface SocialFeedCreatorDto {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  location?: string | null;
  isVerified: boolean;
}

export interface SocialFeedMetricsDto {
  goalAmount: number;
  currentAmount: number;
  currency: string;
  percentage: number;
  backersCount: number;
  daysRemaining?: number;
}

export interface SocialFeedPostDto {
  id: string;
  type: 'update' | 'campaign_spotlight';
  campaignId: string;
  campaignTitle: string;
  campaignCategory: string;
  campaignSlug: string;
  creator: SocialFeedCreatorDto;
  title: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  metrics: SocialFeedMetricsDto;
  likesCount: number;
  commentsCount: number;
}
