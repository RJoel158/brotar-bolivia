import type { disbursement_status } from '@prisma/client';

/** Comision que retiene la plataforma sobre cada aporte confirmado. */
export const BROTAR_COMMISSION_RATE = 5;

export const DEFAULT_CURRENCY = 'BOB';

/**
 * Estados en los que el dinero ya esta comprometido pero todavia no salio:
 * son los que suman al "Pendiente de desembolso" del resumen financiero.
 */
export const DISBURSEMENT_BLOCKING_STATUSES: disbursement_status[] = [
  'pending',
  'approved',
  'processing',
];

/** Calcula comision y neto de un monto bruto con la tasa indicada. */
export function splitCommission(
  grossAmount: number,
  rate: number = BROTAR_COMMISSION_RATE,
): { commissionAmount: number; netAmount: number } {
  const commissionAmount = Math.round(grossAmount * rate) / 100;
  return {
    commissionAmount,
    netAmount: Math.round((grossAmount - commissionAmount) * 100) / 100,
  };
}
