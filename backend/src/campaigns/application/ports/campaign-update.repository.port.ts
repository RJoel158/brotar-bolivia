import { CampaignUpdate } from '../../domain/entities/campaign-update.entity';

export const CAMPAIGN_UPDATE_REPOSITORY_PORT = Symbol('CAMPAIGN_UPDATE_REPOSITORY_PORT');

export interface CampaignUpdateWithAuthor {
  update: CampaignUpdate;
  authorName?: string;
  authorAvatarUrl?: string | null;
}

export interface CampaignUpdateRepositoryPort {
  save(update: CampaignUpdate): Promise<CampaignUpdate>;
  findById(id: string): Promise<CampaignUpdate | null>;
  findByCampaignId(campaignId: string, allowedVisibilities?: string[]): Promise<CampaignUpdateWithAuthor[]>;
  delete(id: string): Promise<void>;
  isUserCampaignSupporter(campaignId: string, userId: string): Promise<boolean>;
}
