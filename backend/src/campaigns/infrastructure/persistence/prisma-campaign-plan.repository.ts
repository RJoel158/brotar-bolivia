import { Injectable } from '@nestjs/common';
import type { campaign_activities, campaign_budgets } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { CampaignPlanRepositoryPort } from '../../application/ports/campaign-plan.repository.port';
import {
  CampaignPlan,
  type PlanActivity,
  type PlanBudgetItem,
} from '../../domain/entities/campaign-plan.entity';

const PLAN_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function fromDbDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : '';
}

function toPlanActivity(record: campaign_activities): PlanActivity {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    startDate: fromDbDate(record.planned_start_on),
    endDate: fromDbDate(record.planned_end_on),
    status: record.status,
    progressPercent: record.progress_percent,
    displayOrder: record.display_order,
  };
}

function toPlanBudgetItem(record: campaign_budgets): PlanBudgetItem {
  return {
    id: record.id,
    category: record.category,
    description: record.description,
    amount: Number(record.planned_amount),
    displayOrder: record.display_order,
  };
}

@Injectable()
export class PrismaCampaignPlanRepository implements CampaignPlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async findByCampaignId(campaignId: string): Promise<CampaignPlan> {
    const [activities, budgetItems] = await Promise.all([
      this.prisma.campaign_activities.findMany({
        where: { campaign_id: campaignId },
        orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
      }),
      this.prisma.campaign_budgets.findMany({
        where: { campaign_id: campaignId },
        orderBy: { display_order: 'asc' },
      }),
    ]);

    return CampaignPlan.restore({
      campaignId,
      activities: activities.map(toPlanActivity),
      budgetItems: budgetItems.map(toPlanBudgetItem),
    });
  }

  public async replace(plan: CampaignPlan): Promise<CampaignPlan> {
    const campaignId = plan.getCampaignId();

    await this.prisma.$transaction(async (tx) => {
      const [existingActivities, existingBudgetItems] = await Promise.all([
        tx.campaign_activities.findMany({ where: { campaign_id: campaignId }, select: { id: true } }),
        tx.campaign_budgets.findMany({ where: { campaign_id: campaignId }, select: { id: true } }),
      ]);
      const activityIds = new Set(existingActivities.map((row) => row.id));
      const budgetIds = new Set(existingBudgetItems.map((row) => row.id));

      const keptActivityIds = plan
        .getActivities()
        .map((activity) => activity.id)
        .filter((id): id is string => !!id && activityIds.has(id));
      const keptBudgetIds = plan
        .getBudgetItems()
        .map((item) => item.id)
        .filter((id): id is string => !!id && budgetIds.has(id));

      await tx.campaign_activities.deleteMany({
        where: { campaign_id: campaignId, id: { notIn: keptActivityIds } },
      });
      await tx.campaign_budgets.deleteMany({
        where: { campaign_id: campaignId, id: { notIn: keptBudgetIds } },
      });

      for (const activity of plan.getActivities()) {
        const data = {
          name: activity.name,
          description: activity.description,
          planned_start_on: toDbDate(activity.startDate),
          planned_end_on: toDbDate(activity.endDate),
          display_order: activity.displayOrder,
        };
        if (activity.id && activityIds.has(activity.id)) {
          await tx.campaign_activities.update({
            where: { id: activity.id },
            data: { ...data, updated_at: new Date() },
          });
        } else {
          await tx.campaign_activities.create({ data: { ...data, campaign_id: campaignId } });
        }
      }

      for (const item of plan.getBudgetItems()) {
        const data = {
          category: item.category,
          description: item.description,
          planned_amount: item.amount,
          display_order: item.displayOrder,
        };
        if (item.id && budgetIds.has(item.id)) {
          await tx.campaign_budgets.update({ where: { id: item.id }, data });
        } else {
          await tx.campaign_budgets.create({ data: { ...data, campaign_id: campaignId } });
        }
      }
    }, PLAN_TRANSACTION_OPTIONS);

    return this.findByCampaignId(campaignId);
  }
}
