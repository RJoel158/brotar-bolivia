import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_REWARD_REPOSITORY_PORT } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardRepositoryPort } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardResponseDto } from '../dto/campaign-reward-response.dto';
import { toCampaignRewardResponseDto } from '../dto/campaign-reward-mapper';

export interface SetCampaignRewardActiveCommand {
  campaignId: string;
  rewardId: string;
  authenticatedUserId: string;
  isActive: boolean;
}

@Injectable()
export class SetCampaignRewardActiveUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
  ) {}

  public async execute(
    command: SetCampaignRewardActiveCommand,
  ): Promise<CampaignRewardResponseDto> {
    const campaign = await this.campaignRepository.findAccessById(command.campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${command.campaignId}" no encontrada.`);
    }

    if (!campaign.isOwnedBy(command.authenticatedUserId)) {
      throw new ForbiddenException(
        'No tienes permiso para gestionar las recompensas de esta campaña.',
      );
    }

    const reward = await this.campaignRewardRepository.findById(command.rewardId);
    if (!reward || !reward.belongsTo(command.campaignId)) {
      throw new NotFoundException('La recompensa no fue encontrada en esta campaña.');
    }

    reward.setActive(command.isActive);
    const saved = await this.campaignRewardRepository.setActive(reward);
    return toCampaignRewardResponseDto(saved);
  }
}
