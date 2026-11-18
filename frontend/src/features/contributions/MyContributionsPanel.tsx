import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, ListChecks, Receipt, RotateCcw, X } from 'lucide-react';
import {
  contributionsApi,
  type Contribution,
  type ContributionStatus,
  type PaginatedContributions,
} from '../../shared/api/contributionsApi.ts';
import { getApiErrorMessage } from '../auth/utils/getApiErrorMessage.ts';
import { formatIsoDate } from '../creator/campaign-creation/planningValidation.ts';
import {
  contributionStatusLabels,
  contributionStatusTone,
  contributionTypeLabels,
  formatDate,
  formatMoney,
  paymentMethodLabels,
} from './contributionLabels.ts';
import './ContributionsModule.css';

export interface MyContributionsPanelProps {
  /** Abre el detalle de la campaña aportada. */
  onOpenCampaign?: (campaignId: string) => void;
  /** Reanuda el checkout con los datos del aporte (campaña, tipo y recompensa). */
  onResumeCheckout?: (campaignId: string, contributionId: string) => void;
  /** Abre la pantalla de seguimiento del aporte (estado, avances y reportes). */
  onOpenTracking?: (contributionId: string) => void;
  /** Avisa al panel cuando cambia algo (cancelacion) para refrescar las metricas. */
  onChanged?: () => void;
}

const PAGE_SIZE = 10;

const FILTERS: { id: ContributionStatus | ''; label: string }[] = [
  { id: '', label: 'Todos' },
  { id: 'confirmed', label: 'Confirmados' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'failed', label: 'Rechazados' },
  { id: 'refunded', label: 'Reembolsados' },
  { id: 'cancelled', label: 'Cancelados' },
];

/** "Mis aportes": historial del patrocinador con su estado real de pago. */
export const MyContributionsPanel: FC<MyContributionsPanelProps> = ({
  onOpenCampaign,
  onResumeCheckout,
  onOpenTracking,
  onChanged,
}) => {
  const [data, setData] = useState<PaginatedContributions | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [status, setStatus] = useState<ContributionStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await contributionsApi.listMine({ status: status || undefined, page: 1, limit: PAGE_SIZE }));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar tus aportes.'));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (!data) return;
    setIsLoadingMore(true);
    try {
      const next = await contributionsApi.listMine({
        status: status || undefined,
        page: data.page + 1,
        limit: PAGE_SIZE,
      });
      setData({
        ...next,
        // Evita duplicados si entro un aporte nuevo mientras se paginaba.
        items: [
          ...data.items,
          ...next.items.filter((item) => !data.items.some((existing) => existing.id === item.id)),
        ],
      });
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar más aportes.'));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const cancel = async (contribution: Contribution) => {
    setBusyId(contribution.id);
    try {
      await contributionsApi.cancel(contribution.id);
      await load();
      onChanged?.();
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cancelar el aporte.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="brotar-contributions">
      <header className="brotar-contributions__header">
        <div>
          <h3 className="brotar-contributions__title">Mis aportes</h3>
          <p className="brotar-contributions__subtitle">
            Historial de lo que aportaste y el estado de cada pago.
          </p>
        </div>
        <div className="brotar-contributions__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.id || 'all'}
              type="button"
              className={`brotar-contributions__chip ${status === filter.id ? 'is-active' : ''}`}
              onClick={() => setStatus(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="brotar-contributions__error">{error}</p> : null}
      {isLoading ? <p className="brotar-contributions__state">Cargando aportes…</p> : null}

      {!isLoading && data?.items.length === 0 ? (
        <p className="brotar-contributions__state">
          Todavía no tienes aportes en este estado. Explora los proyectos y apoya el que más te
          mueva.
        </p>
      ) : null}

      <ul className="brotar-contributions__list">
        {data?.items.map((contribution) => (
          <li className="brotar-contribution-card" key={contribution.id}>
            <div className="brotar-contribution-card__media">
              {contribution.campaignCoverUrl ? (
                <img src={contribution.campaignCoverUrl} alt="" loading="lazy" />
              ) : (
                <div className="brotar-contribution-card__placeholder" />
              )}
            </div>

            <div className="brotar-contribution-card__body">
              <div className="brotar-contribution-card__top">
                <strong>{contribution.campaignTitle}</strong>
                <span
                  className={`brotar-contributions__badge brotar-contributions__badge--${contributionStatusTone[contribution.status]}`}
                >
                  {contributionStatusLabels[contribution.status]}
                </span>
              </div>

              <p className="brotar-contribution-card__meta">
                {contributionTypeLabels[contribution.contributionType]} ·{' '}
                {formatDate(contribution.paidAt ?? contribution.createdAt)}
                {contribution.paymentMethod
                  ? ` · ${paymentMethodLabels[contribution.paymentMethod] ?? contribution.paymentMethod}`
                  : ''}
                {contribution.gatewayReference ? ` · ${contribution.gatewayReference}` : ''}
              </p>

              {contribution.rewardTitle ? (
                <p className="brotar-contribution-card__meta">
                  Recompensa: <strong>{contribution.rewardTitle}</strong>
                  {contribution.rewardEstimatedDeliveryOn
                    ? ` · entrega estimada ${formatIsoDate(contribution.rewardEstimatedDeliveryOn)}`
                    : ''}
                </p>
              ) : null}

              {contribution.status === 'failed' && contribution.failureReason ? (
                <p className="brotar-contribution-card__reason">{contribution.failureReason}</p>
              ) : null}

              {contribution.status === 'refunded' ? (
                <p className="brotar-contribution-card__refund">
                  Te devolvimos este aporte: la campaña no alcanzó su meta o el cobro se revirtió.
                </p>
              ) : null}

              {contribution.supporterMessage ? (
                <p className="brotar-contribution-card__message">
                  “{contribution.supporterMessage}”
                </p>
              ) : null}
            </div>

            <div className="brotar-contribution-card__side">
              <span className="brotar-contribution-card__amount">
                {formatMoney(contribution.amount, contribution.currency)}
              </span>

              <div className="brotar-contribution-card__actions">
                {onOpenTracking ? (
                  <button
                    type="button"
                    className="brotar-contributions__link"
                    onClick={() => onOpenTracking(contribution.id)}
                  >
                    <ListChecks size={13} /> Seguimiento
                  </button>
                ) : null}
                <button
                  type="button"
                  className="brotar-contributions__link"
                  onClick={() => onOpenCampaign?.(contribution.campaignId)}
                >
                  <ExternalLink size={13} /> Ver proyecto
                </button>

                {contribution.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      className="brotar-contributions__link"
                      onClick={() => onResumeCheckout?.(contribution.campaignId, contribution.id)}
                    >
                      <Receipt size={13} /> Completar pago
                    </button>
                    <button
                      type="button"
                      className="brotar-contributions__link is-danger"
                      disabled={busyId === contribution.id}
                      onClick={() => void cancel(contribution)}
                    >
                      <X size={13} /> Cancelar
                    </button>
                  </>
                ) : null}

                {contribution.status === 'failed' ? (
                  <button
                    type="button"
                    className="brotar-contributions__link"
                    onClick={() => onResumeCheckout?.(contribution.campaignId, contribution.id)}
                  >
                    <RotateCcw size={13} /> Reintentar
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {data && data.total > data.items.length ? (
        <div className="brotar-contributions__more">
          <span>
            Mostrando {data.items.length} de {data.total} aportes.
          </span>
          <button
            type="button"
            className="brotar-checkout__ghost"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
          >
            {isLoadingMore ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      ) : null}
    </section>
  );
};
