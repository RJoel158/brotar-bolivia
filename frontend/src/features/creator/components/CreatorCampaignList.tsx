import type { FC } from 'react';
import { useRef, useState } from 'react';
import { Button, formatCurrency, formatPercentage } from '../../../shared/index.ts';
import { campaignsApi, type CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { CAMPAIGN_STATUS_LABELS } from '../../campaigns/campaignStatusLabels.ts';
import { CampaignDetailView } from '../../campaigns/components/CampaignDetailView.tsx';
import './CreatorCampaignList.css';

export interface CreatorCampaignListProps {
  campaigns: CampaignResponse[];
  isLoading: boolean;
  error: string | null;
  emptyMessage?: string;
  limit?: number;
  onContinueCampaign?: (campaignId: string) => void;
  onViewPublished?: (campaignId: string) => void;
}

export const CreatorCampaignList: FC<CreatorCampaignListProps> = ({
  campaigns,
  isLoading,
  error,
  emptyMessage = 'Aún no tienes campañas. Crea tu primer proyecto.',
  limit,
  onContinueCampaign,
  onViewPublished,
}) => {
  const [selectedDetail, setSelectedDetail] = useState<CampaignResponse | null>(null);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestRef = useRef(0);

  const visible = typeof limit === 'number' ? campaigns.slice(0, limit) : campaigns;

  const refreshDetail = async (campaignId: string) => {
    const requestId = ++detailRequestRef.current;
    setDetailRefreshing(true);
    setDetailError(null);
    try {
      const full = await campaignsApi.getById(campaignId);
      if (requestId === detailRequestRef.current) setSelectedDetail(full);
    } catch (err) {
      if (requestId === detailRequestRef.current) {
        setDetailError(getApiErrorMessage(err, 'No se pudo actualizar el detalle.'));
      }
    } finally {
      if (requestId === detailRequestRef.current) setDetailRefreshing(false);
    }
  };

  const openDetail = (campaign: CampaignResponse) => {
    setSelectedDetail(campaign);
    void refreshDetail(campaign.id);
  };

  const closeDetail = () => {
    detailRequestRef.current += 1;
    setDetailRefreshing(false);
    setDetailError(null);
    setSelectedDetail(null);
  };

  const canContinue = (status: string) =>
    status === 'draft' || status === 'changes_requested';

  if (isLoading) {
    return <p className="creator-list__hint">Cargando campañas…</p>;
  }

  if (error) {
    return (
      <p className="creator-list__hint creator-list__hint--error" role="alert">
        {error}
      </p>
    );
  }

  if (visible.length === 0) {
    return <p className="creator-list__hint">{emptyMessage}</p>;
  }

  return (
    <div className="creator-list">
      <ul className="creator-list__items">
        {visible.map((campaign) => {
          const currency = campaign.currency || 'BOB';
          const progress = formatPercentage(campaign.currentAmount, campaign.goalAmount);
          return (
            <li key={campaign.id} className="creator-list__item">
              <div className="creator-list__main">
                <div className="creator-list__title-row">
                  <h3 className="creator-list__title">{campaign.title}</h3>
                  <span className={`creator-list__status status-${campaign.status}`}>
                    {CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
                  </span>
                </div>
                <p className="creator-list__meta">
                  {campaign.category}
                  {' · '}
                  {formatCurrency(campaign.currentAmount, currency)} de{' '}
                  {formatCurrency(campaign.goalAmount, currency)} ({progress}%)
                  {campaign.updatedAt
                    ? ` · Actualizado ${new Date(campaign.updatedAt).toLocaleDateString('es-BO')}`
                    : ''}
                </p>
                <div className="creator-list__progress" aria-hidden="true">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="creator-list__actions">
                <Button size="sm" variant="outline" onClick={() => openDetail(campaign)}>
                  Ver
                </Button>
                {canContinue(campaign.status) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onContinueCampaign?.(campaign.id)}
                  >
                    {campaign.status === 'changes_requested' ? 'Corregir' : 'Continuar'}
                  </Button>
                ) : null}
                {campaign.status === 'published' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onViewPublished?.(campaign.id)}
                  >
                    Ver publicada
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {selectedDetail && detailRefreshing ? (
        <p className="creator-list__hint" role="status">
          Actualizando detalle…
        </p>
      ) : null}
      {selectedDetail && detailError ? (
        <p className="creator-list__hint creator-list__hint--error" role="alert">
          {detailError} Se muestran los datos del listado.{' '}
          <Button size="sm" variant="ghost" onClick={() => void refreshDetail(selectedDetail.id)}>
            Reintentar
          </Button>
        </p>
      ) : null}
      {selectedDetail ? (
        <div className="creator-list__detail">
          <CampaignDetailView
            key={selectedDetail.id}
            campaign={selectedDetail}
            variant="panel"
            onBack={closeDetail}
            onPrimaryAction={
              canContinue(selectedDetail.status)
                ? () => onContinueCampaign?.(selectedDetail.id)
                : selectedDetail.status === 'published'
                  ? () => onViewPublished?.(selectedDetail.id)
                  : undefined
            }
            primaryActionLabel={
              canContinue(selectedDetail.status)
                ? selectedDetail.status === 'changes_requested'
                  ? 'Corregir en wizard'
                  : 'Continuar creación'
                : selectedDetail.status === 'published'
                  ? 'Abrir vista pública'
                  : undefined
            }
          />
        </div>
      ) : null}
    </div>
  );
};
