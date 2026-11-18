import { useEffect, useState } from 'react';
import { campaignsApi, type CampaignPlanResponse } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';

export interface UseCampaignPlanResult {
  plan: CampaignPlanResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface LoadedPlan {
  campaignId: string;
  plan: CampaignPlanResponse | null;
  error: string | null;
}

export function useCampaignPlan(campaignId: string): UseCampaignPlanResult {
  const [loaded, setLoaded] = useState<LoadedPlan | null>(null);

  useEffect(() => {
    let cancelled = false;

    campaignsApi
      .getPlan(campaignId)
      .then((plan) => {
        if (!cancelled) setLoaded({ campaignId, plan, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoaded({
            campaignId,
            plan: null,
            error: getApiErrorMessage(err, 'No se pudo cargar el plan y presupuesto.'),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const isCurrent = loaded?.campaignId === campaignId;
  return {
    plan: isCurrent ? loaded.plan : null,
    isLoading: !isCurrent,
    error: isCurrent ? loaded.error : null,
  };
}
