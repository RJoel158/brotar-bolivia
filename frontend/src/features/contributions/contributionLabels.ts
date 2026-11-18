import type {
  ContributionStatus,
  ContributionType,
} from '../../shared/api/contributionsApi.ts';

/** Montos sugeridos del checkout, en la moneda de la campana. */
export const SUGGESTED_AMOUNTS = [50, 100, 250, 500];

/** Minimo de plataforma para aportes sin recompensa; con recompensa rige su propio minimo. */
export const MIN_DONATION_AMOUNT = 10;

/** Formato decimal simple: rechaza notacion exponencial y mas de dos decimales. */
export function isTwoDecimalAmount(raw: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(raw.trim());
}

export const contributionTypeLabels: Record<ContributionType, string> = {
  donation: 'Donación',
  reward: 'Recompensa',
  presale: 'Preventa',
};

export const contributionStatusLabels: Record<ContributionStatus, string> = {
  pending: 'Pendiente de pago',
  confirmed: 'Confirmado',
  expired: 'Expirado',
  failed: 'Pago rechazado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
};

export const contributionStatusTone: Record<ContributionStatus, string> = {
  pending: 'warning',
  confirmed: 'success',
  expired: 'neutral',
  failed: 'error',
  refunded: 'review',
  cancelled: 'neutral',
};

export const paymentMethodLabels: Record<string, string> = {
  card: 'Tarjeta',
  qr: 'QR simple',
  transfer: 'Transferencia',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

export const disputeTypeLabels: Record<string, string> = {
  payment_not_recognized: 'No reconozco el pago',
  reward_not_received: 'No recibí mi recompensa',
  project_not_executed: 'El proyecto no se está ejecutando',
  refund_request: 'Quiero la devolución de mi aporte',
  metrics_discrepancy: 'Los resultados no coinciden',
  other: 'Otro problema',
};

export const disputeStatusLabels: Record<string, string> = {
  open: 'Abierto',
  in_review: 'En revisión',
  resolved: 'Resuelto',
  rejected: 'Rechazado',
};

export const disputeStatusTone: Record<string, string> = {
  open: 'warning',
  in_review: 'review',
  resolved: 'success',
  rejected: 'neutral',
};

export function formatMoney(amount: number, currency = 'BOB'): string {
  const prefix = currency === 'BOB' ? 'Bs.' : currency;
  return `${prefix} ${new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
