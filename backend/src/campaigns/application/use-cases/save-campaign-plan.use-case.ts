import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignPlan } from '../../domain/entities/campaign-plan.entity';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_PLAN_REPOSITORY_PORT } from '../ports/campaign-plan.repository.port';
import type { CampaignPlanRepositoryPort } from '../ports/campaign-plan.repository.port';
import type { CampaignPlanResponseDto, SaveCampaignPlanCommand } from '../dto/campaign-plan.dto';
import { toCampaignPlanResponseDto } from '../dto/campaign-plan-mapper';

@Injectable()
export class SaveCampaignPlanUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_PLAN_REPOSITORY_PORT)
    private readonly campaignPlanRepository: CampaignPlanRepositoryPort,
  ) {}

  public async execute(command: SaveCampaignPlanCommand): Promise<CampaignPlanResponseDto> {
    const campaign = await this.campaignRepository.findAccessById(command.campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${command.campaignId}" no encontrada.`);
    }

    if (!campaign.isOwnedBy(command.authenticatedUserId)) {
      throw new ForbiddenException('No tienes permiso para editar el plan de esta campaña.');
    }

    if (!campaign.isEditable()) {
      throw new ConflictException(
        `No se puede editar el plan de una campaña en estado "${campaign.getStatus().getValue()}".`,
      );
    }

    let plan: CampaignPlan;
    try {
      plan = CampaignPlan.create({
        campaignId: campaign.getId(),
        activities: command.activities,
        budgetItems: command.budgetItems,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Los datos del plan no son válidos.',
      );
    }

    const saved = await this.campaignPlanRepository.replace(plan);
    return toCampaignPlanResponseDto(saved, campaign);
  }
}
