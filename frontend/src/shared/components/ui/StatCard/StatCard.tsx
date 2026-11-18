import './StatCard.css';

export interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}

export function StatCard({ label, value, detail, className = '' }: StatCardProps) {
  return (
    <article className={`brotar-stat-card ${className}`.trim()}>
      <p className="brotar-stat-card__label">{label}</p>
      <p className="brotar-stat-card__value">{value}</p>
      {detail ? <p className="brotar-stat-card__detail">{detail}</p> : null}
    </article>
  );
}
