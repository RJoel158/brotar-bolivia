import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BROTAR_COMMISSION_RATE,
  splitCommission,
} from '../../../finance/domain/finance.constants';
import { ContributionValidationRules } from '../../domain/contribution-validation.rules';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type ContributionType,
  type ContributionView,
} from '../ports/contribution.repository.port';

export interface CreateContributionCommand {
  campaignId: string;
  sponsorUserId: string;
  amount: number;
  contributionType: ContributionType;
  rewardId?: string | null;
  supporterMessage?: string | null;
  isAnonymous?: boolean;
}

/**
 * Primer paso del checkout: deja el aporte registrado como pendiente de pago.
 * La comision se calcula aqui y se congela, para que un cambio futuro de la
 * tasa no altere aportes ya hechos. Un aporte pendiente no reserva cupo.
 */
@Injectable()
export class CreateContributionUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(command: CreateContributionCommand): Promise<ContributionView> {
    const campaign = await this.contributionRepository.findCampaignForCheckout(command.campaignId);
    if (!campaign) {
      throw new NotFoundException('Campana no encontrada');
    }

    const rewardId = command.rewardId ?? null;
    const message = command.supporterMessage?.trim() || null;

    ContributionValidationRules.validateAmountFormat(command.amount);
    ContributionValidationRules.validateCampaignAcceptsContributions(campaign);
    ContributionValidationRules.validateSponsorIsNotOwner(campaign, command.sponsorUserId);
    ContributionValidationRules.validateTypeMatchesCampaign(
      command.contributionType,
      campaign,
      rewardId,
    );
    ContributionValidationRules.validateSupporterMessage(message);
    if (!rewardId) {
      ContributionValidationRules.validatePlatformMinimum(command.amount);
    }

    const { commissionAmount, netAmount } = splitCommission(command.amount);

    const data = {
      campaignId: campaign.id,
      sponsorUserId: command.sponsorUserId,
      amount: command.amount,
      commissionRate: BROTAR_COMMISSION_RATE,
      commissionAmount,
      netAmount,
      currency: campaign.currency,
      contributionType: command.contributionType,
      rewardId,
      supporterMessage: message,
      isAnonymous: command.isAnonymous ?? false,
    };

    if (!rewardId) {
      return this.contributionRepository.create(data);
    }
    return this.contributionRepository.create(data, (reward) =>
      ContributionValidationRules.validateReward(reward, campaign, command.amount),
    );
  }
}
