import type { Campaign } from '../../domain/entities/campaign.entity';
export const CAMPAIGN_CATALOG_PORT = Symbol('CAMPAIGN_CATALOG_PORT');
export interface CatalogCriteria { limit: number; category?: string; query?: string; after?: string; }
export interface CampaignCatalogRepositoryPort {
  findPage(criteria: CatalogCriteria): Promise<{ items: Campaign[]; next: string | null }>;
}
