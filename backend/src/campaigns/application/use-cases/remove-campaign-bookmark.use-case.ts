import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CAMPAIGN_BOOKMARK_REPOSITORY_PORT,
  type CampaignBookmarkRepositoryPort,
} from '../ports/campaign-bookmark.repository.port';

@Injectable()
export class RemoveCampaignBookmarkUseCase {
  constructor(
    @Inject(CAMPAIGN_BOOKMARK_REPOSITORY_PORT)
    private readonly bookmarks: CampaignBookmarkRepositoryPort,
  ) {}

  public async execute(userId: string, campaignId: string): Promise<void> {
    const removed = await this.bookmarks.remove(userId, campaignId, 'FAVORITE');
    if (!removed) {
      throw new NotFoundException('Ese proyecto no está en tus favoritos.');
    }
  }
}
