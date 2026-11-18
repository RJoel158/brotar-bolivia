import { CampaignPlanValidationRules } from '../rules/campaign-plan-validation.rules';

export type ProgressStatusValue = 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

export interface PlanActivity {
  /** `null` for activities that have not been persisted yet. */
  id: string | null;
  name: string;
  description: string | null;
  /** Calendar date in YYYY-MM-DD format. */
  startDate: string;
  /** Calendar date in YYYY-MM-DD format. */
  endDate: string;
  status: ProgressStatusValue;
  progressPercent: number;
  displayOrder: number;
}

export interface PlanBudgetItem {
  /** `null` for items that have not been persisted yet. */
  id: string | null;
  category: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface PlanActivityInput {
  id?: string | null;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
}

export interface PlanBudgetItemInput {
  id?: string | null;
  category: string;
  description: string;
  amount: number;
}

export interface CreateCampaignPlanProps {
  campaignId: string;
  activities: PlanActivityInput[];
  budgetItems: PlanBudgetItemInput[];
}

export interface RestoreCampaignPlanProps {
  campaignId: string;
  activities: PlanActivity[];
  budgetItems: PlanBudgetItem[];
}

export class CampaignPlan {
  private constructor(
    private readonly campaignId: string,
    private readonly activities: ReadonlyArray<PlanActivity>,
    private readonly budgetItems: ReadonlyArray<PlanBudgetItem>,
  ) {}

  /**
   * Builds a plan from creator input. Throws `Error` with a user-facing message
   * when any activity or budget item is invalid. Display order follows the
   * order of the input arrays.
   */
  public static create(props: CreateCampaignPlanProps): CampaignPlan {
    CampaignPlanValidationRules.validateActivityCount(props.activities.length);
    CampaignPlanValidationRules.validateBudgetItemCount(props.budgetItems.length);

    const activities = props.activities.map((input, index): PlanActivity => {
      const position = index + 1;
      CampaignPlanValidationRules.validateActivityName(input.name, position);
      CampaignPlanValidationRules.validateActivityDescription(input.description ?? null, position);
      CampaignPlanValidationRules.validateActivityDates(input.startDate, input.endDate, position);
      return {
        id: input.id ?? null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'planned',
        progressPercent: 0,
        displayOrder: index,
      };
    });

    const budgetItems = props.budgetItems.map((input, index): PlanBudgetItem => {
      const position = index + 1;
      CampaignPlanValidationRules.validateBudgetCategory(input.category, position);
      CampaignPlanValidationRules.validateBudgetDescription(input.description, position);
      CampaignPlanValidationRules.validateBudgetAmount(input.amount, position);
      return {
        id: input.id ?? null,
        category: input.category,
        description: input.description.trim(),
        amount: input.amount,
        displayOrder: index,
      };
    });

    return new CampaignPlan(props.campaignId, activities, budgetItems);
  }

  public static restore(props: RestoreCampaignPlanProps): CampaignPlan {
    return new CampaignPlan(props.campaignId, props.activities, props.budgetItems);
  }

  public getCampaignId(): string {
    return this.campaignId;
  }

  public getActivities(): ReadonlyArray<PlanActivity> {
    return this.activities;
  }

  public getBudgetItems(): ReadonlyArray<PlanBudgetItem> {
    return this.budgetItems;
  }

  /** Sum in cents to avoid floating point drift on decimal amounts. */
  public getTotalBudget(): number {
    const cents = this.budgetItems.reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
    return cents / 100;
  }

  public exceedsGoal(goalAmount: number): boolean {
    return goalAmount > 0 && this.getTotalBudget() > goalAmount;
  }
}
