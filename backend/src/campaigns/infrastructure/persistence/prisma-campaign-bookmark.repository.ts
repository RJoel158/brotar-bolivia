import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type {
  BookmarkKind,
  CampaignBookmarkRecord,
  CampaignBookmarkRepositoryPort,
} from '../../application/ports/campaign-bookmark.repository.port';

@Injectable()
export class PrismaCampaignBookmarkRepository implements CampaignBookmarkRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async upsert(
    userId: string,
    campaignId: string,
    kind: BookmarkKind = 'FAVORITE',
  ): Promise<CampaignBookmarkRecord> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true },
    });
    if (!campaign) {
      throw new NotFoundException('La campaña no existe.');
    }
    if (campaign.status !== 'published') {
      throw new NotFoundException('Solo puedes guardar campañas publicadas.');
    }

    await this.prisma.campaign_bookmarks.upsert({
      where: {
        user_id_campaign_id_kind: {
          user_id: userId,
          campaign_id: campaignId,
          kind,
        },
      },
      create: { user_id: userId, campaign_id: campaignId, kind },
      update: {},
    });

    const listed = await this.listByUserId(userId, kind);
    const found = listed.find((item) => item.campaignId === campaignId);
    if (!found) {
      throw new NotFoundException('No se pudo leer el favorito recién guardado.');
    }
    return found;
  }

  public async remove(
    userId: string,
    campaignId: string,
    kind: BookmarkKind = 'FAVORITE',
  ): Promise<boolean> {
    const result = await this.prisma.campaign_bookmarks.deleteMany({
      where: { user_id: userId, campaign_id: campaignId, kind },
    });
    return result.count > 0;
  }

  public async exists(
    userId: string,
    campaignId: string,
    kind: BookmarkKind = 'FAVORITE',
  ): Promise<boolean> {
    const row = await this.prisma.campaign_bookmarks.findUnique({
      where: {
        user_id_campaign_id_kind: {
          user_id: userId,
          campaign_id: campaignId,
          kind,
        },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  public async listCampaignIdsByUserId(
    userId: string,
    kind: BookmarkKind = 'FAVORITE',
  ): Promise<string[]> {
    const rows = await this.prisma.campaign_bookmarks.findMany({
      where: { user_id: userId, kind },
      select: { campaign_id: true },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((row) => row.campaign_id);
  }

  public async listByUserId(
    userId: string,
    kind: BookmarkKind = 'FAVORITE',
  ): Promise<CampaignBookmarkRecord[]> {
    const rows = await this.prisma.campaign_bookmarks.findMany({
      where: { user_id: userId, kind },
      orderBy: { created_at: 'desc' },
      include: {
        campaigns: {
          select: {
            title: true,
            slug: true,
            cover_image_url: true,
            status: true,
            goal_amount: true,
            current_amount: true,
            currency: true,
            campaign_updates: {
              where: { visibility: 'public' },
              orderBy: { created_at: 'desc' },
              take: 1,
              select: { title: true, created_at: true },
            },
          },
        },
      },
    });

    return rows.map((row) => {
      const goal = Number(row.campaigns.goal_amount) || 0;
      const current = Number(row.campaigns.current_amount) || 0;
      const latest = row.campaigns.campaign_updates[0] ?? null;
      return {
        id: row.id,
        userId: row.user_id,
        campaignId: row.campaign_id,
        kind: row.kind,
        createdAt: row.created_at,
        campaignTitle: row.campaigns.title,
        campaignSlug: row.campaigns.slug,
        campaignCoverImageUrl: row.campaigns.cover_image_url,
        campaignStatus: row.campaigns.status,
        campaignGoalAmount: goal,
        campaignCurrentAmount: current,
        campaignCurrency: row.campaigns.currency,
        latestUpdateTitle: latest?.title ?? null,
        latestUpdateAt: latest?.created_at ?? null,
      };
    });
  }
}
