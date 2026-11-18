export interface UpdateCampaignDto {
  title?: string;
  category?: string;
  campaignType?: string;
  fundingModel?: string;
  goalAmount?: number;
  organizationId?: string | null;
  shortSummary?: string | null;
  coverImageUrl?: string | null;
  location?: string | null;
  currency?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  problem?: string | null;
  solution?: string | null;
  beneficiaries?: string | null;
  expectedImpact?: string | null;
  impactIndicators?: string | null;
}

export interface UpdateCampaignCommand {
  campaignId: string;
  authenticatedUserId: string;
  changes: UpdateCampaignDto;
}
