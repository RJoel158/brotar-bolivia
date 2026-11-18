import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';
import { PrismaCampaignMapper } from '../../infrastructure/adapters/prisma-campaign.mapper';

@Injectable()
export class GetSuggestedCampaignsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(limit = 5): Promise<CampaignResponseDto[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'published',
      },
      orderBy: { current_amount: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return campaigns.map((record) => {
      const entity = PrismaCampaignMapper.toDomain(record);
      return toCampaignResponseDto(entity);
    });
  }
}
