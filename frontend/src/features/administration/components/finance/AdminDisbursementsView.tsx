import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Landmark,
  Search,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  financeApi,
  type DisbursementsBoard,
  type DisbursementStatus,
} from '../../../../shared/api/financeApi.ts';
import { getApiErrorMessage } from '../../../auth/utils/getApiErrorMessage.ts';
import {
  disbursementStatusLabels,
  disbursementStatusTone,
  formatCompactMoney,
  formatMoney,
} from './financeLabels.ts';
import './FinanceModule.css';

const TABS: { id: DisbursementStatus | ''; label: string }[] = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobados' },
  { id: 'completed', label: 'Procesados' },
  { id: '', label: 'Historial' },
];

/** Pantalla "Desembolsos" (Desembolsos - Brotar Admin). */
export const AdminDisbursementsView: FC = () => {
  const [board, setBoard] = useState<DisbursementsBoard | null>(null);
  const [status, setStatus] = useState<DisbursementStatus | ''>('pending');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setBoard(
        await financeApi.getDisbursements({
          status: status || undefined,
          search: search || undefined,
          limit: 10,
        }),
      );
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los desembolsos.'));
    } finally {
      setIsLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const review = async (
    id: string,
    decision: 'approved' | 'rejected' | 'completed',
    reason?: string,
  ) => {
    setBusyId(id);
    try {
      await financeApi.reviewDisbursement(id, decision, reason);
      await load();
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el desembolso.'));
    } finally {
      setBusyId(null);
    }
  };

  const summary = board?.summary;

  return (
    <div className="brotar-finance">
      <header className="brotar-finance__header">
        <div>
          <h1 className="brotar-finance__title">Desembolsos</h1>
          <p className="brotar-finance__subtitle">
            Gestión y autorización de fondos a creadores.
          </p>
        </div>
        <div className="brotar-finance__search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            placeholder="Buscar campaña..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </header>

      {error ? <p className="brotar-finance__error">{error}</p> : null}

      <section className="brotar-finance__cards">
        <article className="brotar-finance-card brotar-finance-card--tint">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Total pendiente</p>
            <span className="brotar-finance-card__icon">
              <TriangleAlert size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatMoney(summary.totalPending, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot">
            {summary?.pendingCount ?? 0} desembolsos requieren atención
          </p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Completados</p>
            <span className="brotar-finance-card__icon">
              <CircleCheck size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatCompactMoney(summary.completedAmount, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot">Fondos ya liquidados</p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Fallidos / rechazados</p>
            <span className="brotar-finance-card__icon">
              <CircleAlert size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">{summary?.failedOrRejectedCount ?? '—'}</p>
          <p className="brotar-finance-card__foot">Requieren nueva solicitud</p>
        </article>

        <article className="brotar-finance-card brotar-finance-card--dark">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Fondo de garantía</p>
            <span className="brotar-finance-card__icon">
              <Landmark size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatCompactMoney(summary.guaranteeFund, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot">Comisiones retenidas por la plataforma</p>
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
              {tab.id === 'pending' && summary ? ` (${summary.pendingCount})` : ''}
            </button>
          ))}
        </div>

        <div className="brotar-finance__table-wrap">
          <table className="brotar-finance__table">
            <thead>
              <tr>
                <th>Campaña / creador</th>
                <th className="is-numeric">Monto bruto</th>
                <th className="is-numeric">Comisiones</th>
                <th className="is-numeric">Monto neto</th>
                <th>Destino</th>
                <th>Estado</th>
                <th aria-label="Acción" />
              </tr>
            </thead>
            <tbody>
              {board?.disbursements.items.map((row) => (
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
                  <td className="is-numeric">{formatMoney(row.grossAmount, row.currency)}</td>
                  <td className="is-numeric">
                    <span className="brotar-finance__amount-negative">
                      - {formatMoney(row.commissionAmount, row.currency)}
                    </span>
                    <span className="brotar-finance__hint">{row.commissionRate}% Brotar</span>
                  </td>
                  <td className="is-numeric brotar-finance__amount-strong">
                    {formatMoney(row.netAmount, row.currency)}
                  </td>
                  <td>
                    {row.accountVerified && row.bankName ? (
                      <>
                        <strong style={{ display: 'block', fontSize: '0.83rem' }}>
                          {row.bankName}
                        </strong>
                        <span className="brotar-finance__hint">{row.bankAccount}</span>
                      </>
                    ) : (
                      <span className="brotar-finance__hint brotar-finance__hint--alert">
                        <TriangleAlert size={12} /> Cuenta no verificada
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`brotar-finance__badge brotar-finance__badge--${disbursementStatusTone[row.status]}`}
                    >
                      {disbursementStatusLabels[row.status]}
                    </span>
                  </td>
                  <td>
                    {row.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="brotar-finance__btn brotar-finance__btn--sm brotar-finance__btn--dark"
                          disabled={busyId === row.id || !row.accountVerified}
                          title={
                            row.accountVerified
                              ? 'Aprobar el desembolso'
                              : 'No se puede aprobar: la cuenta bancaria no está verificada'
                          }
                          onClick={() => void review(row.id, 'approved')}
                        >
                          <ShieldCheck size={14} />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="brotar-finance__btn brotar-finance__btn--sm"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void review(row.id, 'rejected', 'Rechazado desde el panel de finanzas.')
                          }
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : row.status === 'approved' ? (
                      <button
                        type="button"
                        className="brotar-finance__btn brotar-finance__btn--sm"
                        disabled={busyId === row.id}
                        onClick={() => void review(row.id, 'completed')}
                      >
                        Marcar procesado
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? <p className="brotar-finance__state">Cargando desembolsos…</p> : null}
        {!isLoading && board?.disbursements.items.length === 0 ? (
          <p className="brotar-finance__state">No hay desembolsos en esta pestaña.</p>
        ) : null}

        {board && board.disbursements.total > 0 ? (
          <div className="brotar-finance__pagination">
            <span>
              Mostrando {board.disbursements.items.length} de {board.disbursements.total}{' '}
              desembolsos
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
};
