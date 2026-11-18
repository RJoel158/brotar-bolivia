import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Landmark,
  PieChart,
  RefreshCw,
  Search,
  SendHorizontal,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import {
  financeApi,
  type FinanceSummary,
  type Paginated,
  type Payment,
} from '../../../../shared/api/financeApi.ts';
import { getApiErrorMessage } from '../../../auth/utils/getApiErrorMessage.ts';
import {
  downloadCsv,
  formatCompactMoney,
  formatDate,
  formatMoney,
  paymentMethodLabels,
  paymentStatusLabels,
  paymentStatusTone,
  paymentTypeLabels,
} from './financeLabels.ts';
import { AdminSettlementsPanel } from './AdminSettlementsPanel.tsx';
import './FinanceModule.css';

const PAGE_SIZE = 8;

/** Pantalla "Resumen Financiero" del Figma (Finanzas - Brotar Admin). */
export const AdminFinanceView: FC = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [payments, setPayments] = useState<Paginated<Payment> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El resumen (5 agregaciones) se carga aparte: buscar o paginar solo pide la
  // pagina de pagos, en vez de recalcular todo el resumen cada vez (QA finanzas).
  const loadSummary = useCallback(async () => {
    try {
      setSummary(await financeApi.getSummary());
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar el resumen financiero.'));
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      setPayments(
        await financeApi.listPayments({ search: search || undefined, page, limit: PAGE_SIZE }),
      );
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los pagos.'));
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  const load = useCallback(async () => {
    await Promise.all([loadSummary(), loadPayments()]);
  }, [loadSummary, loadPayments]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = setTimeout(() => void loadPayments(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadPayments, search]);

  /** Exporta TODOS los pagos que coinciden con la busqueda, no solo la pagina visible. */
  const exportCsv = async () => {
    if (!payments || payments.total === 0) return;
    setIsExporting(true);
    try {
      const all: Payment[] = [];
      const limit = 100;
      for (let exportPage = 1; ; exportPage += 1) {
        const chunk = await financeApi.listPayments({
          search: search || undefined,
          page: exportPage,
          limit,
        });
        all.push(...chunk.items);
        if (all.length >= chunk.total || chunk.items.length < limit) break;
      }
      downloadCsv(
        `brotar-pagos-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Proyecto',
          'Patrocinador',
          'Fecha',
          'Tipo',
          'Recompensa',
          'Método',
          'Código de operación',
          'Monto',
          'Comisión',
          'Neto al proyecto',
          'Moneda',
          'Estado',
          'Motivo de rechazo',
        ],
        all.map((payment) => [
          payment.campaignTitle,
          payment.sponsorName,
          formatDate(payment.paidAt ?? payment.createdAt),
          paymentTypeLabels[payment.contributionType] ?? payment.contributionType,
          payment.rewardTitle ?? '',
          payment.paymentMethod ? (paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod) : '',
          payment.gatewayReference ?? '',
          payment.amount,
          payment.commissionAmount,
          payment.netAmount,
          payment.currency,
          paymentStatusLabels[payment.status],
          payment.failureReason ?? '',
        ]),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo exportar el CSV.'));
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = payments ? Math.max(1, Math.ceil(payments.total / payments.limit)) : 1;

  return (
    <div className="brotar-finance">
      <header className="brotar-finance__header">
        <div>
          <h1 className="brotar-finance__title">Resumen Financiero</h1>
          <p className="brotar-finance__subtitle">
            Estado de cuentas y recaudación de campañas.
          </p>
        </div>
        <div className="brotar-finance__actions">
          <button
            type="button"
            className="brotar-finance__btn"
            onClick={() => void exportCsv()}
            disabled={!payments || payments.items.length === 0 || isExporting}
          >
            <Download size={16} />
            {isExporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
          <button
            type="button"
            className="brotar-finance__btn brotar-finance__btn--accent"
            onClick={() => void load()}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
            Sincronizar
          </button>
        </div>
      </header>

      {error ? <p className="brotar-finance__error">{error}</p> : null}

      <section className="brotar-finance__cards">
        <article className="brotar-finance-card brotar-finance-card--dark">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Recaudación bruta</p>
            <span className="brotar-finance-card__icon">
              <Landmark size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatCompactMoney(summary.grossCollected, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot">
            {summary?.growthVsPreviousMonth !== null && summary ? (
              <>
                <TrendingUp size={14} />
                {summary.growthVsPreviousMonth > 0 ? '+' : ''}
                {summary.growthVsPreviousMonth}% vs mes anterior
              </>
            ) : (
              'Sin histórico del mes anterior'
            )}
          </p>
        </article>

        <article className="brotar-finance-card">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Comisiones Brotar (5%)</p>
            <span className="brotar-finance-card__icon">
              <PieChart size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatCompactMoney(summary.platformCommission, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot">Ingresos operativos confirmados</p>
        </article>

        <article className="brotar-finance-card brotar-finance-card--tint">
          <div className="brotar-finance-card__head">
            <p className="brotar-finance-card__label">Pendiente de desembolso</p>
            <span className="brotar-finance-card__icon">
              <SendHorizontal size={16} />
            </span>
          </div>
          <p className="brotar-finance-card__value">
            {summary ? formatCompactMoney(summary.pendingDisbursement, summary.currency) : '—'}
          </p>
          <p className="brotar-finance-card__foot brotar-finance-card__foot--alert">
            <TriangleAlert size={14} />
            {summary?.campaignsAwaitingDisbursement ?? 0} campañas en espera
          </p>
        </article>
      </section>

      <section className="brotar-finance__panel">
        <div className="brotar-finance__panel-head">
          <div>
            <h2 className="brotar-finance__panel-title">Listado de pagos recibidos</h2>
            <p className="brotar-finance__panel-subtitle">
              Estado de recaudación y liquidación por proyecto activo.
            </p>
          </div>
          <div className="brotar-finance__search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Buscar proyecto..."
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="brotar-finance__table-wrap">
          <table className="brotar-finance__table">
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Patrocinador</th>
                <th>Fecha</th>
                <th>Tipo / método</th>
                <th className="is-numeric">Monto</th>
                <th className="is-numeric">Comisión</th>
                <th className="is-numeric">Neto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments?.items.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <strong>{payment.campaignTitle}</strong>
                    {payment.gatewayReference ? (
                      <span className="brotar-finance__cell-sub">{payment.gatewayReference}</span>
                    ) : null}
                  </td>
                  <td>{payment.sponsorName}</td>
                  <td>{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                  <td>
                    {paymentTypeLabels[payment.contributionType] ?? payment.contributionType}
                    <span className="brotar-finance__cell-sub">
                      {payment.rewardTitle
                        ? payment.rewardTitle
                        : payment.paymentMethod
                          ? (paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod)
                          : 'Sin pago'}
                    </span>
                  </td>
                  <td className="is-numeric brotar-finance__amount-strong">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>
                  <td className="is-numeric">{formatMoney(payment.commissionAmount, payment.currency)}</td>
                  <td className="is-numeric">{formatMoney(payment.netAmount, payment.currency)}</td>
                  <td>
                    <span
                      className={`brotar-finance__badge brotar-finance__badge--${paymentStatusTone[payment.status]}`}
                      title={payment.failureReason ?? undefined}
                    >
                      {paymentStatusLabels[payment.status]}
                    </span>
                    {payment.failureReason ? (
                      <span className="brotar-finance__cell-sub">{payment.failureReason}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? <p className="brotar-finance__state">Cargando pagos…</p> : null}
        {!isLoading && payments?.items.length === 0 ? (
          <p className="brotar-finance__state">No hay pagos que coincidan con la búsqueda.</p>
        ) : null}

        {payments && payments.total > 0 ? (
          <div className="brotar-finance__pagination">
            <span>
              Mostrando {(payments.page - 1) * payments.limit + 1}-
              {Math.min(payments.page * payments.limit, payments.total)} de {payments.total}
            </span>
            <button
              type="button"
              className="brotar-finance__page-btn"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="brotar-finance__page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </section>

      <AdminSettlementsPanel onRefunded={() => void load()} />
    </div>
  );
};
