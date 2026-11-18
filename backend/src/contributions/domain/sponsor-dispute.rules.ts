import { BadRequestException, ConflictException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type {
  ContributionView,
  SponsorDisputeType,
  SponsorDisputeView,
} from '../application/ports/contribution.repository.port';

export const SPONSOR_DISPUTE_TYPES: readonly SponsorDisputeType[] = [
  'payment_not_recognized',
  'reward_not_received',
  'project_not_executed',
  'refund_request',
  'other',
];

export const MIN_DISPUTE_DESCRIPTION_LENGTH = 20;
export const MAX_DISPUTE_DESCRIPTION_LENGTH = 1000;

/** Estados de aporte sobre los que tiene sentido reportar un problema. */
const REPORTABLE_STATUSES = new Set(['confirmed', 'refunded', 'failed']);

/** Los reclamos de dinero se atienden primero. */
const HIGH_PRIORITY_TYPES = new Set<SponsorDisputeType>(['payment_not_recognized', 'refund_request']);

export class SponsorDisputeRules {
  public static validateDescription(description: string): string {
    const trimmed = (description ?? '').trim();
    if (trimmed.length < MIN_DISPUTE_DESCRIPTION_LENGTH) {
      throw new BadRequestException(
        `Describe el problema con al menos ${MIN_DISPUTE_DESCRIPTION_LENGTH} caracteres`,
      );
    }
    if (trimmed.length > MAX_DISPUTE_DESCRIPTION_LENGTH) {
      throw new BadRequestException(
        `La descripcion no puede superar los ${MAX_DISPUTE_DESCRIPTION_LENGTH} caracteres`,
      );
    }
    return trimmed;
  }

  public static validateContribution(
    contribution: ContributionView,
    disputeType: SponsorDisputeType,
  ): void {
    if (!REPORTABLE_STATUSES.has(contribution.status)) {
      throw new BadRequestException(
        'Solo puedes reportar problemas de aportes pagados, rechazados o reembolsados',
      );
    }
    if (disputeType === 'reward_not_received' && !contribution.rewardId) {
      throw new BadRequestException('Este aporte no tiene una recompensa asociada');
    }
    if (disputeType === 'reward_not_received' && contribution.status !== 'confirmed') {
      throw new BadRequestException('La recompensa solo se entrega en aportes confirmados');
    }
  }

  public static ensureNoOpenDispute(open: SponsorDisputeView | null): void {
    if (open) {
      throw new ConflictException(
        `Ya tienes un caso abierto para este aporte (${open.code}). Espera la respuesta del equipo.`,
      );
    }
  }

  public static priorityFor(disputeType: SponsorDisputeType): 'medium' | 'high' {
    return HIGH_PRIORITY_TYPES.has(disputeType) ? 'high' : 'medium';
  }

  /** Mismo formato que los casos sembrados: DSP-1234-A. */
  public static generateCode(): string {
    const number = randomInt(1000, 10000);
    const letter = String.fromCharCode(65 + randomInt(0, 26));
    return `DSP-${number}-${letter}`;
  }
}
