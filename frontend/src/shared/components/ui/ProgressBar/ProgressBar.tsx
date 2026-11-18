import './ProgressBar.css';

export interface ProgressBarProps {
  current: number;
  target: number;
  currency?: string;
  percentage?: number;
  className?: string;
}

function formatAmount(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 0,
  }).format(value);
  return `${currency} ${formatted}`;
}

export function ProgressBar({
  current,
  target,
  currency = 'Bs',
  percentage,
  className = '',
}: ProgressBarProps) {
  const computed =
    percentage ?? (target > 0 ? Math.round((current / target) * 100) : 0);
  const clamped = Math.min(100, Math.max(0, computed));

  return (
    <div className={`brotar-progress ${className}`.trim()}>
      <div className="brotar-progress__meta">
        <span>
          {formatAmount(current, currency)} de {formatAmount(target, currency)}
        </span>
        <span className="brotar-progress__percent">{clamped}%</span>
      </div>
      <div
        className="brotar-progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de campaña: ${clamped}%`}
      >
        <div className="brotar-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
