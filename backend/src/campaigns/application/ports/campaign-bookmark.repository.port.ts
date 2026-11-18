export const CAMPAIGN_BOOKMARK_REPOSITORY_PORT = Symbol('CAMPAIGN_BOOKMARK_REPOSITORY_PORT');

export type BookmarkKind = 'FAVORITE' | 'FOLLOW';

export interface CampaignBookmarkRecord {
  id: string;
  userId: string;
  campaignId: string;
  kind: BookmarkKind;
  createdAt: Date;
  campaignTitle: string;
  campaignSlug: string;
  campaignCoverImageUrl: string | null;
  campaignStatus: string;
  campaignGoalAmount: number;
  campaignCurrentAmount: number;
  campaignCurrency: string;
  latestUpdateTitle: string | null;
  latestUpdateAt: Date | null;
}

export interface CampaignBookmarkRepositoryPort {
  upsert(userId: string, campaignId: string, kind?: BookmarkKind): Promise<CampaignBookmarkRecord>;
  remove(userId: string, campaignId: string, kind?: BookmarkKind): Promise<boolean>;
  listByUserId(userId: string, kind?: BookmarkKind): Promise<CampaignBookmarkRecord[]>;
  exists(userId: string, campaignId: string, kind?: BookmarkKind): Promise<boolean>;
  listCampaignIdsByUserId(userId: string, kind?: BookmarkKind): Promise<string[]>;
}
