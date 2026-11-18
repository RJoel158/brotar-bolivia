import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/index.ts';
import { campaignsApi, type CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { CampaignDetailView } from '../../campaigns/components/CampaignDetailView.tsx';

export interface ProjectDetailPageProps {
  campaignId?: string | null;
  onBack?: () => void;
  onSponsor?: (campaignId: string) => void;
}

export const ProjectDetailPage: FC<ProjectDetailPageProps> = ({
  campaignId,
  onBack,
  onSponsor,
}) => {
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(campaignId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await campaignsApi.getById(campaignId);
        if (!cancelled) {
          setCampaign(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCampaign(null);
          setError(getApiErrorMessage(err, 'No se pudo cargar el detalle de la campaña.'));
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
  }, [campaignId]);

  if (!campaignId) {
    return (
      <div className="feature-page project-detail-page">
        <div className="back-link">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Volver
          </Button>
        </div>
        <p role="alert">No se indicó una campaña.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="feature-page project-detail-page">
        <p>Cargando campaña…</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="feature-page project-detail-page">
        <div className="back-link">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Volver
          </Button>
        </div>
        <p role="alert">{error ?? 'Campaña no encontrada.'}</p>
      </div>
    );
  }

  return (
    <CampaignDetailView
      campaign={campaign}
      onBack={onBack}
      showSponsorCta={campaign.status === 'published'}
      onPrimaryAction={() => onSponsor?.(campaign.id)}
      primaryActionLabel="Apoyar este Proyecto"
    />
  );
};
