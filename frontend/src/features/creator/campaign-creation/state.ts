import {
  MAX_GOAL_AMOUNT,
  MAX_TITLE_LENGTH,
  MIN_GOAL_AMOUNT,
  MIN_SHORT_SUMMARY_LENGTH,
  MIN_TITLE_LENGTH,
  SHORT_SUMMARY_MAX_LENGTH,
  type CampaignCreationDraft,
  type CampaignPlanningDraft,
  type WizardStep,
} from './types.ts';
import { LETTER_PATTERN } from './planningValidation.ts';

export const INITIAL_PLANNING_DRAFT: CampaignPlanningDraft = {
  activities: [],
  budgetItems: [],
  rewards: [],
};

export const INITIAL_CAMPAIGN_DRAFT: CampaignCreationDraft = {
  campaignType: null,
  title: '',
  category: null,
  location: '',
  shortSummary: '',
  coverImage: null,
  problem: '',
  solution: '',
  beneficiaries: '',
  expectedImpact: '',
  impactIndicators: '',
  fundingModel: null,
  goalAmount: null,
};

export function canProceedStep1(draft: CampaignCreationDraft): boolean {
  return draft.campaignType !== null;
}

/** Trims and collapses repeated whitespace; this is the value sent to the API. */
export function normalizeCampaignTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ');
}

export function getCampaignTitleError(title: string): string | null {
  const normalized = normalizeCampaignTitle(title);
  if (!normalized) return 'El nombre del proyecto es obligatorio.';
  if (normalized.length < MIN_TITLE_LENGTH) {
    return `El título debe tener al menos ${MIN_TITLE_LENGTH} caracteres.`;
  }
  if (normalized.length > MAX_TITLE_LENGTH) {
    return `El título no puede exceder ${MAX_TITLE_LENGTH} caracteres.`;
  }
  if (!LETTER_PATTERN.test(normalized)) {
    return 'El título debe contener texto, no solo números o símbolos.';
  }
  return null;
}

export function canProceedStep2(draft: CampaignCreationDraft): boolean {
  const summaryLength = draft.shortSummary.trim().length;

  return (
    getCampaignTitleError(draft.title) === null &&
    draft.category !== null &&
    draft.location.trim().length > 0 &&
    summaryLength >= MIN_SHORT_SUMMARY_LENGTH &&
    summaryLength <= SHORT_SUMMARY_MAX_LENGTH
  );
}

export function canProceedStep5(draft: CampaignCreationDraft): boolean {
  return (
    draft.fundingModel !== null &&
    draft.goalAmount !== null &&
    draft.goalAmount >= MIN_GOAL_AMOUNT &&
    draft.goalAmount <= MAX_GOAL_AMOUNT
  );
}

export function canCreateCampaign(draft: CampaignCreationDraft): boolean {
  return canProceedStep1(draft) && canProceedStep2(draft) && canProceedStep5(draft);
}

export function getStepCompletionPercent(step: WizardStep): number {
  return Math.round((step / 8) * 1000) / 10;
}
