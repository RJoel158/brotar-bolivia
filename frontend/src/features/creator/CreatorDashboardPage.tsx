import type { FC } from 'react';
import { Button, DashboardLayout } from '../../shared/index.ts';
import { useAuth } from '../auth/context/useAuth.ts';
import { useCreatorCampaigns } from './hooks/useCreatorCampaigns.ts';
import { CreatorCampaignList } from './components/CreatorCampaignList.tsx';
import './CreatorDashboardPage.css';

export interface CreatorDashboardPageProps {
  onCreateProject?: () => void;
  onContinueCampaign?: (campaignId: string) => void;
  onViewCampaign?: (campaignId: string) => void;
  onGoToProjects?: () => void;
  onGoToVerification?: () => void;
  onNavigate?: (itemId: string) => void;
  onLogout?: () => void;
  onSearchProjects?: (query: string) => void;
}

export const CreatorDashboardPage: FC<CreatorDashboardPageProps> = ({
  onCreateProject,
  onContinueCampaign,
  onViewCampaign,
  onGoToProjects,
  onGoToVerification,
  onNavigate,
  onLogout,
  onSearchProjects,
}) => {
  const { user } = useAuth();
  const { campaigns, isLoading, error, counts } = useCreatorCampaigns();
  const firstName = user?.fullName?.split(' ')[0] ?? 'Creador';

  return (
    <DashboardLayout
      variant="creator"
      activeItem="creator"
      userName={user?.fullName ?? 'Creador'}
      onNavigate={onNavigate}
      onLogout={onLogout}
      onSearchSubmit={onSearchProjects}
    >
      <div className="creator-dash">
        <header className="creator-dash__header">
          <div>
            <p className="creator-dash__eyebrow">Mi panel</p>
            <h1 className="creator-dash__title">Hola, {firstName}</h1>
            <p className="creator-dash__subtitle">
              Resumen del estado de tus campañas y accesos rápidos. Gestiona el listado completo
              desde Mis proyectos.
            </p>
          </div>
          <div className="creator-dash__header-actions">
            <Button size="md" variant="outline" onClick={onGoToVerification}>
              Verificación
            </Button>
            <Button size="md" variant="primary" onClick={onCreateProject}>
              Crear campaña
            </Button>
          </div>
        </header>

        <section className="creator-dash__stats" aria-label="Resumen de campañas">
          <article className="creator-dash__stat">
            <span className="creator-dash__stat-label">Total</span>
            <strong className="creator-dash__stat-value">{counts.total}</strong>
          </article>
          <article className="creator-dash__stat">
            <span className="creator-dash__stat-label">Borradores</span>
            <strong className="creator-dash__stat-value">{counts.draft}</strong>
          </article>
          <article className="creator-dash__stat">
            <span className="creator-dash__stat-label">En revisión</span>
            <strong className="creator-dash__stat-value">{counts.pending}</strong>
          </article>
          <article className="creator-dash__stat">
            <span className="creator-dash__stat-label">Publicadas</span>
            <strong className="creator-dash__stat-value">{counts.published}</strong>
          </article>
        </section>

        {!isLoading && !error && counts.changesRequested > 0 && (
          <div className="creator-dash__notice" role="status">
            <p>
              {counts.changesRequested === 1
                ? 'Tienes 1 campaña con cambios solicitados por el equipo de revisión.'
                : `Tienes ${counts.changesRequested} campañas con cambios solicitados por el equipo de revisión.`}
            </p>
            <Button size="sm" variant="outline" onClick={onGoToProjects}>
              Revisar en Mis proyectos
            </Button>
          </div>
        )}

        <section className="creator-dash__section">
          <div className="creator-dash__section-head">
            <h2 className="creator-dash__section-title">Campañas recientes</h2>
            <Button size="sm" variant="tertiary" onClick={onGoToProjects}>
              Ver todas
            </Button>
          </div>
          <CreatorCampaignList
            campaigns={campaigns}
            isLoading={isLoading}
            error={error}
            limit={4}
            onContinueCampaign={onContinueCampaign}
            onViewPublished={onViewCampaign}
          />
        </section>
      </div>
    </DashboardLayout>
  );
};
