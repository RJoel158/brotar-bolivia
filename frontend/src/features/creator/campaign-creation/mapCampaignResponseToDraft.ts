import type { CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import type {
  CampaignCategoryValue,
  CampaignCreationDraft,
  CampaignTypeValue,
  FundingModelValue,
} from './types.ts';

const CAMPAIGN_TYPES: ReadonlyArray<CampaignTypeValue> = ['donation', 'reward', 'presale'];
const CATEGORIES: ReadonlyArray<CampaignCategoryValue> = [
  'social',
  'ambiental',
  'productivo',
  'educacion',
  'salud',
  'cultura',
  'otro',
];
const FUNDING_MODELS: ReadonlyArray<FundingModelValue> = ['flexible', 'all_or_nothing'];

function asCampaignType(value: string): CampaignTypeValue | null {
  return CAMPAIGN_TYPES.includes(value as CampaignTypeValue)
    ? (value as CampaignTypeValue)
    : null;
}

function asCategory(value: string): CampaignCategoryValue | null {
  return CATEGORIES.includes(value as CampaignCategoryValue)
    ? (value as CampaignCategoryValue)
    : null;
}

function asFundingModel(value: string): FundingModelValue | null {
  return FUNDING_MODELS.includes(value as FundingModelValue)
    ? (value as FundingModelValue)
    : null;
}

export function mapCampaignResponseToDraft(
  campaign: CampaignResponse,
): CampaignCreationDraft {
  return {
    campaignType: asCampaignType(campaign.campaignType),
    title: campaign.title ?? '',
    category: asCategory(campaign.category),
    location: campaign.location ?? '',
    shortSummary: campaign.shortSummary ?? '',
    coverImage: null,
    problem: campaign.problem ?? '',
    solution: campaign.solution ?? '',
    beneficiaries: campaign.beneficiaries ?? '',
    expectedImpact: campaign.expectedImpact ?? '',
    impactIndicators: campaign.impactIndicators ?? '',
    fundingModel: asFundingModel(campaign.fundingModel),
    goalAmount: typeof campaign.goalAmount === 'number' ? campaign.goalAmount : null,
  };
}
