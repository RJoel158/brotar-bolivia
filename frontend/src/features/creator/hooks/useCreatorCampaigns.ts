import { useEffect, useState } from 'react';
import { campaignsApi, type CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';

export function useCreatorCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await campaignsApi.getMine();
        if (!cancelled) {
          setCampaigns(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'No se pudieron cargar tus campañas.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = {
    total: campaigns.length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    pending: campaigns.filter((c) => c.status === 'pending_review').length,
    published: campaigns.filter((c) => c.status === 'published').length,
    changesRequested: campaigns.filter((c) => c.status === 'changes_requested').length,
  };

  return { campaigns, isLoading, error, counts };
}
