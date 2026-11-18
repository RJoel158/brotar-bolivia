import type {
  CampaignRewardPayload,
  CampaignRewardResponse,
} from '../../../shared/api/campaignsApi.ts';
import type { CampaignReward, CampaignTypeValue } from './types.ts';

/** Last state confirmed by the API, keyed by reward id. */
export type RewardSnapshot = Record<string, CampaignReward>;

export interface RewardSyncPlan {
  creates: CampaignReward[];
  updates: Array<{ id: string; patch: Partial<CampaignRewardPayload> }>;
  deletes: string[];
}

export function fromRewardResponse(reward: CampaignRewardResponse): CampaignReward {
  return {
    id: reward.id,
    title: reward.title,
    description: reward.description,
    minimumContribution: reward.minimumContribution,
    availableQuantity: reward.quantityTotal,
    quantityClaimed: reward.quantityClaimed,
    isActive: reward.isActive,
    estimatedDelivery: reward.estimatedDeliveryOn,
  };
}

export function toRewardPayload(reward: CampaignReward): CampaignRewardPayload {
  return {
    title: reward.title,
    description: reward.description,
    minimumContribution: reward.minimumContribution,
    quantityTotal: reward.availableQuantity,
    estimatedDeliveryOn: reward.estimatedDelivery,
  };
}

export function snapshotOf(rewards: CampaignReward[]): RewardSnapshot {
  return Object.fromEntries(rewards.map((reward) => [reward.id, reward]));
}

/** Only changed fields, so PATCH keeps the rest (an unchanged past date stays valid). */
function changedFields(
  saved: CampaignReward,
  local: CampaignReward,
): Partial<CampaignRewardPayload> | null {
  const before = toRewardPayload(saved);
  const after = toRewardPayload(local);
  const patch: Partial<CampaignRewardPayload> = {};
  (Object.keys(after) as Array<keyof CampaignRewardPayload>).forEach((key) => {
    if (before[key] !== after[key]) {
      Object.assign(patch, { [key]: after[key] });
    }
  });
  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Creates and updates only apply to reward campaigns: the API rejects them
 * otherwise. Deletes always apply, so a creator can clear saved rewards before
 * changing the campaign type.
 */
export function planRewardSync(
  snapshot: RewardSnapshot,
  local: CampaignReward[],
  campaignType: CampaignTypeValue | null,
): RewardSyncPlan {
  const localIds = new Set(local.map((reward) => reward.id));
  const deletes = Object.keys(snapshot).filter((id) => !localIds.has(id));
  if (campaignType !== 'reward') {
    return { creates: [], updates: [], deletes };
  }

  const creates: CampaignReward[] = [];
  const updates: RewardSyncPlan['updates'] = [];
  for (const reward of local) {
    const saved = snapshot[reward.id];
    if (!saved) {
      creates.push(reward);
      continue;
    }
    const patch = changedFields(saved, reward);
    if (patch) {
      updates.push({ id: reward.id, patch });
    }
  }
  return { creates, updates, deletes };
}

export function isRewardSyncPlanEmpty(plan: RewardSyncPlan): boolean {
  return plan.creates.length === 0 && plan.updates.length === 0 && plan.deletes.length === 0;
}
