import type { PlanActivityInput, PlanBudgetItemInput } from '../../domain/entities/campaign-plan.entity';

export interface SaveCampaignPlanCommand {
  campaignId: string;
  authenticatedUserId: string;
  activities: PlanActivityInput[];
  budgetItems: PlanBudgetItemInput[];
}

export interface CampaignPlanActivityDto {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  progressPercent: number;
  displayOrder: number;
}

export interface CampaignPlanBudgetItemDto {
  id: string;
  category: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface CampaignPlanResponseDto {
  campaignId: string;
  currency: string;
  goalAmount: number;
  totalBudget: number;
  exceedsGoal: boolean;
  activities: CampaignPlanActivityDto[];
  budgetItems: CampaignPlanBudgetItemDto[];
}
