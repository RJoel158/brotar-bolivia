import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Landmark,
  Receipt,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { financeApi, type ReconciliationBoard } from '../../../../shared/api/financeApi.ts';
import { getApiErrorMessage } from '../../../auth/utils/getApiErrorMessage.ts';
import { discrepancyTypeLabels, formatDateTime, formatMoney } from './financeLabels.ts';
import './FinanceModule.css';

/** Pantalla "Conciliación de Pagos" (1 Conciliación - Brotar Admin). */
export const AdminReconciliationView: FC = () => {
  const [board, setBoard] = useState<ReconciliationBoard | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setBoard(await financeApi.getReconciliation(statusFilter));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar la conciliación.'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const reconcile = async (id: string) => {
    setResolvingId(id);
    try {
      await financeApi.resolveDiscrepancy(id, 'Conciliado manualmente desde el panel.');
      await load();
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo conciliar la operación.'));
    } finally {
      setResolvingId(null);
    }
  };

  const summary = board?.summary;

  return (
    <div className="brotar-finance">
      <header className="brotar-finance__header">
        <div>
          <h1 className="brotar-finance__title">Conciliación de Pagos</h1>
          <p className="brotar-finance__subtitle">
            Detecta y resuelve discrepancias entre las transacciones registradas en la plataforma y
            los reportes de las pasarelas de pago y entidades financieras.
          </p>
        </div>
        <div className="brotar-finance__actions">
          <button
            type="button"
            className="brotar-finance__btn brotar-finance__btn--dark"
            onClick={() => void load()}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
            Sincronizar pasarelas
          </button>
        </div>
      </header>

      {error ? <p className="brotar-finance__error">{error}</p> : null}

      <section className="brotar-finance__cards">
        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Total recaudado (hoy)</p>
            <span className="brotar-finance-card__icon">
              <Landmark size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatMoney(summary.collectedToday, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot">
            {summary?.successfulToday ?? 0} operaciones confirmadas hoy
          </p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Transacciones</p>
            <span className="brotar-finance-card__icon">
              <Receipt size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">{summary?.transactionsToday ?? '—'}</p>
          <p className="brotar-finance-card__foot brotar-finance-card__foot--success">
            {summary?.successfulToday ?? 0} exitosas
          </p>
        </article>

        <article className="brotar-finance-card brotar-finance-card--alert">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Discrepancias</p>
            <span className="brotar-finance-card__icon">
              <TriangleAlert size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">{summary?.openDiscrepancies ?? '—'}</p>
          <p className="brotar-finance-card__foot brotar-finance-card__foot--alert">
            Requieren atención
          </p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Estado de conciliación</p>
            <span className="brotar-finance-card__icon">
              <ClipboardCheck size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? `${summary.reconciliationRate}%` : '—'}
          </p>
          <p className="brotar-finance-card__foot">
            Último corte: {summary?.lastCutAt ? formatDateTime(summary.lastCutAt) : '—'}
          </p>
        </article>
      </section>

      <section className="brotar-finance__panel">
        <div className="brotar-finance__panel-head">
          <div>
            <h2 className="brotar-finance__panel-title">Discrepancias</h2>
            <p className="brotar-finance__panel-subtitle">
              Diferencias entre el monto interno y el reportado por la pasarela.
            </p>
          </div>
        </div>

        <div className="brotar-finance__tabs">
          {[
            { id: 'pending', label: 'Pendientes' },
            { id: 'resolved', label: 'Conciliadas' },
            { id: '', label: 'Todas' },
          ].map((tab) => (
            <button
              key={tab.id || 'all'}
              type="button"
              className={`brotar-finance__tab ${statusFilter === tab.id ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="brotar-finance__table-wrap">
          <table className="brotar-finance__table">
            <thead>
              <tr>
                <th>Ref. pasarela</th>
                <th>Tipo de discrepancia</th>
                <th className="is-numeric">Monto interno</th>
                <th className="is-numeric">Monto pasarela</th>
                <th>Estado</th>
                <th aria-label="Acción" />
              </tr>
            </thead>
            <tbody>
              {board?.discrepancies.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.gatewayReference}</strong>
                    <span className="brotar-finance__hint">{formatDateTime(row.detectedAt)}</span>
                  </td>
                  <td>{discrepancyTypeLabels[row.discrepancyType]}</td>
                  <td className="is-numeric">
                    {row.internalAmount === null ? '—' : formatMoney(row.internalAmount, row.currency)}
                  </td>
                  <td className="is-numeric">
                    {row.gatewayAmount === null ? '—' : formatMoney(row.gatewayAmount, row.currency)}
                  </td>
                  <td>
                    <span
                      className={`brotar-finance__badge brotar-finance__badge--${
                        row.status === 'pending' ? 'warning' : 'success'
                      }`}
                    >
                      {row.status === 'pending' ? 'Pendiente' : 'Conciliada'}
                    </span>
                  </td>
                  <td>
                    {row.status === 'pending' ? (
                      <button
                        type="button"
                        className="brotar-finance__btn brotar-finance__btn--sm"
                        onClick={() => void reconcile(row.id)}
                        disabled={resolvingId === row.id}
                      >
                        {resolvingId === row.id ? 'Conciliando…' : 'Conciliar'}
                      </button>
                    ) : (
                      <span className="brotar-finance__hint">
                        {row.resolvedAt ? formatDateTime(row.resolvedAt) : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? <p className="brotar-finance__state">Cargando discrepancias…</p> : null}
        {!isLoading && board?.discrepancies.length === 0 ? (
          <p className="brotar-finance__state">No hay discrepancias en este estado.</p>
        ) : null}
      </section>
    </div>
  );
};
