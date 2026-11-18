import type { FC } from 'react';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Gift,
  Megaphone,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import {
  campaignsApi,
  type CampaignResponse,
  type CampaignUpdateItem,
} from '../../shared/api/campaignsApi.ts';
import {
  contributionsApi,
  type Contribution,
  type SponsorDispute,
} from '../../shared/api/contributionsApi.ts';
import { getApiErrorMessage } from '../auth/utils/getApiErrorMessage.ts';
import { formatIsoDate } from '../creator/campaign-creation/planningValidation.ts';
import {
  contributionStatusLabels,
  contributionStatusTone,
  contributionTypeLabels,
  disputeStatusLabels,
  disputeStatusTone,
  disputeTypeLabels,
  formatDate,
  formatMoney,
  paymentMethodLabels,
} from './contributionLabels.ts';
import { ReportProblemModal } from './ReportProblemModal.tsx';
import './ContributionsModule.css';

export interface ContributionTrackingPageProps {
  contributionId: string | null;
  onBack: () => void;
  onOpenCampaign?: (campaignId: string) => void;
  onResumeCheckout?: (campaignId: string, contributionId: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias hasta el fin de la campana (negativo si ya termino); null si no tiene fecha. */
function daysUntil(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(`${endDate.slice(0, 10)}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / DAY_MS);
}

interface TimelineStep {
  key: string;
  label: string;
  detail: string;
  state: 'done' | 'current' | 'upcoming' | 'error';
}

function buildTimeline(contribution: Contribution, campaign: CampaignResponse | null): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      key: 'created',
      label: 'Aporte registrado',
      detail: formatDate(contribution.createdAt),
      state: 'done',
    },
  ];

  if (contribution.status === 'pending') {
    steps.push({ key: 'paid', label: 'Pago pendiente', detail: 'Completa el pago para que tu aporte cuente.', state: 'current' });
    return steps;
  }
  if (contribution.status === 'failed') {
    steps.push({ key: 'paid', label: 'Pago rechazado', detail: contribution.failureReason ?? 'El pago no se completó.', state: 'error' });
    return steps;
  }
  if (contribution.status === 'cancelled' || contribution.status === 'expired') {
    steps.push({
      key: 'paid',
      label: contributionStatusLabels[contribution.status],
      detail: 'Este aporte no llegó a cobrarse.',
      state: 'error',
    });
    return steps;
  }

  steps.push({
    key: 'paid',
    label: 'Pago confirmado',
    detail: `${formatDate(contribution.paidAt)}${contribution.gatewayReference ? ` · ${contribution.gatewayReference}` : ''}`,
    state: 'done',
  });

  if (campaign) {
    const remaining = daysUntil(campaign.endDate);
    const reached = campaign.currentAmount >= campaign.goalAmount;
    const ended = remaining !== null && remaining < 0;
    steps.push({
      key: 'campaign',
      label: reached ? 'Meta alcanzada' : ended ? 'Recaudación cerrada' : 'Campaña en recaudación',
      detail: reached
        ? 'El proyecto consiguió los fondos que necesitaba.'
        : ended
          ? `Cerró el ${formatIsoDate(campaign.endDate!.slice(0, 10))} sin alcanzar la meta.`
          : remaining === null
            ? 'Sin fecha de cierre definida.'
            : `Quedan ${remaining} ${remaining === 1 ? 'día' : 'días'} para el cierre.`,
      state: reached || (ended && contribution.status === 'refunded') ? 'done' : ended ? 'error' : 'current',
    });
  }

  if (contribution.status === 'refunded') {
    steps.push({
      key: 'refund',
      label: 'Aporte reembolsado',
      detail: 'Te devolvimos el monto completo de tu aporte.',
      state: 'done',
    });
    return steps;
  }

  if (contribution.rewardTitle) {
    steps.push({
      key: 'reward',
      label: `Entrega de "${contribution.rewardTitle}"`,
      detail: contribution.rewardEstimatedDeliveryOn
        ? `Entrega estimada: ${formatIsoDate(contribution.rewardEstimatedDeliveryOn)}`
        : 'El creador te avisará la fecha de entrega.',
      state: 'upcoming',
    });
  }

  return steps;
}

/** Seguimiento de un aporte: estado del pago, avance del proyecto y novedades del creador. */
export const ContributionTrackingPage: FC<ContributionTrackingPageProps> = ({
  contributionId,
  onBack,
  onOpenCampaign,
  onResumeCheckout,
}) => {
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [updates, setUpdates] = useState<CampaignUpdateItem[]>([]);
  const [disputes, setDisputes] = useState<SponsorDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!contributionId) return;
    let cancelled = false;

    void (async () => {
      try {
        const found = await contributionsApi.getById(contributionId);
        if (cancelled) return;
        setContribution(found);
        setError(null);

        // Las secciones secundarias no bloquean la pantalla si alguna falla.
        const [campaignResult, updatesResult, disputesResult] = await Promise.allSettled([
          campaignsApi.getById(found.campaignId),
          campaignsApi.getUpdates(found.campaignId),
          contributionsApi.listDisputes(found.id),
        ]);
        if (cancelled) return;
        setCampaign(campaignResult.status === 'fulfilled' ? campaignResult.value : null);
        setUpdates(updatesResult.status === 'fulfilled' ? updatesResult.value : []);
        setDisputes(disputesResult.status === 'fulfilled' ? disputesResult.value : []);
        setSectionError(
          [campaignResult, updatesResult, disputesResult].some((result) => result.status === 'rejected')
            ? 'Parte de la información del proyecto no se pudo cargar. Intenta de nuevo en un momento.'
            : null,
        );
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'No se pudo cargar el aporte.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contributionId]);

  if (!contributionId) {
    return (
      <div className="brotar-tracking">
        <button type="button" className="brotar-checkout__back" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a mis aportes
        </button>
        <p className="brotar-checkout__error">No se indicó el aporte a seguir.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="brotar-checkout__state">Cargando seguimiento…</p>;
  }

  if (error || !contribution) {
    return (
      <div className="brotar-tracking">
        <button type="button" className="brotar-checkout__back" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a mis aportes
        </button>
        <p className="brotar-checkout__error">{error ?? 'Aporte no encontrado.'}</p>
      </div>
    );
  }

  const timeline = buildTimeline(contribution, campaign);
  const progress =
    campaign && campaign.goalAmount > 0
      ? Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100))
      : 0;
  const remaining = campaign ? daysUntil(campaign.endDate) : null;
  const isAllOrNothing = campaign?.fundingModel === 'all_or_nothing';
  const hasOpenDispute = disputes.some((dispute) => dispute.status === 'open' || dispute.status === 'in_review');
  const canReport = ['confirmed', 'refunded', 'failed'].includes(contribution.status) && !hasOpenDispute;

  return (
    <div className="brotar-tracking">
      <button type="button" className="brotar-checkout__back" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a mis aportes
      </button>

      <header className="brotar-tracking__hero">
        <div className="brotar-tracking__cover">
          {contribution.campaignCoverUrl ? (
            <img src={contribution.campaignCoverUrl} alt="" />
          ) : (
            <div className="brotar-contribution-card__placeholder" />
          )}
        </div>
        <div className="brotar-tracking__hero-body">
          <p className="brotar-tracking__eyebrow">Seguimiento de tu aporte</p>
          <h1 className="brotar-checkout__title">{contribution.campaignTitle}</h1>
          <div className="brotar-tracking__hero-meta">
            <span
              className={`brotar-contributions__badge brotar-contributions__badge--${contributionStatusTone[contribution.status]}`}
            >
              {contributionStatusLabels[contribution.status]}
            </span>
            <strong>{formatMoney(contribution.amount, contribution.currency)}</strong>
            <span>{contributionTypeLabels[contribution.contributionType]}</span>
          </div>
        </div>
        <div className="brotar-tracking__hero-actions">
          <button
            type="button"
            className="brotar-checkout__ghost"
            onClick={() => onOpenCampaign?.(contribution.campaignId)}
          >
            <ExternalLink size={15} /> Ver proyecto
          </button>
          {contribution.status === 'pending' || contribution.status === 'failed' ? (
            <button
              type="button"
              className="brotar-checkout__cta"
              onClick={() => onResumeCheckout?.(contribution.campaignId, contribution.id)}
            >
              <RotateCcw size={15} /> {contribution.status === 'pending' ? 'Completar pago' : 'Reintentar'}
            </button>
          ) : null}
        </div>
      </header>

      {notice ? <p className="brotar-tracking__success">{notice}</p> : null}
      {sectionError ? <p className="brotar-checkout__notice">{sectionError}</p> : null}

      {contribution.status === 'refunded' ? (
        <p className="brotar-tracking__info">
          <RotateCcw size={16} />
          {isAllOrNothing
            ? 'Esta campaña era "todo o nada" y cerró sin alcanzar su meta, así que te devolvimos tu aporte completo.'
            : 'Te devolvimos el monto completo de este aporte.'}
        </p>
      ) : null}

      <div className="brotar-tracking__grid">
        <section className="brotar-tracking__card">
          <h2 className="brotar-tracking__card-title">Estado</h2>
          <ol className="brotar-tracking__timeline">
            {timeline.map((step) => (
              <li key={step.key} className={`is-${step.state}`}>
                <span className="brotar-tracking__dot">
                  {step.state === 'done' ? (
                    <CheckCircle2 size={18} />
                  ) : step.state === 'error' ? (
                    <XCircle size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="brotar-tracking__card">
          <h2 className="brotar-tracking__card-title">Tu aporte</h2>
          <dl className="brotar-checkout__receipt">
            <div>
              <dt>Monto</dt>
              <dd>{formatMoney(contribution.amount, contribution.currency)}</dd>
            </div>
            <div>
              <dt>Llega al proyecto</dt>
              <dd>{formatMoney(contribution.netAmount, contribution.currency)}</dd>
            </div>
            <div>
              <dt>Método</dt>
              <dd>
                {contribution.paymentMethod
                  ? (paymentMethodLabels[contribution.paymentMethod] ?? contribution.paymentMethod)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Comprobante</dt>
              <dd>{contribution.gatewayReference ?? '—'}</dd>
            </div>
            {contribution.rewardTitle ? (
              <div>
                <dt>Recompensa</dt>
                <dd>
                  <Gift size={13} /> {contribution.rewardTitle}
                </dd>
              </div>
            ) : null}
            {contribution.isAnonymous ? (
              <div>
                <dt>Visibilidad</dt>
                <dd>Anónimo</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {campaign ? (
          <section className="brotar-tracking__card">
            <h2 className="brotar-tracking__card-title">
              <Target size={16} /> Avance del proyecto
            </h2>
            <p className="brotar-tracking__amounts">
              <strong>{formatMoney(campaign.currentAmount, campaign.currency)}</strong> de{' '}
              {formatMoney(campaign.goalAmount, campaign.currency)}
            </p>
            <div className="brotar-tracking__bar" aria-label={`Avance ${progress}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="brotar-tracking__meta">
              {progress}% de la meta ·{' '}
              {remaining === null
                ? 'sin fecha de cierre'
                : remaining < 0
                  ? `cerró el ${formatIsoDate(campaign.endDate!.slice(0, 10))}`
                  : `${remaining} ${remaining === 1 ? 'día restante' : 'días restantes'}`}
            </p>
            <p className="brotar-tracking__meta">
              <CalendarClock size={13} />{' '}
              {isAllOrNothing
                ? 'Todo o nada: si no se alcanza la meta al cierre, se devuelven los aportes.'
                : 'Flexible: el proyecto recibe lo recaudado aunque no llegue a la meta.'}
            </p>
          </section>
        ) : null}

        <section className="brotar-tracking__card">
          <h2 className="brotar-tracking__card-title">
            <AlertTriangle size={16} /> ¿Algún problema?
          </h2>
          {disputes.length === 0 ? (
            <p className="brotar-tracking__meta">
              Si algo no salió como esperabas con este aporte, repórtalo y el equipo de Brotar lo
              revisará.
            </p>
          ) : (
            <ul className="brotar-tracking__disputes">
              {disputes.map((dispute) => (
                <li key={dispute.id}>
                  <div className="brotar-contribution-card__top">
                    <strong>{dispute.code}</strong>
                    <span
                      className={`brotar-contributions__badge brotar-contributions__badge--${disputeStatusTone[dispute.status] ?? 'neutral'}`}
                    >
                      {disputeStatusLabels[dispute.status] ?? dispute.status}
                    </span>
                  </div>
                  <p className="brotar-tracking__meta">
                    {disputeTypeLabels[dispute.disputeType] ?? dispute.disputeType} · abierto el{' '}
                    {formatDate(dispute.openedAt)}
                  </p>
                  {dispute.resolution ? (
                    <p className="brotar-tracking__meta">
                      <strong>Respuesta:</strong> {dispute.resolution}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canReport ? (
            <button
              type="button"
              className="brotar-checkout__ghost brotar-tracking__report"
              onClick={() => setIsReportOpen(true)}
            >
              <AlertTriangle size={15} /> Reportar problema
            </button>
          ) : hasOpenDispute ? (
            <p className="brotar-tracking__meta">Tienes un caso abierto: te avisaremos cuando haya novedades.</p>
          ) : null}
        </section>
      </div>

      <section className="brotar-tracking__card brotar-tracking__updates">
        <h2 className="brotar-tracking__card-title">
          <Megaphone size={16} /> Novedades del creador
        </h2>
        {updates.length === 0 ? (
          <p className="brotar-tracking__meta">El creador todavía no publicó avances de este proyecto.</p>
        ) : (
          <ul>
            {updates.map((update) => (
              <li key={update.id}>
                {update.imageUrl ? <img src={update.imageUrl} alt="" loading="lazy" /> : null}
                <div>
                  <p className="brotar-tracking__meta">
                    {formatDate(update.publishedAt ?? update.createdAt)}
                    {update.visibility === 'supporters_only' ? ' · Solo para patrocinadores' : ''}
                  </p>
                  <strong>{update.title}</strong>
                  <p className="brotar-tracking__update-body">{update.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReportProblemModal
        contribution={contribution}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onReported={(dispute) => {
          setIsReportOpen(false);
          setDisputes((current) => [dispute, ...current]);
          setNotice(`Recibimos tu reporte (${dispute.code}). El equipo de Brotar lo revisará pronto.`);
        }}
      />
    </div>
  );
};
