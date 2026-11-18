import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { CAMPAIGN_PLAN_REPOSITORY_PORT } from '../ports/campaign-plan.repository.port';
import type { CampaignPlanRepositoryPort } from '../ports/campaign-plan.repository.port';
import type { CampaignPlanResponseDto } from '../dto/campaign-plan.dto';
import { toCampaignPlanResponseDto } from '../dto/campaign-plan-mapper';
import type { CampaignViewer } from './get-campaign-by-id.use-case';

@Injectable()
export class GetCampaignPlanUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_PLAN_REPOSITORY_PORT)
    private readonly campaignPlanRepository: CampaignPlanRepositoryPort,
  ) {}

  public async execute(
    campaignId: string,
    viewer?: CampaignViewer | null,
  ): Promise<CampaignPlanResponseDto> {
    const campaign = await this.campaignRepository.findAccessById(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${campaignId}" no encontrada.`);
    }

    if (!campaign.getStatus().isPublished()) {
      const canView =
        !!viewer && (campaign.isOwnedBy(viewer.id) || viewer.role === 'admin');
      if (!canView) {
        throw new ForbiddenException('No tienes permiso para ver el plan de esta campaña.');
      }
    }

    const plan = await this.campaignPlanRepository.findByCampaignId(campaign.getId());
    return toCampaignPlanResponseDto(plan, campaign);
  }
}
