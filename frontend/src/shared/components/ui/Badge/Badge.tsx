import './Badge.css';

export type BadgeVariant =
  | 'confirmed'
  | 'pending'
  | 'review'
  | 'failed'
  | 'expired'
  | 'published';

export interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const DEFAULT_LABELS: Record<BadgeVariant, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  review: 'En revisión',
  failed: 'Fallido',
  expired: 'Expirado',
  published: 'Publicada',
};

export function Badge({ variant, label, className = '' }: BadgeProps) {
  return (
    <span className={`brotar-badge brotar-badge--${variant} ${className}`.trim()}>
      {label ?? DEFAULT_LABELS[variant]}
    </span>
  );
}
