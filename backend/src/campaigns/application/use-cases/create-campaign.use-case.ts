import { Inject, Injectable } from '@nestjs/common';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CreateCampaignDto } from '../dto/create-campaign.dto';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  public async execute(dto: CreateCampaignDto): Promise<CampaignResponseDto> {
    const startDate =
      dto.startDate == null
        ? null
        : dto.startDate instanceof Date
          ? dto.startDate
          : new Date(dto.startDate);
    const endDate =
      dto.endDate == null
        ? null
        : dto.endDate instanceof Date
          ? dto.endDate
          : new Date(dto.endDate);

    const campaign = Campaign.create({
      title: dto.title,
      category: dto.category,
      campaignType: dto.campaignType,
      fundingModel: dto.fundingModel,
      goalAmount: dto.goalAmount,
      ownerUserId: dto.ownerUserId,
      organizationId: dto.organizationId,
      shortSummary: dto.shortSummary,
      coverImageUrl: dto.coverImageUrl,
      location: dto.location,
      currency: dto.currency,
      startDate,
      endDate,
      problem: dto.problem,
      solution: dto.solution,
      beneficiaries: dto.beneficiaries,
      expectedImpact: dto.expectedImpact,
      impactIndicators: dto.impactIndicators,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);
    return toCampaignResponseDto(savedCampaign);
  }
}
