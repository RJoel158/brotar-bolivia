import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { CampaignStoryItemDto } from '../dto/campaign-story-response.dto';

@Injectable()
export class GetCampaignStoriesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(limit = 10): Promise<CampaignStoryItemDto[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'published',
      },
      orderBy: { updated_at: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        cover_image_url: true,
        goal_amount: true,
        current_amount: true,
        updated_at: true,
        users: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
        campaign_updates: {
          where: { visibility: 'public' },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            title: true,
            body: true,
            image_url: true,
            created_at: true,
          },
        },
      },
    });

    return campaigns.map((c) => {
      const goal = Number(c.goal_amount) || 1;
      const current = Number(c.current_amount) || 0;
      const progress = Math.min(100, Math.round((current / goal) * 100));
      const latestUpdate = c.campaign_updates[0];

      return {
        id: `story-${c.id}`,
        campaignId: c.id,
        campaignTitle: c.title,
        creatorName: c.users.full_name,
        creatorAvatarUrl: c.users.avatar_url,
        coverImageUrl: latestUpdate?.image_url || c.cover_image_url,
        category: c.category,
        isUnread: true,
        latestUpdateTitle: latestUpdate?.title ?? 'Brote activo',
        latestUpdateBody: latestUpdate?.body ?? null,
        latestUpdateImageUrl: latestUpdate?.image_url ?? null,
        progressPercentage: progress,
        createdAt: latestUpdate?.created_at?.toISOString() || c.updated_at.toISOString(),
      };
    });
  }
}
