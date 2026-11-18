import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignReward } from '../../domain/entities/campaign-reward.entity';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_REWARD_REPOSITORY_PORT } from '../ports/campaign-reward.repository.port';
import type { CampaignRewardRepositoryPort } from '../ports/campaign-reward.repository.port';
import type { CreateCampaignRewardDto } from '../dto/campaign-reward.dto';
import type { CampaignRewardResponseDto } from '../dto/campaign-reward-response.dto';
import { toCampaignRewardResponseDto } from '../dto/campaign-reward-mapper';

@Injectable()
export class CreateCampaignRewardUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
  ) {}

  public async execute(dto: CreateCampaignRewardDto): Promise<CampaignRewardResponseDto> {
    const campaign = await this.campaignRepository.findAccessById(dto.campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${dto.campaignId}" no encontrada.`);
    }

    if (!campaign.isOwnedBy(dto.authenticatedUserId)) {
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

    if (dto.id) {
      const existing = await this.campaignRewardRepository.findById(dto.id);
      if (existing) {
        if (!existing.belongsTo(campaign.getId())) {
          throw new ConflictException('El identificador de la recompensa ya está en uso.');
        }
        return toCampaignRewardResponseDto(existing);
      }
    }

    let reward: CampaignReward;
    try {
      reward = CampaignReward.create({
        id: dto.id,
        campaignId: campaign.getId(),
        currency: campaign.getCurrency(),
        title: dto.title,
        description: dto.description,
        minimumContribution: dto.minimumContribution,
        quantityTotal: dto.quantityTotal,
        estimatedDeliveryOn: dto.estimatedDeliveryOn,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Los datos de la recompensa no son válidos.',
      );
    }

    const saved = await this.campaignRewardRepository.save(reward);
    return toCampaignRewardResponseDto(saved);
  }
}
