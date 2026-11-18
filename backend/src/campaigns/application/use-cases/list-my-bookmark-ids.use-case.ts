import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPAIGN_BOOKMARK_REPOSITORY_PORT,
  type CampaignBookmarkRepositoryPort,
} from '../ports/campaign-bookmark.repository.port';

@Injectable()
export class ListMyBookmarkIdsUseCase {
  constructor(
    @Inject(CAMPAIGN_BOOKMARK_REPOSITORY_PORT)
    private readonly bookmarks: CampaignBookmarkRepositoryPort,
  ) {}

  public async execute(userId: string): Promise<string[]> {
    return this.bookmarks.listCampaignIdsByUserId(userId, 'FAVORITE');
  }
}
