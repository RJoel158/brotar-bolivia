import { CampaignReward } from '../../domain/entities/campaign-reward.entity';

export const CAMPAIGN_REWARD_REPOSITORY_PORT = Symbol('CAMPAIGN_REWARD_REPOSITORY_PORT');

export interface CampaignRewardRepositoryPort {
  save(reward: CampaignReward): Promise<CampaignReward>;
  /**
   * Persists editable fields only; never quantity claimed or currency.
   * Throws CampaignRewardInUseError when the reward has contributions,
   * checked under a row lock so it cannot race with a new contribution.
   */
  update(reward: CampaignReward): Promise<CampaignReward>;
  /**
   * Writes only `is_active`. Does not change claimed slots and does not
   * require the reward to be free of contributions.
   */
  setActive(reward: CampaignReward): Promise<CampaignReward>;
  findById(id: string): Promise<CampaignReward | null>;
  /** Ordered by creation date, oldest first. */
  findByCampaignId(campaignId: string): Promise<CampaignReward[]>;
  /** Same contribution check and lock as `update`. */
  delete(id: string): Promise<void>;
}
