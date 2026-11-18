export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');

export type PaymentMethod = 'card' | 'qr' | 'transfer';

export interface PaymentChargeRequest {
  contributionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  /** Solo para method = 'card'. El numero nunca se guarda. */
  card?: {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
  };
}

export interface PaymentChargeResult {
  approved: boolean;
  /** Referencia de la pasarela; solo viene cuando se aprueba. */
  reference?: string;
  /** Motivo legible del rechazo. */
  declineReason?: string;
}

export interface PaymentRefundRequest {
  contributionId: string;
  /** Referencia del cobro original; sin ella no hay nada que devolver. */
  reference: string | null;
  amount: number;
  currency: string;
  reason: string;
}

export interface PaymentRefundResult {
  refunded: boolean;
  /** Referencia de la devolucion en la pasarela. */
  reference?: string;
}

/**
 * Puerto de cobro. Hoy lo implementa una pasarela simulada; cuando el equipo
 * contrate una real, se cambia el adaptador y no se toca ningun caso de uso.
 */
export interface PaymentGatewayPort {
  charge(request: PaymentChargeRequest): Promise<PaymentChargeResult>;
  /** Devuelve (o anula) un cobro ya aprobado. */
  refund(request: PaymentRefundRequest): Promise<PaymentRefundResult>;
}
