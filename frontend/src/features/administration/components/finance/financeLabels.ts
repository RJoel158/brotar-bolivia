import type {
  DisbursementStatus,
  DiscrepancyType,
  DisputeStatus,
  DisputeType,
  PaymentStatus,
} from '../../../../shared/api/financeApi.ts';

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  expired: 'Expirado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
};

/** Clase de color del badge, alineada con los tokens de estado de Brotar. */
export const paymentStatusTone: Record<PaymentStatus, string> = {
  pending: 'warning',
  confirmed: 'success',
  expired: 'neutral',
  failed: 'error',
  refunded: 'review',
  cancelled: 'neutral',
};

export const discrepancyTypeLabels: Record<DiscrepancyType, string> = {
  amount_mismatch: 'Monto inconsistente',
  missing_in_gateway: 'Operación faltante en pasarela',
  missing_internally: 'Operación faltante en plataforma',
  duplicated: 'Operación duplicada',
};

export const disbursementStatusLabels: Record<DisbursementStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  processing: 'En proceso',
  completed: 'Completado',
  failed: 'Fallido',
  rejected: 'Rechazado',
};

export const disbursementStatusTone: Record<DisbursementStatus, string> = {
  pending: 'warning',
  approved: 'review',
  processing: 'review',
  completed: 'success',
  failed: 'error',
  rejected: 'error',
};

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  open: 'Abierta',
  in_review: 'En revisión',
  resolved: 'Resuelta',
  rejected: 'Rechazada',
};

export const disputeStatusTone: Record<DisputeStatus, string> = {
  open: 'error',
  in_review: 'neutral',
  resolved: 'success',
  rejected: 'neutral',
};

export const disputeTypeLabels: Record<DisputeType, string> = {
  payment_not_recognized: 'Pago no reconocido',
  reward_not_received: 'Recompensa no recibida',
  metrics_discrepancy: 'Discrepancia en métricas',
  project_not_executed: 'Proyecto no ejecutado',
  refund_request: 'Solicitud de reembolso',
  other: 'Otro',
};

export const paymentMethodLabels: Record<string, string> = {
  card: 'Tarjeta',
  qr: 'QR',
  transfer: 'Transferencia',
  // Datos de semilla antiguos guardan el metodo en espanol.
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

export const paymentTypeLabels: Record<string, string> = {
  donation: 'Donación',
  reward: 'Recompensa',
  presale: 'Preventa',
};

export function formatMoney(amount: number, currency = 'BOB'): string {
  return `${currency === 'BOB' ? 'Bs.' : currency} ${new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/** Version compacta para las tarjetas grandes: Bs. 1.2M, Bs. 340K. */
export function formatCompactMoney(amount: number, currency = 'BOB'): string {
  const prefix = currency === 'BOB' ? 'Bs.' : currency;
  if (Math.abs(amount) >= 1_000_000) {
    return `${prefix} ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${prefix} ${Math.round(amount / 1_000)}K`;
  }
  return `${prefix} ${Math.round(amount)}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Descarga un CSV generado en el navegador (boton "Exportar CSV" del Figma). */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csv = [headers, ...rows].map((row) => row.map(escape).join(';')).join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
