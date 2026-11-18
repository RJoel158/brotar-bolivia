import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CircleCheck, Eye, Hourglass, Scale, Timer } from 'lucide-react';
import {
  financeApi,
  type DisputeDetail,
  type DisputesBoard,
  type DisputeStatus,
} from '../../../../shared/api/financeApi.ts';
import { getApiErrorMessage } from '../../../auth/utils/getApiErrorMessage.ts';
import {
  disputeStatusLabels,
  disputeStatusTone,
  disputeTypeLabels,
  formatDate,
  formatDateTime,
  formatMoney,
} from './financeLabels.ts';
import './FinanceModule.css';

const TABS: { id: DisputeStatus | ''; label: string }[] = [
  { id: '', label: 'Todas' },
  { id: 'open', label: 'Abiertas' },
  { id: 'in_review', label: 'En revisión' },
  { id: 'resolved', label: 'Resueltas' },
];

/**
 * Pantalla "Disputas" mas el detalle del caso (Disputas DETALLE CASO).
 * El detalle se muestra en la misma vista para no sacar al admin del panel.
 */
export const AdminDisputesView: FC = () => {
  const [board, setBoard] = useState<DisputesBoard | null>(null);
  const [status, setStatus] = useState<DisputeStatus | ''>('');
  const [selected, setSelected] = useState<DisputeDetail | null>(null);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setBoard(await financeApi.getDisputes({ status: status || undefined, limit: 10 }));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las disputas.'));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCase = async (id: string) => {
    try {
      setSelected(await financeApi.getDisputeDetail(id));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo abrir el caso.'));
    }
  };

  const sendReply = async () => {
    if (!selected || reply.trim().length === 0) return;
    setIsBusy(true);
    try {
      await financeApi.replyDispute(selected.id, reply);
      setReply('');
      setSelected(await financeApi.getDisputeDetail(selected.id));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el mensaje.'));
    } finally {
      setIsBusy(false);
    }
  };

  const decide = async (decision: 'resolved' | 'in_review') => {
    if (!selected) return;
    setIsBusy(true);
    try {
      const updated = await financeApi.resolveDispute(
        selected.id,
        decision,
        decision === 'resolved' ? reply.trim() || undefined : undefined,
      );
      setSelected(updated);
      setReply('');
      await load();
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el caso.'));
    } finally {
      setIsBusy(false);
    }
  };

  // ------------------------------------------------------------ Detalle

  if (selected) {
    return (
      <div className="brotar-finance">
        <button type="button" className="brotar-finance__case-back" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} />
          Volver a la bandeja
        </button>

        <header className="brotar-finance__header">
          <div>
            <h1 className="brotar-finance__title">Soporte y Disputas</h1>
            <p className="brotar-finance__subtitle">
              Caso {selected.code} · {selected.campaignTitle}
            </p>
          </div>
          <span
            className={`brotar-finance__badge brotar-finance__badge--${disputeStatusTone[selected.status]}`}
          >
            {disputeStatusLabels[selected.status]}
          </span>
        </header>

        {error ? <p className="brotar-finance__error">{error}</p> : null}

        <div className="brotar-finance__case">
          <section>
            <h2 className="brotar-finance__panel-title" style={{ marginBottom: 16 }}>
              Información del caso
            </h2>

            <div className="brotar-finance__case-field">
              <span>Tipo de caso</span>
              <p>{disputeTypeLabels[selected.disputeType]}</p>
              <small>{formatDate(selected.openedAt)}</small>
            </div>

            <div className="brotar-finance__case-field">
              <span>Reclamante</span>
              <p>{selected.reporterName}</p>
            </div>

            <div className="brotar-finance__case-field">
              <span>Operación vinculada</span>
              <p>
                {selected.contributionAmount !== null
                  ? `${formatMoney(selected.contributionAmount, selected.currency)}${
                      selected.linkedOperation ? ` · ${selected.linkedOperation}` : ''
                    }`
                  : 'Sin operación vinculada'}
              </p>
            </div>

            <div className="brotar-finance__case-field">
              <span>Descripción del problema</span>
              <p>{selected.description}</p>
            </div>

            {selected.resolution ? (
              <div className="brotar-finance__case-field">
                <span>Resolución</span>
                <p>{selected.resolution}</p>
              </div>
            ) : null}
          </section>

          <section className="brotar-finance__thread">
            {selected.messages.map((message, index) => (
              <article className="brotar-finance__message" key={message.id}>
                <div className="brotar-finance__message-head">
                  <span
                    className={`brotar-finance__message-avatar ${message.isSystem ? 'is-system' : ''}`}
                  >
                    {index + 1}
                  </span>
                  <strong>{message.authorName}</strong>
                </div>
                <p className="brotar-finance__message-date">{formatDateTime(message.createdAt)}</p>
                <p className="brotar-finance__message-body">{message.body}</p>
              </article>
            ))}

            {selected.status !== 'resolved' ? (
              <div className="brotar-finance__reply">
                <h4>Acciones críticas</h4>
                <textarea
                  value={reply}
                  placeholder="Escribe una respuesta o la nota de resolución…"
                  onChange={(event) => setReply(event.target.value)}
                />
                <div className="brotar-finance__reply-actions">
                  <button
                    type="button"
                    className="brotar-finance__btn"
                    disabled={isBusy || reply.trim().length === 0}
                    onClick={() => void sendReply()}
                  >
                    Responder
                  </button>
                  <button
                    type="button"
                    className="brotar-finance__btn brotar-finance__btn--dark"
                    disabled={isBusy}
                    onClick={() => void decide('resolved')}
                  >
                    <CircleCheck size={15} />
                    Resolver caso
                  </button>
                  <button
                    type="button"
                    className="brotar-finance__btn"
                    disabled={isBusy || selected.status === 'in_review'}
                    onClick={() => void decide('in_review')}
                  >
                    Escalar caso
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ Bandeja

  const summary = board?.summary;

  return (
    <div className="brotar-finance">
      <header className="brotar-finance__header">
        <div>
          <h1 className="brotar-finance__title">Disputas</h1>
          <p className="brotar-finance__subtitle">Bandeja de casos activos con prioridad.</p>
        </div>
      </header>

      {error ? <p className="brotar-finance__error">{error}</p> : null}

      <section className="brotar-finance__cards">
        <article className="brotar-finance-card brotar-finance-card--tint">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Disputas activas</p>
            <span className="brotar-finance-card__icon">
              <Scale size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">{summary?.active ?? '—'}</p>
          <p className="brotar-finance-card__foot">Requieren acción</p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">En revisión</p>
            <span className="brotar-finance-card__icon">
              <Hourglass size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">{summary?.inReview ?? '—'}</p>
          <p className="brotar-finance-card__foot">Escaladas a soporte</p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Resueltas (mes)</p>
            <span className="brotar-finance-card__icon">
              <CircleCheck size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">{summary?.resolvedThisMonth ?? '—'}</p>
          <p className="brotar-finance-card__foot">Cerradas este mes</p>
        </article>

        <article className="brotar-finance-card brotar-finance-card--dark">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Tiempo de respuesta promedio</p>
            <span className="brotar-finance-card__icon">
              <Timer size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary?.averageResponseHours !== null && summary
              ? `${summary.averageResponseHours}h`
              : '—'}
          </p>
          <p className="brotar-finance-card__foot">Desde la apertura hasta la resolución</p>
        </article>
      </section>

      <section className="brotar-finance__panel">
        <div className="brotar-finance__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id || 'all'}
              type="button"
              className={`brotar-finance__tab ${status === tab.id ? 'is-active' : ''}`}
              onClick={() => setStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="brotar-finance__table-wrap">
          <table className="brotar-finance__table">
            <thead>
              <tr>
                <th>Proyecto / creador</th>
                <th>Patrocinador</th>
                <th>Tipo de incidencia</th>
                <th>Fecha / ID</th>
                <th>Estado</th>
                <th aria-label="Acción" />
              </tr>
            </thead>
            <tbody>
              {board?.disputes.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="brotar-finance__project">
                      {row.campaignCoverUrl ? (
                        <img src={row.campaignCoverUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="brotar-finance__project-placeholder" />
                      )}
                      <div>
                        <strong>{row.campaignTitle}</strong>
                        <span>{row.creatorName}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.85rem' }}>{row.reporterName}</strong>
                    <span className="brotar-finance__hint">
                      {row.contributionAmount !== null
                        ? `Aporte: ${formatMoney(row.contributionAmount, row.currency)}`
                        : 'Sin aporte vinculado'}
                    </span>
                  </td>
                  <td>{disputeTypeLabels[row.disputeType]}</td>
                  <td>
                    {formatDate(row.openedAt)}
                    <span className="brotar-finance__hint">#{row.code}</span>
                  </td>
                  <td>
                    <span
                      className={`brotar-finance__badge brotar-finance__badge--${disputeStatusTone[row.status]}`}
                    >
                      {disputeStatusLabels[row.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="brotar-finance__btn brotar-finance__btn--sm"
                      onClick={() => void openCase(row.id)}
                    >
                      <Eye size={14} />
                      Ver caso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? <p className="brotar-finance__state">Cargando disputas…</p> : null}
        {!isLoading && board?.disputes.items.length === 0 ? (
          <p className="brotar-finance__state">No hay disputas en este estado.</p>
        ) : null}

        {board && board.disputes.total > 0 ? (
          <div className="brotar-finance__pagination">
            <span>
              Mostrando {board.disputes.items.length} de {board.disputes.total} disputas
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
};
