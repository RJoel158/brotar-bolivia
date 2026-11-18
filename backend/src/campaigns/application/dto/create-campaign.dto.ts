export interface CreateCampaignDto {
  title: string;
  category: string;
  campaignType: string;
  fundingModel: string;
  goalAmount: number;
  ownerUserId: string;
  organizationId?: string;
  shortSummary?: string;
  coverImageUrl?: string;
  location?: string;
  currency?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  problem?: string;
  solution?: string;
  beneficiaries?: string;
  expectedImpact?: string;
  impactIndicators?: string;
}
