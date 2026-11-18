import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { CampaignHomeRepositoryPort } from '../../application/ports/campaign-home.repository.port';
import { PrismaCampaignMapper } from '../adapters/prisma-campaign.mapper';

@Injectable()
export class PrismaCampaignHomeRepository implements CampaignHomeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async getSummary() {
    // Aggregate in PostgreSQL; never transfer every campaign or private owner data.
    return this.prisma.$transaction(async tx => {
      const [summary] = await tx.$queryRaw<Array<{
        featuredId: string | null; categories: string[]; categoryCounts: Record<string, number>; projects: number;
        raised: string; progress: number; currency: string;
      }>>`
        WITH published AS (
          SELECT id, category, currency, current_amount, created_at,
            CASE WHEN goal_amount <= 0 THEN 0 ELSE LEAST(100, ROUND(current_amount / goal_amount * 100)) END AS score
          FROM campaigns WHERE status = 'published'
        ), featured AS (
          SELECT id FROM published ORDER BY score DESC, created_at DESC, id DESC LIMIT 1
        )
        SELECT (SELECT id::text FROM featured) AS "featuredId",
          COALESCE((SELECT array_agg(category::text ORDER BY latest DESC, category::text)
            FROM (SELECT category, MAX(created_at) AS latest FROM published
              WHERE id <> (SELECT id FROM featured) GROUP BY category) c), ARRAY[]::text[]) AS categories,
          COALESCE((SELECT jsonb_object_agg(category::text, total)
            FROM (SELECT category, COUNT(*)::int AS total FROM published
              WHERE id <> (SELECT id FROM featured) GROUP BY category) c), '{}'::jsonb) AS "categoryCounts",
          COUNT(*)::int AS projects, COALESCE(SUM(current_amount), 0)::text AS raised,
          COALESCE(ROUND(AVG(score)), 0)::int AS progress,
          COALESCE((SELECT currency::text FROM published ORDER BY created_at DESC, id DESC LIMIT 1), 'BOB') AS currency
        FROM published
      `;
      const row = summary.featuredId ? await tx.campaign.findFirst({
        where: { id: summary.featuredId, status: 'published' },
        include: { users: { select: { full_name: true, organization_name: true } }, organizations: { select: { legal_name: true } } },
      }) : null;
      const { featuredId: _, ...stats } = summary;
      return { ...stats, featured: row ? PrismaCampaignMapper.toDomain(row) : null };
    }, { isolationLevel: 'RepeatableRead' });
  }
}
