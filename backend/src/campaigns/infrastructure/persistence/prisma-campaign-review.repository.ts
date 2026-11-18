import { Injectable } from '@nestjs/common';
import { campaign_review_action, Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type {
  CampaignReviewRecord,
  CampaignReviewRepositoryPort,
  CampaignReviewSectionNotes,
  SaveCampaignReviewCommand,
} from '../../application/ports/campaign-review.repository.port';

function parseSectionNotes(value: Prisma.JsonValue | null): CampaignReviewSectionNotes | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const notes: CampaignReviewSectionNotes = {};
  if (typeof raw.generalInfo === 'string') notes.generalInfo = raw.generalInfo;
  if (typeof raw.storyImpact === 'string') notes.storyImpact = raw.storyImpact;
  if (typeof raw.planBudget === 'string') notes.planBudget = raw.planBudget;
  if (typeof raw.funding === 'string') notes.funding = raw.funding;
  if (typeof raw.cover === 'string') notes.cover = raw.cover;
  if (typeof raw.rewards === 'string') notes.rewards = raw.rewards;
  if (typeof raw.other === 'string') notes.other = raw.other;
  return Object.keys(notes).length > 0 ? notes : null;
}

@Injectable()
export class PrismaCampaignReviewRepository implements CampaignReviewRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async save(command: SaveCampaignReviewCommand): Promise<CampaignReviewRecord> {
    const record = await this.prisma.campaign_reviews.create({
      data: {
        campaign_id: command.campaignId,
        reviewer_user_id: command.reviewerUserId,
        action: command.action as campaign_review_action,
        reason: command.reason?.trim() || null,
        section_notes: command.sectionNotes
          ? (command.sectionNotes as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      include: {
        reviewer: {
          select: { full_name: true, email: true },
        },
      },
    });

    return {
      id: record.id,
      campaignId: record.campaign_id,
      reviewerUserId: record.reviewer_user_id,
      reviewerFullName: record.reviewer.full_name,
      reviewerEmail: record.reviewer.email,
      action: record.action,
      reason: record.reason,
      sectionNotes: parseSectionNotes(record.section_notes),
      createdAt: record.created_at,
    };
  }

  public async findByCampaignId(campaignId: string): Promise<CampaignReviewRecord[]> {
    const records = await this.prisma.campaign_reviews.findMany({
      where: { campaign_id: campaignId },
      orderBy: { created_at: 'desc' },
      include: {
        reviewer: {
          select: { full_name: true, email: true },
        },
      },
    });

    return records.map((record) => ({
      id: record.id,
      campaignId: record.campaign_id,
      reviewerUserId: record.reviewer_user_id,
      reviewerFullName: record.reviewer.full_name,
      reviewerEmail: record.reviewer.email,
      action: record.action,
      reason: record.reason,
      sectionNotes: parseSectionNotes(record.section_notes),
      createdAt: record.created_at,
    }));
  }
}
