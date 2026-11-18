import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type CampaignSupportSummary,
  type ContributionRepositoryPort,
} from '../ports/contribution.repository.port';

/**
 * Totales publicos de apoyo de una campana: cuantos patrocinadores la apoyan,
 * cuanto se confirmo y cuantos cupos lleva adjudicados cada recompensa.
 * Los cupos salen de campaign_rewards.quantity_claimed, que solo incrementa
 * la confirmacion del pago; los aportes pendientes no ocupan cupo.
 */
@Injectable()
export class GetCampaignSupportSummaryUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(campaignId: string): Promise<CampaignSupportSummary> {
    const campaign = await this.contributionRepository.findCampaignForCheckout(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campana no encontrada');
    }

    return this.contributionRepository.getCampaignSupportSummary(campaignId);
  }
}
