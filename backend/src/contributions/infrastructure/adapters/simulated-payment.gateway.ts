import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  PaymentChargeRequest,
  PaymentChargeResult,
  PaymentGatewayPort,
  PaymentRefundRequest,
  PaymentRefundResult,
} from '../../application/ports/payment-gateway.port';

/**
 * Pasarela de pago simulada.
 *
 * No existe integracion real todavia, asi que el resultado se decide por los
 * ultimos cuatro digitos de la tarjeta. Es deterministico a proposito: permite
 * probar el camino feliz y los rechazos sin depender de un servicio externo.
 *
 *   termina en 0000 -> rechazado por fondos insuficientes
 *   termina en 1111 -> rechazado porque la tarjeta esta reportada
 *   termina en 9999 -> rechazado por error de la pasarela
 *   cualquier otro  -> aprobado
 *
 * QR y transferencia se aprueban siempre: representan un pago ya acreditado.
 */
@Injectable()
export class SimulatedPaymentGateway implements PaymentGatewayPort {
  private static readonly DECLINE_REASONS: Record<string, string> = {
    '0000': 'Fondos insuficientes',
    '1111': 'Tarjeta reportada por el emisor',
    '9999': 'La pasarela no pudo procesar el cobro',
  };

  public async charge(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
    if (request.method !== 'card') {
      return { approved: true, reference: this.buildReference(request.method) };
    }

    const card = request.card;
    if (!card) {
      throw new BadRequestException('Faltan los datos de la tarjeta');
    }

    this.validateCard(card);

    const digits = card.number.replace(/\D/g, '');
    const declineReason = SimulatedPaymentGateway.DECLINE_REASONS[digits.slice(-4)];

    // Pequena espera para que el frontend muestre su estado de "procesando".
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (declineReason) {
      return { approved: false, declineReason };
    }

    return { approved: true, reference: this.buildReference('card') };
  }

  /**
   * La devolucion simulada siempre se acepta cuando existe el cobro original:
   * no hay dinero real que mover, solo se deja una referencia de la operacion.
   */
  public async refund(request: PaymentRefundRequest): Promise<PaymentRefundResult> {
    if (!request.reference) {
      return { refunded: false };
    }
    return { refunded: true, reference: this.buildReference('refund') };
  }

  private validateCard(card: NonNullable<PaymentChargeRequest['card']>): void {
    const digits = card.number.replace(/\D/g, '');

    if (digits.length !== 16) {
      throw new BadRequestException('El numero de tarjeta debe tener 16 digitos');
    }
    if (card.holder.trim().length < 3) {
      throw new BadRequestException('El nombre del titular no es valido');
    }
    if (!/^\d{3,4}$/.test(card.cvv)) {
      throw new BadRequestException('El CVV no es valido');
    }

    const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(card.expiry.trim());
    if (!expiryMatch) {
      throw new BadRequestException('La fecha de vencimiento debe tener el formato MM/AA');
    }

    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    if (month < 1 || month > 12) {
      throw new BadRequestException('El mes de vencimiento no es valido');
    }

    // Vence al final del mes indicado.
    const expiresAt = new Date(year, month, 1);
    if (expiresAt <= new Date()) {
      throw new BadRequestException('La tarjeta esta vencida');
    }
  }

  private buildReference(method: string): string {
    const prefixes: Record<string, string> = { card: 'SIMC', qr: 'SIMQ', refund: 'SIMR' };
    const prefix = prefixes[method] ?? 'SIMT';
    return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
