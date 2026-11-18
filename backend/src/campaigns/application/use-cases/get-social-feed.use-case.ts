import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { SocialFeedPostDto } from '../dto/social-feed-response.dto';

@Injectable()
export class GetSocialFeedUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(limit = 20): Promise<SocialFeedPostDto[]> {
    // Fetch published campaigns as discovery / spotlight cards in the feed
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'published',
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        location: true,
        short_summary: true,
        problem: true,
        cover_image_url: true,
        goal_amount: true,
        current_amount: true,
        currency: true,
        created_at: true,
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    const campaignPosts: SocialFeedPostDto[] = campaigns.map((c) => {
      const goal = Number(c.goal_amount) || 1;
      const current = Number(c.current_amount) || 0;
      const percentage = Math.min(100, Math.round((current / goal) * 100));
      const estimatedBackers = Math.max(1, Math.round(current / 150)) || 8;

      return {
        id: `campaign-${c.id}`,
        type: 'campaign_spotlight',
        campaignId: c.id,
        campaignTitle: c.title,
        campaignCategory: c.category,
        campaignSlug: c.slug,
        creator: {
          id: c.users.id,
          fullName: c.users.full_name,
          avatarUrl: c.users.avatar_url,
          location: c.location,
          isVerified: true,
        },
        title: c.title,
        body: c.short_summary || c.problem || 'Iniciativa verde comunitaria en desarrollo.',
        imageUrl: c.cover_image_url,
        createdAt: c.created_at.toISOString(),
        metrics: {
          goalAmount: goal,
          currentAmount: current,
          currency: c.currency,
          percentage,
          backersCount: estimatedBackers,
        },
        likesCount: 28 + Math.floor((c.title.length * 5) % 60),
        commentsCount: 5 + Math.floor((c.title.length * 2) % 20),
      };
    });

    return campaignPosts;
  }
}
