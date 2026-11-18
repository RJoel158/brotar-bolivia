import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';

export const CAMPAIGN_REPOSITORY_PORT = Symbol('CAMPAIGN_REPOSITORY_PORT');

export interface CampaignFilterCriteria {
  category?: string;
  status?: string;
  ownerUserId?: string;
}

export interface CampaignRepositoryPort {
  save(campaign: Campaign): Promise<Campaign>;
  findById(id: string): Promise<Campaign | null>;
  /** Single-row read without the owner and organization names. */
  findAccessById(id: string): Promise<CampaignAccess | null>;
  findAll(criteria?: CampaignFilterCriteria): Promise<Campaign[]>;
  findByOwnerUserId(ownerUserId: string): Promise<Campaign[]>;
  update(campaign: Campaign): Promise<Campaign>;
  delete(id: string): Promise<void>;
}
