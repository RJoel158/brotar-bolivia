import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { hasAtMostTwoDecimals } from '../../shared/utils/decimal.util';
import type {
  CampaignCheckoutView,
  ContributionType,
  RewardCheckoutView,
} from '../application/ports/contribution.repository.port';

/** Aporte minimo aceptado por la plataforma para donaciones y preventas. */
export const MIN_CONTRIBUTION_AMOUNT = 10;

/** Tope por aporte: evita montos absurdos en el pago simulado. */
export const MAX_CONTRIBUTION_AMOUNT = 1_000_000;

export const MAX_SUPPORTER_MESSAGE_LENGTH = 500;

/** Estados de campana que admiten aportes. */
const CAMPAIGN_OPEN_STATUSES = new Set(['published']);

export function isRewardSoldOut(reward: RewardCheckoutView): boolean {
  return reward.quantityTotal !== null && reward.quantityClaimed >= reward.quantityTotal;
}

export class ContributionValidationRules {
  /** Forma del monto, sin minimo: el minimo depende de si lleva recompensa. */
  public static validateAmountFormat(amount: number): void {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('El monto del aporte no es valido');
    }
    if (amount > MAX_CONTRIBUTION_AMOUNT) {
      throw new BadRequestException('El monto del aporte supera el maximo permitido');
    }
    if (!hasAtMostTwoDecimals(amount)) {
      throw new BadRequestException('El monto no puede tener mas de dos decimales');
    }
  }

  /** Minimo de plataforma para aportes sin recompensa. */
  public static validatePlatformMinimum(amount: number): void {
    if (amount < MIN_CONTRIBUTION_AMOUNT) {
      throw new BadRequestException(`El aporte minimo es de ${MIN_CONTRIBUTION_AMOUNT} BOB`);
    }
  }

  public static validateCampaignAcceptsContributions(campaign: CampaignCheckoutView): void {
    if (!CAMPAIGN_OPEN_STATUSES.has(campaign.status)) {
      throw new BadRequestException('La campana no esta recibiendo aportes en este momento');
    }
    if (campaign.endDate && new Date(campaign.endDate) < new Date()) {
      throw new BadRequestException('La campana ya cerro su periodo de recaudacion');
    }
  }

  public static validateSponsorIsNotOwner(
    campaign: CampaignCheckoutView,
    sponsorUserId: string,
  ): void {
    if (campaign.ownerUserId === sponsorUserId) {
      throw new ForbiddenException('No puedes aportar a tu propia campana');
    }
  }

  /**
   * El tipo de aporte tiene que ser coherente con la campana: una campana de
   * donacion no entrega recompensas ni preventas, y solo un aporte de
   * recompensa puede llevar una recompensa asociada.
   */
  public static validateTypeMatchesCampaign(
    contributionType: ContributionType,
    campaign: CampaignCheckoutView,
    rewardId: string | null,
  ): void {
    if (contributionType !== 'donation' && campaign.campaignType === 'donation') {
      throw new BadRequestException('Esta campana solo acepta donaciones');
    }
    if (contributionType === 'reward' && campaign.campaignType !== 'reward') {
      throw new BadRequestException('Esta campana no ofrece recompensas');
    }
    if (contributionType === 'presale' && campaign.campaignType !== 'presale') {
      throw new BadRequestException('Esta campana no ofrece preventa');
    }
    if (contributionType === 'reward' && !rewardId) {
      throw new BadRequestException('Debes elegir una recompensa');
    }
    if (contributionType !== 'reward' && rewardId) {
      throw new BadRequestException('Solo un aporte de recompensa puede llevar recompensa asociada');
    }
  }

  /**
   * Pertenencia, estado, moneda, minimo y cupo de la recompensa elegida. El
   * cupo se vuelve a comprobar al confirmar el pago: lo visto aqui no lo reserva.
   */
  public static validateReward(
    reward: RewardCheckoutView | null,
    campaign: CampaignCheckoutView,
    amount: number,
  ): void {
    if (!reward || reward.campaignId !== campaign.id) {
      throw new NotFoundException('La recompensa no existe en esta campana');
    }
    if (!reward.isActive) {
      throw new BadRequestException('La recompensa no esta habilitada');
    }
    if (reward.currency !== campaign.currency) {
      throw new BadRequestException('La moneda de la recompensa no coincide con la de la campana');
    }
    if (amount < reward.minimumContribution) {
      throw new BadRequestException(
        `El aporte minimo para esta recompensa es de ${reward.minimumContribution} ${reward.currency}`,
      );
    }
    if (isRewardSoldOut(reward)) {
      throw new ConflictException('La recompensa ya no tiene cupos disponibles');
    }
  }

  public static validateSupporterMessage(message: string | null): void {
    if (message && message.trim().length > MAX_SUPPORTER_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `El mensaje no puede superar los ${MAX_SUPPORTER_MESSAGE_LENGTH} caracteres`,
      );
    }
  }
}
