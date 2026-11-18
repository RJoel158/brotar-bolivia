import type { Campaign } from '../../domain/entities/campaign.entity';
export const CAMPAIGN_HOME_PORT = Symbol('CAMPAIGN_HOME_PORT');
export interface CampaignHomeSummary {
  featured: Campaign | null; categories: string[]; categoryCounts: Record<string, number>;
  projects: number; raised: string; progress: number; currency: string;
}
export interface CampaignHomeRepositoryPort { getSummary(): Promise<CampaignHomeSummary>; }
