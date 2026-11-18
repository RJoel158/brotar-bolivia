import type { CreateCampaignRequest, UpdateCampaignRequest } from '../../../shared/api/campaignsApi.ts';
import { MIN_GOAL_AMOUNT, MAX_GOAL_AMOUNT, MIN_SHORT_SUMMARY_LENGTH } from './types.ts';
import type { CampaignCreationDraft } from './types.ts';
import { getCampaignTitleError, normalizeCampaignTitle } from './state.ts';

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export interface BuildCampaignRequestOptions {
  /** Persistable cover URL after a successful upload. */
  coverImageUrl?: string | null;
  /** Send empty coverImageUrl to clear a previously stored image. */
  clearCover?: boolean;
}

export function buildCreateCampaignRequest(
  draft: CampaignCreationDraft,
  options: BuildCampaignRequestOptions = {},
): CreateCampaignRequest | null {
  if (
    draft.campaignType === null ||
    draft.category === null ||
    draft.fundingModel === null ||
    draft.goalAmount === null
  ) {
    return null;
  }

  if (getCampaignTitleError(draft.title) !== null) {
    return null;
  }
  const title = normalizeCampaignTitle(draft.title);

  if (draft.goalAmount < MIN_GOAL_AMOUNT || draft.goalAmount > MAX_GOAL_AMOUNT) {
    return null;
  }

  const request: CreateCampaignRequest = {
    title,
    category: draft.category,
    campaignType: draft.campaignType,
    fundingModel: draft.fundingModel,
    goalAmount: draft.goalAmount,
  };

  const location = optionalText(draft.location);
  if (location) {
    request.location = location;
  }

  const shortSummary = optionalText(draft.shortSummary);
  if (shortSummary && shortSummary.length >= MIN_SHORT_SUMMARY_LENGTH) {
    request.shortSummary = shortSummary;
  }

  if (options.coverImageUrl) {
    request.coverImageUrl = options.coverImageUrl;
  } else if (options.clearCover) {
    request.coverImageUrl = '';
  }

  const problem = optionalText(draft.problem);
  if (problem) {
    request.problem = problem;
  }

  const solution = optionalText(draft.solution);
  if (solution) {
    request.solution = solution;
  }

  const beneficiaries = optionalText(draft.beneficiaries);
  if (beneficiaries) {
    request.beneficiaries = beneficiaries;
  }

  const expectedImpact = optionalText(draft.expectedImpact);
  if (expectedImpact) {
    request.expectedImpact = expectedImpact;
  }

  const impactIndicators = optionalText(draft.impactIndicators);
  if (impactIndicators) {
    request.impactIndicators = impactIndicators;
  }

  return request;
}

export function buildUpdateCampaignRequest(
  draft: CampaignCreationDraft,
  options: BuildCampaignRequestOptions = {},
): UpdateCampaignRequest | null {
  return buildCreateCampaignRequest(draft, options);
}
