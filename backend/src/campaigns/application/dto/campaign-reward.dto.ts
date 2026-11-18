export interface CreateCampaignRewardDto {
  /**
   * Optional client-generated UUID. Repeating a create with the same id for
   * the same campaign returns the stored reward instead of a duplicate.
   */
  id?: string;
  campaignId: string;
  authenticatedUserId: string;
  title: string;
  description: string;
  minimumContribution: number;
  /** `null` means unlimited availability. */
  quantityTotal: number | null;
  /** YYYY-MM-DD. */
  estimatedDeliveryOn: string;
}

/** Omitted fields are kept as stored. */
export interface UpdateCampaignRewardDto {
  title?: string;
  description?: string;
  minimumContribution?: number;
  quantityTotal?: number | null;
  estimatedDeliveryOn?: string;
}

export interface UpdateCampaignRewardCommand {
  campaignId: string;
  rewardId: string;
  authenticatedUserId: string;
  changes: UpdateCampaignRewardDto;
}

export interface DeleteCampaignRewardCommand {
  campaignId: string;
  rewardId: string;
  authenticatedUserId: string;
}
