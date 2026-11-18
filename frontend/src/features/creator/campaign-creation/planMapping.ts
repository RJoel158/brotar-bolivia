import type {
  CampaignPlanResponse,
  SaveCampaignPlanRequest,
} from '../../../shared/api/campaignsApi.ts';
import type { CampaignPlanningDraft } from './types.ts';

export function mapPlanResponseToPlanning(
  plan: CampaignPlanResponse,
): Pick<CampaignPlanningDraft, 'activities' | 'budgetItems'> {
  return {
    activities: plan.activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      description: activity.description ?? '',
      startDate: activity.startDate,
      endDate: activity.endDate,
    })),
    budgetItems: plan.budgetItems.map((item) => ({
      id: item.id,
      category: item.category,
      concept: item.description,
      amount: item.amount,
    })),
  };
}

export function buildSavePlanRequest(planning: CampaignPlanningDraft): SaveCampaignPlanRequest {
  return {
    activities: planning.activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      description: activity.description || undefined,
      startDate: activity.startDate,
      endDate: activity.endDate,
    })),
    budgetItems: planning.budgetItems.map((item) => ({
      id: item.id,
      category: item.category,
      description: item.concept,
      amount: item.amount,
    })),
  };
}
