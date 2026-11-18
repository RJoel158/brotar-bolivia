import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { CAMPAIGN_CATALOG_PORT } from '../ports/campaign-catalog.repository.port';
import type { CampaignCatalogRepositoryPort } from '../ports/campaign-catalog.repository.port';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

@Injectable()
export class GetCampaignCatalogUseCase {
  constructor(@Inject(CAMPAIGN_CATALOG_PORT) private readonly repository: CampaignCatalogRepositoryPort) {}
  async execute(input: { limit?: number; category?: string; query?: string; cursor?: string }) {
    if (input.cursor && !isUUID(input.cursor)) throw new BadRequestException('Cursor de catalogo invalido.');
    const limit = input.limit ?? 24;
    if (!Number.isInteger(limit) || limit < 1 || limit > 48) throw new BadRequestException('Limite invalido.');
    const result = await this.repository.findPage({ limit, category: input.category, query: input.query?.trim(), after: input.cursor });
    return {
      items: result.items.map(toCampaignResponseDto),
      nextCursor: result.next,
    };
  }
}
