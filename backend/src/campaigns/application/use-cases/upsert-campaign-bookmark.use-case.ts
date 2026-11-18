import { Inject, Injectable } from '@nestjs/common';
import type { CampaignBookmarkResponseDto } from '../dto/campaign-bookmark.dto';
import {
  CAMPAIGN_BOOKMARK_REPOSITORY_PORT,
  type CampaignBookmarkRepositoryPort,
} from '../ports/campaign-bookmark.repository.port';
import { toBookmarkResponse } from '../dto/campaign-bookmark-mapper';

@Injectable()
export class UpsertCampaignBookmarkUseCase {
  constructor(
    @Inject(CAMPAIGN_BOOKMARK_REPOSITORY_PORT)
    private readonly bookmarks: CampaignBookmarkRepositoryPort,
  ) {}

  public async execute(userId: string, campaignId: string): Promise<CampaignBookmarkResponseDto> {
    const record = await this.bookmarks.upsert(userId, campaignId, 'FAVORITE');
    return toBookmarkResponse(record);
  }
}
