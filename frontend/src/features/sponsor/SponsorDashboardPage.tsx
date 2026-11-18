import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Card, Button, formatCurrency } from '../../shared/index.ts';
import { contributionsApi, type SponsorSummary } from '../../shared/api/contributionsApi.ts';
import { useAuth } from '../auth/context/useAuth.ts';
import { KycStatusBanner } from '../kyc/components/KycStatusBanner.tsx';
import { KycSubmissionWizard } from '../kyc/components/KycSubmissionWizard.tsx';
import { MyContributionsPanel } from '../contributions/index.ts';
import { FollowedCampaignsPanel } from './components/FollowedCampaignsPanel.tsx';
import './components/FollowedCampaignsPanel.css';

export interface SponsorDashboardPageProps {
  onLogout?: () => void;
  onOpenCampaign?: (campaignId: string) => void;
  onResumeCheckout?: (campaignId: string, contributionId: string) => void;
  onOpenTracking?: (contributionId: string) => void;
  onExplore?: () => void;
}

export const SponsorDashboardPage: FC<SponsorDashboardPageProps> = ({
  onLogout,
  onOpenCampaign,
  onResumeCheckout,
  onOpenTracking,
  onExplore,
}) => {
  const { user } = useAuth();
  const [isKycWizardOpen, setIsKycWizardOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<SponsorSummary | null>(null);

  /** Las metricas vienen calculadas por el backend sobre TODOS los aportes del patrocinador. */
  const loadSummary = useCallback(async () => {
    try {
      setSummary(await contributionsApi.getMySummary());
    } catch {
      // El panel sigue siendo util sin las metricas; "Mis aportes" muestra
      // su propio error si la API no responde.
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    contributionsApi
      .getMySummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        // Sin metricas el panel sigue siendo util; "Mis aportes" muestra su propio error.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = summary?.currency ?? 'BOB';

  return (
    <div className="feature-page dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Panel de Patrocinador</h1>
          <p className="page-subtitle">
            Hola {user?.fullName ?? 'patrocinador'}. Revisa los proyectos que apoyas y el estado de
            tus aportes.
          </p>
        </div>
        <div className="row-actions">
          {onExplore ? (
            <Button size="md" variant="primary" onClick={onExplore}>
              Explorar proyectos
            </Button>
          ) : null}
          {onLogout ? (
            <Button size="md" variant="outline" onClick={onLogout}>
              Cerrar sesión
            </Button>
          ) : null}
        </div>
      </div>

      {/* KYC Status & Submission Banner */}
      <KycStatusBanner onStartKyc={() => setIsKycWizardOpen(true)} />

      <div className="dashboard-metrics">
        <Card padding="md" variant="flat">
          <span className="metric-label">Total aportado</span>
          <span className="metric-value">
            {summary ? formatCurrency(summary.confirmedAmount, currency) : '—'}
          </span>
          <span className="brotar-sponsor-metric__hint">Solo pagos confirmados</span>
        </Card>
        <Card padding="md" variant="flat">
          <span className="metric-label">Proyectos apoyados</span>
          <span className="metric-value">{summary ? summary.supportedCampaigns : '—'}</span>
        </Card>
        <Card padding="md" variant="flat">
          <span className="metric-label">Aportes confirmados</span>
          <span className="metric-value">{summary ? summary.confirmedCount : '—'}</span>
          {summary && summary.pendingCount > 0 ? (
            <span className="brotar-sponsor-metric__hint">
              {summary.pendingCount} {summary.pendingCount === 1 ? 'pendiente de pago' : 'pendientes de pago'}
            </span>
          ) : null}
        </Card>
        <Card padding="md" variant="flat">
          <span className="metric-label">Reembolsado</span>
          <span className="metric-value">
            {summary ? formatCurrency(summary.refundedAmount, currency) : '—'}
          </span>
          {summary && summary.refundedCount > 0 ? (
            <span className="brotar-sponsor-metric__hint">
              {summary.refundedCount} {summary.refundedCount === 1 ? 'aporte devuelto' : 'aportes devueltos'}
            </span>
          ) : null}
        </Card>
        <Card padding="md" variant="flat">
          <span className="metric-label">Casos abiertos</span>
          <span className="metric-value">{summary ? summary.openDisputes : '—'}</span>
          <span className="brotar-sponsor-metric__hint">Problemas reportados en revisión</span>
        </Card>
      </div>

      <FollowedCampaignsPanel onOpenCampaign={onOpenCampaign} onExplore={onExplore} />

      <MyContributionsPanel
        onOpenCampaign={onOpenCampaign}
        onResumeCheckout={onResumeCheckout}
        onOpenTracking={onOpenTracking}
        onChanged={() => void loadSummary()}
      />

      {/* KYC Wizard Modal */}
      <KycSubmissionWizard
        isOpen={isKycWizardOpen}
        onClose={() => setIsKycWizardOpen(false)}
      />
    </div>
  );
};
