import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_REWARD_REPOSITORY_PORT } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardRepositoryPort } from '../ports/campaign-reward.repository.port';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

import { USER_REPOSITORY_PORT } from '../../../users/application/ports/user.repository.port';
import type { UserRepositoryPort } from '../../../users/application/ports/user.repository.port';

@Injectable()
export class SubmitCampaignForReviewUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  public async execute(
    campaignId: string,
    authenticatedUserId: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findById(campaignId);

    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${campaignId}" no encontrada.`);
    }

    if (!campaign.isOwnedBy(authenticatedUserId)) {
      throw new ForbiddenException('No tienes permiso para enviar esta campaña a revisión.');
    }

    // Read current verification from persistence; JWT claims may be stale.
    const owner = await this.userRepository.findById(authenticatedUserId);
    if (!owner || !owner.isActive() || !owner.isVerified()) {
      throw new ForbiddenException('Debes tener tu verificación KYC aprobada y tu cuenta activa para enviar una campaña a revisión.');
    }

    try {
      campaign.submitForReview();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar a revisión.';
      throw new ConflictException(message);
    }

    if (campaign.getCampaignType() === 'reward') {
      const rewards = await this.campaignRewardRepository.findByCampaignId(campaign.getId());
      if (!rewards.some((reward) => reward.isValidForReview())) {
        throw new ConflictException(
          'Una campaña de recompensas necesita al menos una recompensa válida guardada para enviarse a revisión.',
        );
      }
    }

    const saved = await this.campaignRepository.update(campaign);
    return toCampaignResponseDto(saved);
  }
}
