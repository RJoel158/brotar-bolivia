import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import {
  contributionsApi,
  type RefundSettlementResult,
  type SettlementCandidate,
} from '../../../../shared/api/contributionsApi.ts';
import { getApiErrorMessage } from '../../../auth/utils/getApiErrorMessage.ts';
import { formatIsoDate } from '../../../creator/campaign-creation/planningValidation.ts';
import { formatMoney } from './financeLabels.ts';
import './FinanceModule.css';

export interface AdminSettlementsPanelProps {
  /** Se llama despues de una devolucion para refrescar el resumen financiero. */
  onRefunded?: () => void;
}

/**
 * Campañas "todo o nada" que cerraron sin alcanzar la meta y todavia tienen
 * aportes cobrados: el admin simula la devolucion a los patrocinadores.
 */
export const AdminSettlementsPanel: FC<AdminSettlementsPanelProps> = ({ onRefunded }) => {
  const [candidates, setCandidates] = useState<SettlementCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    currency: string;
    data: RefundSettlementResult;
  } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setCandidates(await contributionsApi.listSettlementCandidates());
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las campañas por liquidar.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    contributionsApi
      .listSettlementCandidates()
      .then((data) => {
        if (!cancelled) setCandidates(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'No se pudieron cargar las campañas por liquidar.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refund = async (candidate: SettlementCandidate) => {
    setBusyId(candidate.campaignId);
    try {
      const data = await contributionsApi.refundCampaign(candidate.campaignId);
      setResult({ title: candidate.title, currency: candidate.currency, data });
      setConfirmingId(null);
      setError(null);
      await load();
      onRefunded?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo simular la devolución.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="brotar-finance__panel brotar-settlements">
      <div className="brotar-finance__panel-head">
        <div>
          <h2 className="brotar-finance__panel-title">Campañas todo o nada sin meta</h2>
          <p className="brotar-finance__panel-subtitle">
            Cerraron sin alcanzar su meta: los aportes cobrados se devuelven a los patrocinadores.
          </p>
        </div>
        <button
          type="button"
          className="brotar-finance__btn"
          onClick={() => void load()}
          disabled={isLoading}
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {error ? <p className="brotar-finance__error">{error}</p> : null}

      {result ? (
        <p className="brotar-settlements__result" role="status">
          <strong>{result.title}:</strong> se devolvieron {result.data.refundedCount}{' '}
          {result.data.refundedCount === 1 ? 'aporte' : 'aportes'} por{' '}
          {formatMoney(result.data.refundedAmount, result.currency)}
          {result.data.expiredPending > 0
            ? ` y se anularon ${result.data.expiredPending} ${result.data.expiredPending === 1 ? 'pago pendiente' : 'pagos pendientes'}`
            : ''}
          .
          {result.data.gatewayFailures.length > 0
            ? ` La pasarela no confirmó ${result.data.gatewayFailures.length} devoluciones; revísalas en el listado de pagos.`
            : ''}
        </p>
      ) : null}

      {isLoading ? <p className="brotar-finance__state">Cargando campañas…</p> : null}
      {!isLoading && candidates.length === 0 ? (
        <p className="brotar-finance__state">
          No hay campañas todo o nada pendientes de devolución.
        </p>
      ) : null}

      {candidates.length > 0 ? (
        <div className="brotar-finance__table-wrap">
          <table className="brotar-finance__table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Cerró</th>
                <th className="is-numeric">Recaudado / meta</th>
                <th className="is-numeric">Aportes</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const progress =
                  candidate.goalAmount > 0
                    ? Math.round((candidate.confirmedAmount / candidate.goalAmount) * 100)
                    : 0;
                const isConfirming = confirmingId === candidate.campaignId;
                const isBusy = busyId === candidate.campaignId;
                return (
                  <tr key={candidate.campaignId}>
                    <td>
                      <strong>{candidate.title}</strong>
                    </td>
                    <td>{formatIsoDate(candidate.endDate)}</td>
                    <td className="is-numeric">
                      <strong>{formatMoney(candidate.confirmedAmount, candidate.currency)}</strong>
                      <span className="brotar-finance__cell-sub">
                        de {formatMoney(candidate.goalAmount, candidate.currency)} ({progress}%)
                      </span>
                    </td>
                    <td className="is-numeric">
                      {candidate.confirmedCount}
                      {candidate.pendingCount > 0 ? (
                        <span className="brotar-finance__cell-sub">
                          +{candidate.pendingCount} pendientes
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {isConfirming ? (
                        <div className="brotar-settlements__confirm">
                          <span>
                            ¿Devolver {formatMoney(candidate.confirmedAmount, candidate.currency)}?
                          </span>
                          <button
                            type="button"
                            className="brotar-finance__btn brotar-finance__btn--accent brotar-finance__btn--sm"
                            disabled={isBusy}
                            onClick={() => void refund(candidate)}
                          >
                            {isBusy ? 'Procesando…' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            className="brotar-finance__btn brotar-finance__btn--sm"
                            disabled={isBusy}
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="brotar-finance__btn brotar-finance__btn--sm"
                          disabled={busyId !== null}
                          onClick={() => {
                            setResult(null);
                            setConfirmingId(candidate.campaignId);
                          }}
                        >
                          <RotateCcw size={14} /> Simular devolución
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};
