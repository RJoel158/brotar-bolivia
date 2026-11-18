import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, campaign_category } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { CampaignCatalogRepositoryPort, CatalogCriteria } from '../../application/ports/campaign-catalog.repository.port';
import { PrismaCampaignMapper } from '../adapters/prisma-campaign.mapper';

@Injectable()
export class PrismaCampaignCatalogRepository implements CampaignCatalogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async findPage(criteria: CatalogCriteria) {
    const conditions: Prisma.CampaignWhereInput[] = [{ status: 'published' }];
    if (criteria.category) conditions.push({ category: criteria.category as campaign_category });
    if (criteria.query) {
      // Treat % and _ as literal search text, matching the previous substring search.
      const contains = criteria.query.replace(/[\\%_]/g, '\\$&');
      conditions.push({ OR: ['title', 'short_summary', 'location'].map(field => ({ [field]: { contains, mode: 'insensitive' } })) });
    }
    const rows = await this.prisma.campaign.findMany({
      where: { AND: conditions }, take: criteria.limit + 1,
      // Native cursor retains PostgreSQL microseconds; JS Date truncation could skip rows.
      ...(criteria.after ? { cursor: { id: criteria.after }, skip: 1 } : {}),
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      include: { users: { select: { full_name: true, organization_name: true } }, organizations: { select: { legal_name: true } } },
    });
    if (criteria.after && rows.length === 0 && !await this.prisma.campaign.findUnique({ where: { id: criteria.after }, select: { id: true } })) {
      throw new ConflictException('El catalogo cambio. Actualiza la lista para continuar.');
    }
    const items = rows.slice(0, criteria.limit);
    const last = items.at(-1);
    return { items: items.map(row => PrismaCampaignMapper.toDomain(row)),
      next: rows.length > criteria.limit && last ? last.id : null };
  }
}
