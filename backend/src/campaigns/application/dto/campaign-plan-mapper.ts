import type { CampaignPlan } from '../../domain/entities/campaign-plan.entity';
import type { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';
import type { CampaignPlanResponseDto } from './campaign-plan.dto';

export function toCampaignPlanResponseDto(
  plan: CampaignPlan,
  campaign: CampaignAccess,
): CampaignPlanResponseDto {
  const goalAmount = campaign.getGoalAmount();
  return {
    campaignId: plan.getCampaignId(),
    currency: campaign.getCurrency(),
    goalAmount,
    totalBudget: plan.getTotalBudget(),
    exceedsGoal: plan.exceedsGoal(goalAmount),
    activities: plan.getActivities().map((activity) => ({
      id: activity.id ?? '',
      name: activity.name,
      description: activity.description,
      startDate: activity.startDate,
      endDate: activity.endDate,
      status: activity.status,
      progressPercent: activity.progressPercent,
      displayOrder: activity.displayOrder,
    })),
    budgetItems: plan.getBudgetItems().map((item) => ({
      id: item.id ?? '',
      category: item.category,
      description: item.description,
      amount: item.amount,
      displayOrder: item.displayOrder,
    })),
  };
}
