import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isRewardSoldOut } from '../../domain/contribution-validation.rules';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type ContributionView,
} from '../ports/contribution.repository.port';
import {
  PAYMENT_GATEWAY_PORT,
  type PaymentChargeRequest,
  type PaymentGatewayPort,
  type PaymentMethod,
} from '../ports/payment-gateway.port';

export interface PayContributionCommand {
  contributionId: string;
  sponsorUserId: string;
  method: PaymentMethod;
  card?: PaymentChargeRequest['card'];
}

export interface PayContributionResult {
  approved: boolean;
  declineReason?: string;
  contribution: ContributionView;
}

/**
 * Segundo paso del checkout: cobra el aporte pendiente contra la pasarela.
 * Si se aprueba, el repositorio confirma el aporte, adjudica el cupo y suma el
 * monto a la campana en una sola transaccion; si se rechaza, el aporte queda
 * fallido con el motivo, sin tocar el recaudado.
 */
@Injectable()
export class PayContributionUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  public async execute(command: PayContributionCommand): Promise<PayContributionResult> {
    const contribution = await this.contributionRepository.findById(command.contributionId);
    if (!contribution) {
      throw new NotFoundException('Aporte no encontrado');
    }
    if (contribution.sponsorUserId !== command.sponsorUserId) {
      throw new ForbiddenException('Este aporte no te pertenece');
    }
    if (contribution.status !== 'pending') {
      throw new BadRequestException('Este aporte ya fue procesado');
    }

    // Evita cobrar cuando ya se sabe que no hay cupo. La garantia real es la
    // comprobacion atomica de confirmPayment: este dato puede quedar viejo.
    if (contribution.rewardId) {
      const reward = await this.contributionRepository.findRewardForCheckout(contribution.rewardId);
      if (!reward || !reward.isActive || isRewardSoldOut(reward)) {
        // No se cobra: el aporte queda rechazado con el motivo y el checkout
        // ofrece elegir otra recompensa o pasar a donacion.
        const reason = 'La recompensa elegida ya no tiene cupos disponibles. No se realizo ningun cobro.';
        const failed = await this.contributionRepository.markFailed(contribution.id, reason);
        return { approved: false, declineReason: reason, contribution: failed };
      }
    }

    const result = await this.paymentGateway.charge({
      contributionId: contribution.id,
      amount: contribution.amount,
      currency: contribution.currency,
      method: command.method,
      card: command.card,
    });

    if (!result.approved || !result.reference) {
      const failed = await this.contributionRepository.markFailed(
        contribution.id,
        result.declineReason ?? 'El pago fue rechazado',
      );
      return {
        approved: false,
        declineReason: result.declineReason ?? 'El pago fue rechazado',
        contribution: failed,
      };
    }

    try {
      const confirmed = await this.contributionRepository.confirmPayment(contribution.id, {
        paymentMethod: command.method,
        gatewayReference: result.reference,
      });
      return { approved: true, contribution: confirmed };
    } catch (error) {
      // La recompensa se agoto entre la comprobacion previa y la confirmacion:
      // se devuelve el cobro y el aporte queda rechazado con el motivo, para que
      // el patrocinador no quede con un aporte pendiente ya cobrado.
      if (!(error instanceof ConflictException) || !contribution.rewardId) {
        throw error;
      }
      await this.paymentGateway.refund({
        contributionId: contribution.id,
        reference: result.reference,
        amount: contribution.amount,
        currency: contribution.currency,
        reason: 'Recompensa agotada antes de confirmar el pago',
      });
      const reason =
        'La recompensa se agoto mientras procesabamos tu pago. Te devolvimos el cobro; puedes elegir otra recompensa o apoyar con una donacion.';
      const failed = await this.contributionRepository.markFailed(contribution.id, reason);
      return { approved: false, declineReason: reason, contribution: failed };
    }
  }
}
