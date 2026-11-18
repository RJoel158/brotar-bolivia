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
import type { UpdateCampaignCommand, UpdateCampaignDto } from '../dto/update-campaign.dto';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';
import type { Campaign, UpdateCampaignDetails } from '../../domain/entities/campaign.entity';

function toOptionalDate(value: string | Date | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

function toDomainChanges(changes: UpdateCampaignDto): UpdateCampaignDetails {
  return {
    ...changes,
    startDate: toOptionalDate(changes.startDate),
    endDate: toOptionalDate(changes.endDate),
  };
}

function changesTypeOrCurrency(campaign: Campaign, changes: UpdateCampaignDto): boolean {
  const typeChanged =
    changes.campaignType !== undefined &&
    changes.campaignType.trim().toLowerCase() !== campaign.getCampaignType();
  const currencyChanged =
    changes.currency !== undefined && (changes.currency.trim() || 'BOB') !== campaign.getCurrency();
  return typeChanged || currencyChanged;
}

@Injectable()
export class UpdateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REWARD_REPOSITORY_PORT)
    private readonly campaignRewardRepository: CampaignRewardRepositoryPort,
  ) {}

  public async execute(command: UpdateCampaignCommand): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findById(command.campaignId);

    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${command.campaignId}" no encontrada.`);
    }

    if (!campaign.isOwnedBy(command.authenticatedUserId)) {
      throw new ForbiddenException('No tienes permiso para editar esta campaña.');
    }

    if (!campaign.isEditable()) {
      throw new ConflictException(
        `No se puede editar una campaña en estado "${campaign.getStatus().getValue()}".`,
      );
    }

    // Rewards are only looked up when the change could leave them inconsistent.
    if (changesTypeOrCurrency(campaign, command.changes)) {
      const rewards = await this.campaignRewardRepository.findByCampaignId(campaign.getId());
      if (rewards.length > 0) {
        throw new ConflictException(
          'No puedes cambiar el tipo ni la moneda de la campaña mientras tenga recompensas. Elimínalas primero.',
        );
      }
    }

    campaign.updateDetails(toDomainChanges(command.changes));
    const savedCampaign = await this.campaignRepository.update(campaign);
    return toCampaignResponseDto(savedCampaign);
  }
}
