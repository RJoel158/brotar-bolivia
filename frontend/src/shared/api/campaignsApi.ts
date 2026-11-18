import { apiClient } from './apiClient.ts';

export type CampaignCategory =
  | 'social'
  | 'ambiental'
  | 'productivo'
  | 'educacion'
  | 'salud'
  | 'cultura'
  | 'otro';

export type CampaignType = 'donation' | 'reward' | 'presale';

export type FundingModel = 'flexible' | 'all_or_nothing';

export type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'changes_requested'
  | 'rejected'
  | 'published'
  | 'completed'
  | 'cancelled';

export interface CampaignReviewSectionNotes {
  generalInfo?: string;
  storyImpact?: string;
  planBudget?: string;
  funding?: string;
  rewards?: string;
  cover?: string;
  other?: string;
}

export interface CampaignRewardResponse {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  minimumContribution: number;
  currency: string;
  /** Cupo total; `null` = ilimitado. No es la disponibilidad restante. */
  quantityTotal: number | null;
  /** Cupos adjudicados por aportes confirmados. */
  quantityClaimed: number;
  /** `null` = ilimitado. */
  quantityRemaining: number | null;
  isSoldOut: boolean;
  isActive: boolean;
  /** YYYY-MM-DD. */
  estimatedDeliveryOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRewardPayload {
  title: string;
  description: string;
  minimumContribution: number;
  /** `null` = ilimitado. */
  quantityTotal: number | null;
  /** YYYY-MM-DD. */
  estimatedDeliveryOn: string;
}

export interface CreateCampaignRewardRequest extends CampaignRewardPayload {
  /** UUID generado en el cliente: reintentar con el mismo id no duplica la recompensa. */
  id?: string;
}

export type CampaignReviewAction = 'approved' | 'rejected' | 'changes_requested';

export interface CampaignReviewHistoryItem {
  id: string;
  campaignId: string;
  reviewerUserId: string;
  reviewerFullName: string | null;
  reviewerEmail: string | null;
  action: CampaignReviewAction;
  reason: string | null;
  sectionNotes: CampaignReviewSectionNotes | null;
  createdAt: string;
}

export interface CampaignPlanActivity {
  id: string;
  name: string;
  description: string | null;
  /** Calendar date in YYYY-MM-DD format. */
  startDate: string;
  /** Calendar date in YYYY-MM-DD format. */
  endDate: string;
  status: string;
  progressPercent: number;
  displayOrder: number;
}

export interface CampaignPlanBudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface CampaignPlanResponse {
  campaignId: string;
  currency: string;
  goalAmount: number;
  totalBudget: number;
  exceedsGoal: boolean;
  activities: CampaignPlanActivity[];
  budgetItems: CampaignPlanBudgetItem[];
}

export interface SaveCampaignPlanRequest {
  activities: Array<{
    id?: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  }>;
  budgetItems: Array<{
    id?: string;
    category: string;
    description: string;
    amount: number;
  }>;
}

export interface CreateCampaignRequest {
  title: string;
  category: CampaignCategory;
  campaignType: CampaignType;
  fundingModel: FundingModel;
  goalAmount: number;
  organizationId?: string;
  shortSummary?: string;
  coverImageUrl?: string;
  location?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  problem?: string;
  solution?: string;
  beneficiaries?: string;
  expectedImpact?: string;
  impactIndicators?: string;
}

export type UpdateCampaignRequest = {
  title?: CreateCampaignRequest['title'];
  category?: CreateCampaignRequest['category'];
  campaignType?: CreateCampaignRequest['campaignType'];
  fundingModel?: CreateCampaignRequest['fundingModel'];
  goalAmount?: CreateCampaignRequest['goalAmount'];
  organizationId?: string;
  shortSummary?: string;
  coverImageUrl?: string;
  location?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  problem?: string;
  solution?: string;
  beneficiaries?: string;
  expectedImpact?: string;
  impactIndicators?: string;
};

export interface CampaignResponse {
  id: string;
  ownerUserId: string;
  organizationId: string | null;
  category: string;
  title: string;
  slug: string;
  location: string | null;
  shortSummary: string | null;
  coverImageUrl: string | null;
  campaignType: string;
  fundingModel: string;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  status: CampaignStatus | string;
  problem: string | null;
  solution: string | null;
  beneficiaries: string | null;
  expectedImpact: string | null;
  impactIndicators: string | null;
  reviewNotes: string | null;
  reviewRejectionReason: string | null;
  creatorName?: string | null;
  organizationName?: string | null;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CampaignCatalogPage { items: CampaignResponse[]; nextCursor: string | null; }

export const campaignsApi = {
  async create(payload: CreateCampaignRequest): Promise<CampaignResponse> {
    const { data } = await apiClient.post<CampaignResponse>('/campaigns', payload);
    return data;
  },

  async update(id: string, payload: UpdateCampaignRequest): Promise<CampaignResponse> {
    const { data } = await apiClient.patch<CampaignResponse>(`/campaigns/${id}`, payload);
    return data;
  },

  async getMine(): Promise<CampaignResponse[]> {
    const { data } = await apiClient.get<CampaignResponse[]>('/campaigns/me');
    return data;
  },

  async getById(id: string): Promise<CampaignResponse> {
    const { data } = await apiClient.get<CampaignResponse>(`/campaigns/${id}`);
    return data;
  },

  async home(signal?: AbortSignal): Promise<{ featured: CampaignResponse | null; categories: string[]; categoryCounts: Record<string, number>; projects: number; raised: string; progress: number; currency: string }> {
    const { data } = await apiClient.get('/campaigns/home', { signal });
    return data;
  },

  async listCatalog(params: { category?: string; query?: string; cursor?: string; limit?: number } = {}, signal?: AbortSignal): Promise<CampaignCatalogPage> {
    const { data } = await apiClient.get<CampaignCatalogPage>('/campaigns/catalog', { params, signal });
    return data;
  },

  async listPublic(category?: string): Promise<CampaignResponse[]> {
    const { data } = await apiClient.get<CampaignResponse[]>('/campaigns', {
      params: category ? { category } : undefined,
    });
    return data;
  },

  async getPlan(id: string): Promise<CampaignPlanResponse> {
    const { data } = await apiClient.get<CampaignPlanResponse>(`/campaigns/${id}/plan`);
    return data;
  },

  async savePlan(id: string, payload: SaveCampaignPlanRequest): Promise<CampaignPlanResponse> {
    const { data } = await apiClient.put<CampaignPlanResponse>(`/campaigns/${id}/plan`, payload);
    return data;
  },

  async submitReview(id: string): Promise<CampaignResponse> {
    const { data } = await apiClient.post<CampaignResponse>(`/campaigns/${id}/submit-review`);
    return data;
  },

  async listPendingReview(): Promise<CampaignResponse[]> {
    const { data } = await apiClient.get<CampaignResponse[]>('/campaigns/pending-review');
    return data;
  },

  async approve(
    id: string,
    payload?: { notes?: string; sectionNotes?: CampaignReviewSectionNotes },
  ): Promise<CampaignResponse> {
    const { data } = await apiClient.post<CampaignResponse>(`/campaigns/${id}/approve`, payload ?? {});
    return data;
  },

  async reject(
    id: string,
    payload: { rejectionReason: string; notes?: string; sectionNotes?: CampaignReviewSectionNotes },
  ): Promise<CampaignResponse> {
    const { data } = await apiClient.post<CampaignResponse>(`/campaigns/${id}/reject`, payload);
    return data;
  },

  async requestChanges(
    id: string,
    payload: { notes?: string; sectionNotes?: CampaignReviewSectionNotes },
  ): Promise<CampaignResponse> {
    const { data } = await apiClient.post<CampaignResponse>(`/campaigns/${id}/request-changes`, payload);
    return data;
  },

  async listReviews(id: string): Promise<CampaignReviewHistoryItem[]> {
    const { data } = await apiClient.get<CampaignReviewHistoryItem[]>(`/campaigns/${id}/reviews`);
    return data;
  },

  async publish(id: string): Promise<CampaignResponse> {
    const { data } = await apiClient.post<CampaignResponse>(`/campaigns/${id}/publish`);
    return data;
  },

  async uploadCoverImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ url: string }>('/campaigns/cover-image', formData);
    return data.url;
  },

  async listRewards(campaignId: string): Promise<CampaignRewardResponse[]> {
    const { data } = await apiClient.get<CampaignRewardResponse[]>(
      `/campaigns/${campaignId}/rewards`,
    );
    return data;
  },

  async createReward(
    campaignId: string,
    payload: CreateCampaignRewardRequest,
  ): Promise<CampaignRewardResponse> {
    const { data } = await apiClient.post<CampaignRewardResponse>(
      `/campaigns/${campaignId}/rewards`,
      payload,
    );
    return data;
  },

  async updateReward(
    campaignId: string,
    rewardId: string,
    payload: Partial<CampaignRewardPayload>,
  ): Promise<CampaignRewardResponse> {
    const { data } = await apiClient.patch<CampaignRewardResponse>(
      `/campaigns/${campaignId}/rewards/${rewardId}`,
      payload,
    );
    return data;
  },

  async deleteReward(campaignId: string, rewardId: string): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}/rewards/${rewardId}`);
  },

  async setRewardActive(
    campaignId: string,
    rewardId: string,
    isActive: boolean,
  ): Promise<CampaignRewardResponse> {
    const { data } = await apiClient.patch<CampaignRewardResponse>(
      `/campaigns/${campaignId}/rewards/${rewardId}/active`,
      { isActive },
    );
    return data;
  },

  async getUpdates(campaignId: string): Promise<CampaignUpdateItem[]> {
    const { data } = await apiClient.get<CampaignUpdateItem[]>(`/campaigns/${campaignId}/updates`);
    return data;
  },

  async createUpdate(
    campaignId: string,
    payload: CreateCampaignUpdatePayload,
  ): Promise<CampaignUpdateItem> {
    const { data } = await apiClient.post<CampaignUpdateItem>(
      `/campaigns/${campaignId}/updates`,
      payload,
    );
    return data;
  },

  async deleteUpdate(campaignId: string, updateId: string): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}/updates/${updateId}`);
  },

  async listMyBookmarks(): Promise<CampaignBookmarkItem[]> {
    const { data } = await apiClient.get<CampaignBookmarkItem[]>('/campaigns/me/bookmarks');
    return data;
  },

  async listMyBookmarkIds(): Promise<string[]> {
    const { data } = await apiClient.get<{ campaignIds: string[] }>('/campaigns/me/bookmark-ids');
    return data.campaignIds;
  },

  async addBookmark(campaignId: string): Promise<CampaignBookmarkItem> {
    const { data } = await apiClient.post<CampaignBookmarkItem>(
      `/campaigns/${campaignId}/bookmarks`,
    );
    return data;
  },

  async removeBookmark(campaignId: string): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}/bookmarks`);
  },

  async getFeed(limit = 20): Promise<SocialFeedPost[]> {
    const { data } = await apiClient.get<SocialFeedPost[]>(`/campaigns/feed?limit=${limit}`);
    return data;
  },

  async getStories(limit = 15): Promise<CampaignStoryItem[]> {
    const { data } = await apiClient.get<CampaignStoryItem[]>(`/campaigns/stories?limit=${limit}`);
    return data;
  },

  async getSuggested(limit = 5): Promise<CampaignResponse[]> {
    const { data } = await apiClient.get<CampaignResponse[]>(`/campaigns/suggested?limit=${limit}`);
    return data;
  },
};

export interface CampaignUpdateItem {
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

export interface CreateCampaignUpdatePayload {
  title: string;
  body: string;
  imageUrl?: string | null;
  visibility?: 'public' | 'supporters_only';
}

export interface SocialFeedCreator {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  location?: string | null;
  isVerified: boolean;
}

export interface SocialFeedMetrics {
  goalAmount: number;
  currentAmount: number;
  currency: string;
  percentage: number;
  backersCount: number;
  daysRemaining?: number;
}

export interface SocialFeedPost {
  id: string;
  type: 'update' | 'campaign_spotlight';
  campaignId: string;
  campaignTitle: string;
  campaignCategory: string;
  campaignSlug: string;
  creator: SocialFeedCreator;
  title: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  metrics: SocialFeedMetrics;
  likesCount: number;
  commentsCount: number;
}

export interface CampaignStoryItem {
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

export interface CampaignBookmarkItem {
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

