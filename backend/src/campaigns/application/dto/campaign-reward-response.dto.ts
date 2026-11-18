export interface CampaignRewardResponseDto {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  minimumContribution: number;
  /** Copied from the campaign when the reward was created. */
  currency: string;
  /** Total slots. `null` means unlimited. Not the remaining availability. */
  quantityTotal: number | null;
  /** Slots claimed by confirmed contributions. */
  quantityClaimed: number;
  /** `quantityTotal - quantityClaimed`, or `null` when unlimited. */
  quantityRemaining: number | null;
  isSoldOut: boolean;
  isActive: boolean;
  /** YYYY-MM-DD. */
  estimatedDeliveryOn: string;
  createdAt: string;
  updatedAt: string;
}
