import { CAMPAIGN_HOME_PORT } from './application/ports/campaign-home.repository.port';
import { GetCampaignHomeUseCase } from './application/use-cases/get-campaign-home.use-case';
import { PrismaCampaignHomeRepository } from './infrastructure/persistence/prisma-campaign-home.repository';
import { CampaignCatalogController } from './infrastructure/controllers/campaign-catalog.controller';
import { GetCampaignCatalogUseCase } from './application/use-cases/get-campaign-catalog.use-case';
import { PrismaCampaignCatalogRepository } from './infrastructure/persistence/prisma-campaign-catalog.repository';
import { CAMPAIGN_CATALOG_PORT } from './application/ports/campaign-catalog.repository.port';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CAMPAIGN_REPOSITORY_PORT } from './application/ports/campaign.repository.port';
import { CAMPAIGN_REVIEW_REPOSITORY_PORT } from './application/ports/campaign-review.repository.port';
import { CAMPAIGN_UPDATE_REPOSITORY_PORT } from './application/ports/campaign-update.repository.port';
import { CAMPAIGN_REWARD_REPOSITORY_PORT } from './application/ports/campaign-reward.repository.port';
import { CAMPAIGN_PLAN_REPOSITORY_PORT } from './application/ports/campaign-plan.repository.port';
import { CAMPAIGN_BOOKMARK_REPOSITORY_PORT } from './application/ports/campaign-bookmark.repository.port';
import { FILE_STORAGE_PORT } from './application/ports/file-storage.port';
import { PrismaCampaignRepository } from './infrastructure/persistence/prisma-campaign.repository';
import { PrismaCampaignReviewRepository } from './infrastructure/persistence/prisma-campaign-review.repository';
import { PrismaCampaignUpdateRepository } from './infrastructure/persistence/prisma-campaign-update.repository';
import { PrismaCampaignRewardRepository } from './infrastructure/persistence/prisma-campaign-reward.repository';
import { PrismaCampaignPlanRepository } from './infrastructure/persistence/prisma-campaign-plan.repository';
import { PrismaCampaignBookmarkRepository } from './infrastructure/persistence/prisma-campaign-bookmark.repository';
import { LocalFileStorageAdapter } from './infrastructure/adapters/local-file-storage.adapter';
import { UpsertCampaignBookmarkUseCase } from './application/use-cases/upsert-campaign-bookmark.use-case';
import { RemoveCampaignBookmarkUseCase } from './application/use-cases/remove-campaign-bookmark.use-case';
import { ListMyBookmarksUseCase } from './application/use-cases/list-my-bookmarks.use-case';
import { ListMyBookmarkIdsUseCase } from './application/use-cases/list-my-bookmark-ids.use-case';
import { CreateCampaignUseCase } from './application/use-cases/create-campaign.use-case';
import { UpdateCampaignUseCase } from './application/use-cases/update-campaign.use-case';
import { GetCampaignByIdUseCase } from './application/use-cases/get-campaign-by-id.use-case';
import { GetCampaignsUseCase } from './application/use-cases/get-campaigns.use-case';
import { GetMyCampaignsUseCase } from './application/use-cases/get-my-campaigns.use-case';
import { GetPendingReviewCampaignsUseCase } from './application/use-cases/get-pending-review-campaigns.use-case';
import { SubmitCampaignForReviewUseCase } from './application/use-cases/submit-campaign-for-review.use-case';
import { ReviewCampaignUseCase } from './application/use-cases/review-campaign.use-case';
import { PublishCampaignUseCase } from './application/use-cases/publish-campaign.use-case';
import { UploadCampaignCoverUseCase } from './application/use-cases/upload-campaign-cover.use-case';
import { GetCampaignReviewsUseCase } from './application/use-cases/get-campaign-reviews.use-case';
import { CreateCampaignUpdateUseCase } from './application/use-cases/create-campaign-update.use-case';
import { GetCampaignUpdatesUseCase } from './application/use-cases/get-campaign-updates.use-case';
import { DeleteCampaignUpdateUseCase } from './application/use-cases/delete-campaign-update.use-case';
import { GetSocialFeedUseCase } from './application/use-cases/get-social-feed.use-case';
import { GetCampaignStoriesUseCase } from './application/use-cases/get-campaign-stories.use-case';
import { GetSuggestedCampaignsUseCase } from './application/use-cases/get-suggested-campaigns.use-case';
import { CreateCampaignRewardUseCase } from './application/use-cases/create-campaign-reward.use-case';
import { UpdateCampaignRewardUseCase } from './application/use-cases/update-campaign-reward.use-case';
import { SetCampaignRewardActiveUseCase } from './application/use-cases/set-campaign-reward-active.use-case';
import { DeleteCampaignRewardUseCase } from './application/use-cases/delete-campaign-reward.use-case';
import { ListCampaignRewardsUseCase } from './application/use-cases/list-campaign-rewards.use-case';
import { GetCampaignPlanUseCase } from './application/use-cases/get-campaign-plan.use-case';
import { SaveCampaignPlanUseCase } from './application/use-cases/save-campaign-plan.use-case';
import { CampaignController } from './infrastructure/controllers/campaign.controller';
import { CampaignRewardController } from './infrastructure/controllers/campaign-reward.controller';

@Module({
  imports: [UsersModule],
  controllers: [CampaignCatalogController, CampaignController, CampaignRewardController],
  providers: [
    GetCampaignHomeUseCase,
    { provide: CAMPAIGN_HOME_PORT, useClass: PrismaCampaignHomeRepository },
    GetCampaignCatalogUseCase,
    { provide: CAMPAIGN_CATALOG_PORT, useClass: PrismaCampaignCatalogRepository },
    {
      provide: CAMPAIGN_REPOSITORY_PORT,
      useClass: PrismaCampaignRepository,
    },
    {
      provide: CAMPAIGN_REVIEW_REPOSITORY_PORT,
      useClass: PrismaCampaignReviewRepository,
    },
    {
      provide: CAMPAIGN_UPDATE_REPOSITORY_PORT,
      useClass: PrismaCampaignUpdateRepository,
    },
    {
      provide: CAMPAIGN_REWARD_REPOSITORY_PORT,
      useClass: PrismaCampaignRewardRepository,
    },
    {
      provide: CAMPAIGN_PLAN_REPOSITORY_PORT,
      useClass: PrismaCampaignPlanRepository,
    },
    {
      provide: CAMPAIGN_BOOKMARK_REPOSITORY_PORT,
      useClass: PrismaCampaignBookmarkRepository,
    },
    {
      provide: FILE_STORAGE_PORT,
      useClass: LocalFileStorageAdapter,
    },
    UpsertCampaignBookmarkUseCase,
    RemoveCampaignBookmarkUseCase,
    ListMyBookmarksUseCase,
    ListMyBookmarkIdsUseCase,
    CreateCampaignRewardUseCase,
    UpdateCampaignRewardUseCase,
    SetCampaignRewardActiveUseCase,
    DeleteCampaignRewardUseCase,
    ListCampaignRewardsUseCase,
    CreateCampaignUseCase,
    UpdateCampaignUseCase,
    GetCampaignByIdUseCase,
    GetCampaignsUseCase,
    GetMyCampaignsUseCase,
    GetPendingReviewCampaignsUseCase,
    SubmitCampaignForReviewUseCase,
    ReviewCampaignUseCase,
    PublishCampaignUseCase,
    UploadCampaignCoverUseCase,
    GetCampaignReviewsUseCase,
    CreateCampaignUpdateUseCase,
    GetCampaignUpdatesUseCase,
    DeleteCampaignUpdateUseCase,
    GetSocialFeedUseCase,
    GetCampaignStoriesUseCase,
    GetSuggestedCampaignsUseCase,
    GetCampaignPlanUseCase,
    SaveCampaignPlanUseCase,
  ],
  exports: [
    CAMPAIGN_REPOSITORY_PORT,
    CAMPAIGN_REVIEW_REPOSITORY_PORT,
    CAMPAIGN_UPDATE_REPOSITORY_PORT,
    CAMPAIGN_PLAN_REPOSITORY_PORT,
    CreateCampaignUseCase,
    UpdateCampaignUseCase,
    GetCampaignByIdUseCase,
    GetCampaignsUseCase,
    GetMyCampaignsUseCase,
    GetPendingReviewCampaignsUseCase,
    SubmitCampaignForReviewUseCase,
    ReviewCampaignUseCase,
    PublishCampaignUseCase,
    UploadCampaignCoverUseCase,
    GetCampaignReviewsUseCase,
    CreateCampaignUpdateUseCase,
    GetCampaignUpdatesUseCase,
    DeleteCampaignUpdateUseCase,
    GetSocialFeedUseCase,
    GetCampaignStoriesUseCase,
    GetSuggestedCampaignsUseCase,
    GetCampaignPlanUseCase,
    SaveCampaignPlanUseCase,
  ],
})
export class CampaignsModule {}

