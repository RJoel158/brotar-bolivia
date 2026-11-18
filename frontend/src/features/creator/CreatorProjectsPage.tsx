import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Button, DashboardLayout } from '../../shared/index.ts';
import { useAuth } from '../auth/context/useAuth.ts';
import { CAMPAIGN_STATUS_LABELS } from '../campaigns/campaignStatusLabels.ts';
import { useCreatorCampaigns } from './hooks/useCreatorCampaigns.ts';
import { CreatorCampaignList } from './components/CreatorCampaignList.tsx';
import './CreatorDashboardPage.css';

export interface CreatorProjectsPageProps {
  searchQuery?: string | null;
  onCreateProject?: () => void;
  onContinueCampaign?: (campaignId: string) => void;
  onViewCampaign?: (campaignId: string) => void;
  onNavigate?: (itemId: string) => void;
  onLogout?: () => void;
  onSearchProjects?: (query: string) => void;
}

const ALL_STATUSES = 'all';

/** Case- and accent-insensitive comparison for the header search. */
function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export const CreatorProjectsPage: FC<CreatorProjectsPageProps> = ({
  searchQuery = null,
  onCreateProject,
  onContinueCampaign,
  onViewCampaign,
  onNavigate,
  onLogout,
  onSearchProjects,
}) => {
  const { user } = useAuth();
  const { campaigns, isLoading, error } = useCreatorCampaigns();
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);

  const query = searchQuery?.trim() ?? '';

  const statusOptions = useMemo(() => {
    const totals = new Map<string, number>();
    for (const campaign of campaigns) {
      totals.set(campaign.status, (totals.get(campaign.status) ?? 0) + 1);
    }
    return Object.keys(CAMPAIGN_STATUS_LABELS)
      .filter((status) => totals.has(status))
      .map((status) => ({
        status,
        label: CAMPAIGN_STATUS_LABELS[status],
        total: totals.get(status) ?? 0,
      }));
  }, [campaigns]);

  const activeStatus = statusOptions.some((option) => option.status === statusFilter)
    ? statusFilter
    : ALL_STATUSES;

  const filteredCampaigns = useMemo(() => {
    const needle = normalizeSearchText(query);
    return campaigns.filter((campaign) => {
      if (activeStatus !== ALL_STATUSES && campaign.status !== activeStatus) return false;
      if (!needle) return true;
      return [campaign.title, campaign.shortSummary, campaign.location].some(
        (field) => field && normalizeSearchText(field).includes(needle),
      );
    });
  }, [campaigns, activeStatus, query]);

  const isFiltering = query.length > 0 || activeStatus !== ALL_STATUSES;

  return (
    <DashboardLayout
      variant="creator"
      activeItem="creator-projects"
      userName={user?.fullName ?? 'Creador'}
      onNavigate={onNavigate}
      onLogout={onLogout}
      onSearchSubmit={onSearchProjects}
    >
      <div className="creator-dash">
        <header className="creator-dash__header">
          <div>
            <p className="creator-dash__eyebrow">Gestión</p>
            <h1 className="creator-dash__title">Mis proyectos</h1>
            <p className="creator-dash__subtitle">
              Todas tus campañas: búscalas, fíltralas por estado, continúa borradores y abre
              las publicadas.
            </p>
          </div>
          <Button size="md" variant="primary" onClick={onCreateProject}>
            Crear campaña
          </Button>
        </header>

        <section className="creator-dash__section">
          {!isLoading && !error && campaigns.length > 0 && (
            <div className="creator-projects__toolbar">
              <div
                className="creator-projects__filters"
                role="group"
                aria-label="Filtrar campañas por estado"
              >
                <button
                  type="button"
                  className="creator-projects__filter"
                  aria-pressed={activeStatus === ALL_STATUSES}
                  onClick={() => setStatusFilter(ALL_STATUSES)}
                >
                  Todas ({campaigns.length})
                </button>
                {statusOptions.map((option) => (
                  <button
                    key={option.status}
                    type="button"
                    className="creator-projects__filter"
                    aria-pressed={activeStatus === option.status}
                    onClick={() => setStatusFilter(option.status)}
                  >
                    {option.label} ({option.total})
                  </button>
                ))}
              </div>

              {query && (
                <div className="creator-projects__search" role="status">
                  <span>
                    Resultados para <strong>«{query}»</strong>
                  </span>
                  {onSearchProjects && (
                    <Button size="sm" variant="tertiary" onClick={() => onSearchProjects('')}>
                      Quitar búsqueda
                    </Button>
                  )}
                </div>
              )}

              <p className="creator-projects__count">
                Mostrando {filteredCampaigns.length} de {campaigns.length} campañas
              </p>
            </div>
          )}

          <CreatorCampaignList
            campaigns={filteredCampaigns}
            isLoading={isLoading}
            error={error}
            emptyMessage={
              isFiltering && campaigns.length > 0
                ? 'Ninguna campaña coincide con la búsqueda o el filtro seleccionado.'
                : undefined
            }
            onContinueCampaign={onContinueCampaign}
            onViewPublished={onViewCampaign}
          />
        </section>
      </div>
    </DashboardLayout>
  );
};
