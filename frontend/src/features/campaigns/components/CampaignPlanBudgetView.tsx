import type { FC } from 'react';
import { useId } from 'react';
import { AlertTriangle, CalendarRange, CheckCircle2, Wallet } from 'lucide-react';
import './CampaignPlanBudgetView.css';

export interface PlanBudgetViewActivity {
  id: string;
  name: string;
  description?: string | null;
  /** Calendar date in YYYY-MM-DD format. */
  startDate: string;
  /** Calendar date in YYYY-MM-DD format. */
  endDate: string;
}

export interface PlanBudgetViewItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface CampaignPlanBudgetViewProps {
  activities: PlanBudgetViewActivity[];
  budgetItems: PlanBudgetViewItem[];
  goalAmount: number | null;
  currency?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(isoDate: string): string {
  return isoDate ? DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00Z`)) : '—';
}

function durationInDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / DAY_MS) + 1;
}

function formatMoney(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return currency === 'BOB' ? `Bs. ${formatted}` : `${formatted} ${currency}`;
}

function sumInCents(items: PlanBudgetViewItem[]): number {
  return items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
}

export const CampaignPlanBudgetView: FC<CampaignPlanBudgetViewProps> = ({
  activities,
  budgetItems,
  goalAmount,
  currency = 'BOB',
}) => {
  const headingId = useId();
  const scheduleTitleId = `${headingId}-schedule`;
  const budgetTitleId = `${headingId}-budget`;
  const totalBudget = sumInCents(budgetItems);
  const hasGoal = goalAmount !== null && goalAmount > 0;
  const exceedsGoal = hasGoal && totalBudget > (goalAmount as number);
  const goalCoverage = hasGoal ? Math.round((totalBudget / (goalAmount as number)) * 100) : null;

  const byCategory = budgetItems.reduce<Map<string, number>>((totals, item) => {
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
    return totals;
  }, new Map());

  const timelineStart = activities.reduce<string | null>(
    (min, activity) => (!min || activity.startDate < min ? activity.startDate : min),
    null,
  );
  const timelineEnd = activities.reduce<string | null>(
    (max, activity) => (!max || activity.endDate > max ? activity.endDate : max),
    null,
  );

  return (
    <div className="plan-budget-view">
      <section className="plan-budget-view__block" aria-labelledby={scheduleTitleId}>
        <header className="plan-budget-view__head">
          <h3 id={scheduleTitleId} className="plan-budget-view__title">
            <CalendarRange size={18} aria-hidden="true" />
            Cronograma de actividades
          </h3>
          {timelineStart && timelineEnd ? (
            <span className="plan-budget-view__meta">
              {formatDate(timelineStart)} – {formatDate(timelineEnd)}
            </span>
          ) : null}
        </header>

        {activities.length === 0 ? (
          <p className="plan-budget-view__empty">No se registraron actividades.</p>
        ) : (
          <ol className="plan-budget-view__timeline">
            {activities.map((activity, index) => {
              const days = durationInDays(activity.startDate, activity.endDate);
              return (
                <li key={activity.id} className="plan-budget-view__phase">
                  <span className="plan-budget-view__phase-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="plan-budget-view__phase-body">
                    <p className="plan-budget-view__phase-name">{activity.name}</p>
                    <p className="plan-budget-view__phase-dates">
                      {formatDate(activity.startDate)} – {formatDate(activity.endDate)}
                      {days ? ` · ${days} ${days === 1 ? 'día' : 'días'}` : ''}
                    </p>
                    {activity.description ? (
                      <p className="plan-budget-view__phase-desc">{activity.description}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="plan-budget-view__block" aria-labelledby={budgetTitleId}>
        <header className="plan-budget-view__head">
          <h3 id={budgetTitleId} className="plan-budget-view__title">
            <Wallet size={18} aria-hidden="true" />
            Presupuesto
          </h3>
          <span className="plan-budget-view__meta">
            {budgetItems.length} {budgetItems.length === 1 ? 'gasto' : 'gastos'}
          </span>
        </header>

        {budgetItems.length === 0 ? (
          <p className="plan-budget-view__empty">No se registraron gastos.</p>
        ) : (
          <>
            <ul className="plan-budget-view__categories" aria-label="Distribución por categoría">
              {[...byCategory.entries()].map(([category, amount]) => {
                const share = totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0;
                return (
                  <li key={category} className="plan-budget-view__category">
                    <div className="plan-budget-view__category-row">
                      <span>{category}</span>
                      <span>
                        {formatMoney(amount, currency)} · {share}%
                      </span>
                    </div>
                    <div className="plan-budget-view__bar" aria-hidden="true">
                      <div className="plan-budget-view__bar-fill" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="plan-budget-view__table-wrap">
              <table className="plan-budget-view__table">
                <thead>
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col">Concepto</th>
                    <th scope="col" className="plan-budget-view__amount">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="plan-budget-view__chip">{item.category}</span>
                      </td>
                      <td>{item.description}</td>
                      <td className="plan-budget-view__amount">
                        {formatMoney(item.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={2}>
                      Total presupuestado
                    </th>
                    <td className="plan-budget-view__amount">
                      <strong>{formatMoney(totalBudget, currency)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {hasGoal && budgetItems.length > 0 ? (
          <p
            className={`plan-budget-view__goal ${exceedsGoal ? 'plan-budget-view__goal--warning' : ''}`}
            role={exceedsGoal ? 'alert' : undefined}
          >
            {exceedsGoal ? (
              <AlertTriangle size={16} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} aria-hidden="true" />
            )}
            <span>
              {exceedsGoal
                ? `El presupuesto supera la meta de ${formatMoney(goalAmount as number, currency)} en ${formatMoney(totalBudget - (goalAmount as number), currency)}.`
                : `El presupuesto cubre el ${goalCoverage}% de la meta de ${formatMoney(goalAmount as number, currency)}.`}
            </span>
          </p>
        ) : null}
      </section>
    </div>
  );
};
