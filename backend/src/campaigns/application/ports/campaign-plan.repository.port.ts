import type { CampaignPlan } from '../../domain/entities/campaign-plan.entity';

export const CAMPAIGN_PLAN_REPOSITORY_PORT = Symbol('CAMPAIGN_PLAN_REPOSITORY_PORT');

export interface CampaignPlanRepositoryPort {
  findByCampaignId(campaignId: string): Promise<CampaignPlan>;
  /**
   * Replaces the whole plan of the campaign: items whose id already belongs to
   * the campaign are updated, unknown ids are created and missing ones deleted.
   */
  replace(plan: CampaignPlan): Promise<CampaignPlan>;
}
