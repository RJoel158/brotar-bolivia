import type { FC } from 'react';
import { Card, Button, formatCurrency } from '../../shared/index.ts';
import { useCampaignCatalog } from '../../shared/hooks/useCampaignCatalog.ts';

export interface CampaignsPageProps {
  onSelectCampaign?: (campaignId: string) => void;
}

export const CampaignsPage: FC<CampaignsPageProps> = ({ onSelectCampaign }) => {
  const { items: campaigns, isLoading, isLoadingMore, error, loadMoreError, nextCursor, loadMore, refresh } = useCampaignCatalog();

  return (
    <div className="feature-page campaigns-page">
      <div className="page-header">
        <h1 className="page-title">Campañas Ecológicas Destacadas</h1>
        <p className="page-subtitle">
          Explora convocatorias publicadas en la plataforma Brotar.
        </p>
      </div>

      {isLoading ? <p>Cargando campañas publicadas…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!isLoading && !error && campaigns.length === 0 ? (
        <p>No hay campañas publicadas por ahora.</p>
      ) : null}

      <div className="campaigns-grid">
        {campaigns.map((campaign) => {
          const currency = campaign.currency || 'BOB';
          return (
            <Card key={campaign.id} padding="lg" className="campaign-card">
              {campaign.coverImageUrl ? (
                <img
                  src={campaign.coverImageUrl}
                  alt=""
                  style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div className="campaign-tag">Sin portada</div>
              )}
              <div className="campaign-tag">{campaign.category}</div>
              <h3>{campaign.title}</h3>
              <p>{campaign.shortSummary || 'Campaña publicada en Brotar.'}</p>
              <div className="campaign-meta">
                <span>
                  Meta: <strong>{formatCurrency(campaign.goalAmount, currency)}</strong>
                </span>
                <span>
                  Recaudado:{' '}
                  <strong>{formatCurrency(campaign.currentAmount, currency)}</strong>
                </span>
              </div>
              <Button
                size="md"
                variant="secondary"
                onClick={() => onSelectCampaign?.(campaign.id)}
              >
                Ver campaña
              </Button>
            </Card>
          );
        })}
      </div>
      {loadMoreError ? <div role="alert"><p>{loadMoreError}</p><Button onClick={refresh}>Actualizar catalogo</Button></div> : null}
      {!isLoading && nextCursor ? <Button disabled={isLoadingMore} onClick={() => void loadMore()}>{isLoadingMore ? 'Cargando...' : 'Cargar mas campanas'}</Button> : null}
    </div>
  );
};
