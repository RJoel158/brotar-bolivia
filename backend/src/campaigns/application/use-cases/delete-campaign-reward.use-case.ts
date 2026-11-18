import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignRewardInUseError } from '../../domain/errors/campaign-reward-in-use.error';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_REWARD_REPOSITORY_PORT } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardRepositoryPort } from '../ports/campaign-reward.repository.port';
import type { DeleteCampaignRewardCommand } from '../dto/campaign-reward.dto';

/**
 * Does not require campaignType = 'reward', so rewards left over after a
 * campaign type change can still be removed.
 */
@Injectable()
export class DeleteCampaignRewardUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
  ) {}

  public async execute(command: DeleteCampaignRewardCommand): Promise<void> {
    const campaign = await this.campaignRepository.findAccessById(command.campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${command.campaignId}" no encontrada.`);
    }

    if (!campaign.isOwnedBy(command.authenticatedUserId)) {
      throw new ForbiddenException(
        'No tienes permiso para gestionar las recompensas de esta campaña.',
      );
    }

    if (!campaign.isEditable()) {
      throw new ConflictException(
        `No se pueden modificar recompensas de una campaña en estado "${campaign.getStatus().getValue()}".`,
      );
    }

    const reward = await this.campaignRewardRepository.findById(command.rewardId);
    if (!reward || !reward.belongsTo(command.campaignId)) {
      throw new NotFoundException('La recompensa no fue encontrada en esta campaña.');
    }

    try {
      await this.campaignRewardRepository.delete(reward.getId());
    } catch (error) {
      if (error instanceof CampaignRewardInUseError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
