import { useCallback, useEffect, useState } from 'react';
import { campaignsApi, type CampaignRewardResponse } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';

export interface CampaignRewardsState {
  rewards: CampaignRewardResponse[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** Elegible en el checkout: habilitada y con cupo. El backend vuelve a comprobarlo. */
export function isRewardSelectable(reward: CampaignRewardResponse): boolean {
  return reward.isActive && !reward.isSoldOut;
}

interface RewardsResult {
  key: string;
  rewards: CampaignRewardResponse[];
  error: string | null;
}

/** Recompensas reales de una campaña; no consulta nada mientras `enabled` sea falso. */
export function useCampaignRewards(
  campaignId: string | null | undefined,
  enabled: boolean,
): CampaignRewardsState {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<RewardsResult | null>(null);
  const requestKey = campaignId && enabled ? `${campaignId}:${reloadCount}` : null;

  useEffect(() => {
    if (!campaignId || !requestKey) {
      return;
    }
    let cancelled = false;
    campaignsApi.listRewards(campaignId).then(
      (rewards) => {
        if (!cancelled) setResult({ key: requestKey, rewards, error: null });
      },
      (err: unknown) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            rewards: [],
            error: getApiErrorMessage(err, 'No se pudieron cargar las recompensas.'),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [campaignId, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const current = result && result.key === requestKey ? result : null;

  return {
    rewards: current?.rewards ?? [],
    isLoading: requestKey !== null && current === null,
    error: current?.error ?? null,
    reload,
  };
}
