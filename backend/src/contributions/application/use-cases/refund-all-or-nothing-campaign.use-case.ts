import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
} from '../ports/contribution.repository.port';
import { PAYMENT_GATEWAY_PORT, type PaymentGatewayPort } from '../ports/payment-gateway.port';

export interface RefundSettlementResult {
  campaignId: string;
  refundedCount: number;
  refundedAmount: number;
  expiredPending: number;
  /** Aportes que la pasarela no pudo devolver y requieren revision manual. */
  gatewayFailures: string[];
}

/**
 * Simula la devolucion de una campana todo-o-nada que cerro sin alcanzar su
 * meta. Primero se registra la devolucion en la base, en una transaccion, y
 * despues se pide a la pasarela que devuelva cada cobro. Con la pasarela
 * simulada la devolucion nunca falla; con una real, los fallos quedan
 * listados para revision manual sin deshacer lo ya registrado.
 */
@Injectable()
export class RefundAllOrNothingCampaignUseCase {
  private readonly logger = new Logger(RefundAllOrNothingCampaignUseCase.name);

  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  public async execute(campaignId: string): Promise<RefundSettlementResult> {
    const settlement = await this.contributionRepository.refundAllOrNothingCampaign(campaignId);

    const gatewayFailures: string[] = [];
    for (const contribution of settlement.refunded) {
      try {
        const result = await this.paymentGateway.refund({
          contributionId: contribution.id,
          reference: contribution.gatewayReference,
          amount: contribution.amount,
          currency: contribution.currency,
          reason: 'La campana todo o nada no alcanzo su meta',
        });
        if (!result.refunded) {
          gatewayFailures.push(contribution.id);
        }
      } catch (error) {
        this.logger.warn(`No se pudo devolver el aporte ${contribution.id}: ${String(error)}`);
        gatewayFailures.push(contribution.id);
      }
    }

    return {
      campaignId,
      refundedCount: settlement.refunded.length,
      refundedAmount: settlement.refundedAmount,
      expiredPending: settlement.expiredPending,
      gatewayFailures,
    };
  }
}
