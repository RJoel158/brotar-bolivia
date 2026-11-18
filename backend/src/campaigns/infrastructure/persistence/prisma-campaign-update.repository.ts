import { Injectable } from '@nestjs/common';
import { visibility_scope } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import { CampaignUpdate } from '../../domain/entities/campaign-update.entity';
import type {
  CampaignUpdateRepositoryPort,
  CampaignUpdateWithAuthor,
} from '../../application/ports/campaign-update.repository.port';

@Injectable()
export class PrismaCampaignUpdateRepository implements CampaignUpdateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async save(update: CampaignUpdate): Promise<CampaignUpdate> {
    const record = await this.prisma.campaign_updates.upsert({
      where: { id: update.getId() },
      create: {
        id: update.getId(),
        campaign_id: update.getCampaignId(),
        author_user_id: update.getAuthorUserId(),
        title: update.getTitle(),
        body: update.getBody(),
        image_url: update.getImageUrl(),
        visibility: update.getVisibility().getValue() as visibility_scope,
        published_at: update.getPublishedAt(),
      },
      update: {
        title: update.getTitle(),
        body: update.getBody(),
        image_url: update.getImageUrl(),
        visibility: update.getVisibility().getValue() as visibility_scope,
        published_at: update.getPublishedAt(),
        updated_at: new Date(),
      },
    });

    return CampaignUpdate.reconstitute({
      id: record.id,
      campaignId: record.campaign_id,
      authorUserId: record.author_user_id,
      title: record.title,
      body: record.body,
      imageUrl: record.image_url,
      visibility: record.visibility,
      publishedAt: record.published_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  public async findById(id: string): Promise<CampaignUpdate | null> {
    const record = await this.prisma.campaign_updates.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return CampaignUpdate.reconstitute({
      id: record.id,
      campaignId: record.campaign_id,
      authorUserId: record.author_user_id,
      title: record.title,
      body: record.body,
      imageUrl: record.image_url,
      visibility: record.visibility,
      publishedAt: record.published_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  public async findByCampaignId(
    campaignId: string,
    allowedVisibilities?: string[],
  ): Promise<CampaignUpdateWithAuthor[]> {
    const where: {
      campaign_id: string;
      visibility?: { in: visibility_scope[] };
    } = { campaign_id: campaignId };

    if (allowedVisibilities && allowedVisibilities.length > 0) {
      where.visibility = {
        in: allowedVisibilities as visibility_scope[],
      };
    }

    const records = await this.prisma.campaign_updates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        author: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return records.map((record) => ({
      update: CampaignUpdate.reconstitute({
        id: record.id,
        campaignId: record.campaign_id,
        authorUserId: record.author_user_id,
        title: record.title,
        body: record.body,
        imageUrl: record.image_url,
        visibility: record.visibility,
        publishedAt: record.published_at,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }),
      authorName: record.author.full_name,
      authorAvatarUrl: record.author.avatar_url,
    }));
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.campaign_updates.delete({
      where: { id },
    });
  }

  public async isUserCampaignSupporter(campaignId: string, userId: string): Promise<boolean> {
    const contribution = await this.prisma.contributions.findFirst({
      where: {
        campaign_id: campaignId,
        sponsor_user_id: userId,
        status: 'confirmed',
      },
      select: { id: true },
    });

    return Boolean(contribution);
  }
}
