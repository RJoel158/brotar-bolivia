import {
  BadRequestException,
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
import type { UpdateCampaignRewardCommand } from '../dto/campaign-reward.dto';
import type { CampaignRewardResponseDto } from '../dto/campaign-reward-response.dto';
import { toCampaignRewardResponseDto } from '../dto/campaign-reward-mapper';

@Injectable()
export class UpdateCampaignRewardUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
  ) {}

  public async execute(command: UpdateCampaignRewardCommand): Promise<CampaignRewardResponseDto> {
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

    if (campaign.getCampaignType() !== 'reward') {
      throw new ConflictException('Solo las campañas de tipo recompensa pueden tener recompensas.');
    }

    const reward = await this.campaignRewardRepository.findById(command.rewardId);
    if (!reward || !reward.belongsTo(command.campaignId)) {
      throw new NotFoundException('La recompensa no fue encontrada en esta campaña.');
    }

    try {
      reward.updateDetails(command.changes);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Los datos de la recompensa no son válidos.',
      );
    }

    try {
      const saved = await this.campaignRewardRepository.update(reward);
      return toCampaignRewardResponseDto(saved);
    } catch (error) {
      if (error instanceof CampaignRewardInUseError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
