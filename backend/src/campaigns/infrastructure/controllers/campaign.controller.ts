import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { CreateCampaignUseCase } from '../../application/use-cases/create-campaign.use-case';
import { UpdateCampaignUseCase } from '../../application/use-cases/update-campaign.use-case';
import { GetCampaignByIdUseCase } from '../../application/use-cases/get-campaign-by-id.use-case';
import { GetCampaignsUseCase } from '../../application/use-cases/get-campaigns.use-case';
import { GetMyCampaignsUseCase } from '../../application/use-cases/get-my-campaigns.use-case';
import { GetPendingReviewCampaignsUseCase } from '../../application/use-cases/get-pending-review-campaigns.use-case';
import { SubmitCampaignForReviewUseCase } from '../../application/use-cases/submit-campaign-for-review.use-case';
import { ReviewCampaignUseCase } from '../../application/use-cases/review-campaign.use-case';
import { PublishCampaignUseCase } from '../../application/use-cases/publish-campaign.use-case';
import { UploadCampaignCoverUseCase } from '../../application/use-cases/upload-campaign-cover.use-case';
import { GetCampaignReviewsUseCase } from '../../application/use-cases/get-campaign-reviews.use-case';
import { CreateCampaignUpdateUseCase } from '../../application/use-cases/create-campaign-update.use-case';
import { GetCampaignUpdatesUseCase } from '../../application/use-cases/get-campaign-updates.use-case';
import { DeleteCampaignUpdateUseCase } from '../../application/use-cases/delete-campaign-update.use-case';
import { GetSocialFeedUseCase } from '../../application/use-cases/get-social-feed.use-case';
import { GetCampaignStoriesUseCase } from '../../application/use-cases/get-campaign-stories.use-case';
import { GetSuggestedCampaignsUseCase } from '../../application/use-cases/get-suggested-campaigns.use-case';
import { GetCampaignPlanUseCase } from '../../application/use-cases/get-campaign-plan.use-case';
import { SaveCampaignPlanUseCase } from '../../application/use-cases/save-campaign-plan.use-case';
import { UpsertCampaignBookmarkUseCase } from '../../application/use-cases/upsert-campaign-bookmark.use-case';
import { RemoveCampaignBookmarkUseCase } from '../../application/use-cases/remove-campaign-bookmark.use-case';
import { ListMyBookmarksUseCase } from '../../application/use-cases/list-my-bookmarks.use-case';
import { ListMyBookmarkIdsUseCase } from '../../application/use-cases/list-my-bookmark-ids.use-case';
import type { CampaignPlanResponseDto } from '../../application/dto/campaign-plan.dto';
import type { CampaignBookmarkResponseDto } from '../../application/dto/campaign-bookmark.dto';
import type { CreateCampaignDto } from '../../application/dto/create-campaign.dto';
import type { UpdateCampaignCommand } from '../../application/dto/update-campaign.dto';
import { CampaignResponseDto } from '../../application/dto/campaign-response.dto';
import type { CampaignUpdateResponseDto } from '../../application/dto/campaign-update-response.dto';
import type { SocialFeedPostDto } from '../../application/dto/social-feed-response.dto';
import type { CampaignStoryItemDto } from '../../application/dto/campaign-story-response.dto';
import { CreateCampaignHttpDto } from './dto/create-campaign.http-dto';
import { UpdateCampaignHttpDto } from './dto/update-campaign.http-dto';
import { FilterCampaignsHttpDto } from './dto/filter-campaigns.http-dto';
import { ReviewCampaignHttpDto } from './dto/review-campaign.http-dto';
import { CreateCampaignUpdateHttpDto } from './dto/create-campaign-update.http-dto';
import { SaveCampaignPlanHttpDto } from './dto/save-campaign-plan.http-dto';
import { JwtAuthGuard } from '../../../users/infrastructure/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../users/infrastructure/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../../users/infrastructure/guards/roles.guard';
import { Roles } from '../../../users/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../users/infrastructure/decorators/current-user.decorator';

const COVER_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

@Controller('campaigns')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CampaignController {
  constructor(
    private readonly createCampaignUseCase: CreateCampaignUseCase,
    private readonly updateCampaignUseCase: UpdateCampaignUseCase,
    private readonly getCampaignByIdUseCase: GetCampaignByIdUseCase,
    private readonly getCampaignsUseCase: GetCampaignsUseCase,
    private readonly getMyCampaignsUseCase: GetMyCampaignsUseCase,
    private readonly getPendingReviewCampaignsUseCase: GetPendingReviewCampaignsUseCase,
    private readonly submitCampaignForReviewUseCase: SubmitCampaignForReviewUseCase,
    private readonly reviewCampaignUseCase: ReviewCampaignUseCase,
    private readonly publishCampaignUseCase: PublishCampaignUseCase,
    private readonly uploadCampaignCoverUseCase: UploadCampaignCoverUseCase,
    private readonly getCampaignReviewsUseCase: GetCampaignReviewsUseCase,
    private readonly createCampaignUpdateUseCase: CreateCampaignUpdateUseCase,
    private readonly getCampaignUpdatesUseCase: GetCampaignUpdatesUseCase,
    private readonly deleteCampaignUpdateUseCase: DeleteCampaignUpdateUseCase,
    private readonly getSocialFeedUseCase: GetSocialFeedUseCase,
    private readonly getCampaignStoriesUseCase: GetCampaignStoriesUseCase,
    private readonly getSuggestedCampaignsUseCase: GetSuggestedCampaignsUseCase,
    private readonly getCampaignPlanUseCase: GetCampaignPlanUseCase,
    private readonly saveCampaignPlanUseCase: SaveCampaignPlanUseCase,
    private readonly upsertCampaignBookmarkUseCase: UpsertCampaignBookmarkUseCase,
    private readonly removeCampaignBookmarkUseCase: RemoveCampaignBookmarkUseCase,
    private readonly listMyBookmarksUseCase: ListMyBookmarksUseCase,
    private readonly listMyBookmarkIdsUseCase: ListMyBookmarkIdsUseCase,
  ) {}

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  public async getFeed(
    @Query('limit') limit?: string,
  ): Promise<SocialFeedPostDto[]> {
    const take = limit ? parseInt(limit, 10) : 20;
    return this.getSocialFeedUseCase.execute(take);
  }

  @Get('stories')
  @UseGuards(OptionalJwtAuthGuard)
  public async getStories(
    @Query('limit') limit?: string,
  ): Promise<CampaignStoryItemDto[]> {
    const take = limit ? parseInt(limit, 10) : 10;
    return this.getCampaignStoriesUseCase.execute(take);
  }

  @Get('suggested')
  @UseGuards(OptionalJwtAuthGuard)
  public async getSuggested(
    @Query('limit') limit?: string,
  ): Promise<CampaignResponseDto[]> {
    const take = limit ? parseInt(limit, 10) : 5;
    return this.getSuggestedCampaignsUseCase.execute(take);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async create(
    @Body() dto: CreateCampaignHttpDto,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignResponseDto> {
    const command: CreateCampaignDto = {
      ...dto,
      ownerUserId: userId,
    };
    return this.createCampaignUseCase.execute(command);
  }

  @Post('cover-image')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: COVER_UPLOAD_MAX_BYTES },
      fileFilter: (_req, file, callback) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
          callback(null, true);
          return;
        }
        callback(
          new BadRequestException('Solo se aceptan imágenes JPG o PNG.') as unknown as Error,
          false,
        );
      },
    }),
  )
  public async uploadCoverImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Debes enviar una imagen en el campo "file".');
    }

    const stored = await this.uploadCampaignCoverUseCase.execute({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
    });

    const host = req.get('host') ?? 'localhost';
    const protocol = req.protocol || 'http';
    return { url: `${protocol}://${host}${stored.publicPath}` };
  }

  @Get()
  public async findAll(
    @Query() query: FilterCampaignsHttpDto,
  ): Promise<CampaignResponseDto[]> {
    return this.getCampaignsUseCase.execute({
      category: query.category,
      status: 'published',
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async findMine(
    @CurrentUser('id') userId: string,
  ): Promise<CampaignResponseDto[]> {
    return this.getMyCampaignsUseCase.execute(userId);
  }

  @Get('me/bookmarks')
  @UseGuards(JwtAuthGuard)
  public async listMyBookmarks(
    @CurrentUser('id') userId: string,
  ): Promise<CampaignBookmarkResponseDto[]> {
    return this.listMyBookmarksUseCase.execute(userId);
  }

  @Get('me/bookmark-ids')
  @UseGuards(JwtAuthGuard)
  public async listMyBookmarkIds(
    @CurrentUser('id') userId: string,
  ): Promise<{ campaignIds: string[] }> {
    const campaignIds = await this.listMyBookmarkIdsUseCase.execute(userId);
    return { campaignIds };
  }

  @Post(':id/bookmarks')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  public async addBookmark(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignBookmarkResponseDto> {
    return this.upsertCampaignBookmarkUseCase.execute(userId, campaignId);
  }

  @Delete(':id/bookmarks')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  public async removeBookmark(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.removeCampaignBookmarkUseCase.execute(userId, campaignId);
  }

  @Get('pending-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async findPendingReview(): Promise<CampaignResponseDto[]> {
    return this.getPendingReviewCampaignsUseCase.execute();
  }

  @Get('owner/:ownerUserId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async findByOwner(
    @Param('ownerUserId') ownerUserId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignResponseDto[]> {
    if (ownerUserId !== userId) {
      throw new ForbiddenException('Solo puedes consultar tus propias campañas.');
    }
    return this.getMyCampaignsUseCase.execute(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  public async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user?: { id: string; role: string } | null,
  ): Promise<CampaignResponseDto> {
    return this.getCampaignByIdUseCase.execute(
      id,
      user ? { id: user.id, role: user.role } : null,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async update(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: UpdateCampaignHttpDto,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignResponseDto> {
    const command: UpdateCampaignCommand = {
      campaignId,
      authenticatedUserId: userId,
      changes: dto,
    };
    return this.updateCampaignUseCase.execute(command);
  }

  @Get(':id/plan')
  @UseGuards(OptionalJwtAuthGuard)
  public async getPlan(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser() user?: { id: string; role: string } | null,
  ): Promise<CampaignPlanResponseDto> {
    return this.getCampaignPlanUseCase.execute(
      campaignId,
      user ? { id: user.id, role: user.role } : null,
    );
  }

  @Put(':id/plan')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async savePlan(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: SaveCampaignPlanHttpDto,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignPlanResponseDto> {
    return this.saveCampaignPlanUseCase.execute({
      campaignId,
      authenticatedUserId: userId,
      activities: dto.activities,
      budgetItems: dto.budgetItems,
    });
  }

  @Post(':id/submit-review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async submitReview(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignResponseDto> {
    return this.submitCampaignForReviewUseCase.execute(campaignId, userId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async approve(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser('id') reviewerUserId: string,
    @Body() dto: ReviewCampaignHttpDto = {},
  ): Promise<CampaignResponseDto> {
    return this.reviewCampaignUseCase.execute({
      campaignId,
      reviewerUserId,
      action: 'approve',
      notes: dto.notes,
      sectionNotes: dto.sectionNotes,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async reject(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser('id') reviewerUserId: string,
    @Body() dto: ReviewCampaignHttpDto,
  ): Promise<CampaignResponseDto> {
    return this.reviewCampaignUseCase.execute({
      campaignId,
      reviewerUserId,
      action: 'reject',
      rejectionReason: dto.rejectionReason,
      notes: dto.notes,
      sectionNotes: dto.sectionNotes,
    });
  }

  @Post(':id/request-changes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async requestChanges(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser('id') reviewerUserId: string,
    @Body() dto: ReviewCampaignHttpDto,
  ): Promise<CampaignResponseDto> {
    return this.reviewCampaignUseCase.execute({
      campaignId,
      reviewerUserId,
      action: 'request_changes',
      notes: dto.notes,
      sectionNotes: dto.sectionNotes,
    });
  }

  @Get(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async getReviews(@Param('id', new ParseUUIDPipe()) campaignId: string) {
    return this.getCampaignReviewsUseCase.execute(campaignId);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async publish(@Param('id', new ParseUUIDPipe()) campaignId: string): Promise<CampaignResponseDto> {
    return this.publishCampaignUseCase.execute(campaignId);
  }

  @Post(':id/updates')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  public async createUpdate(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: CreateCampaignUpdateHttpDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<CampaignUpdateResponseDto> {
    return this.createCampaignUpdateUseCase.execute({
      campaignId,
      authorUserId: user.id,
      authorRole: user.role,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      visibility: dto.visibility,
    });
  }

  @Get(':id/updates')
  @UseGuards(OptionalJwtAuthGuard)
  public async getUpdates(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @CurrentUser() user?: { id: string; role: string } | null,
  ): Promise<CampaignUpdateResponseDto[]> {
    return this.getCampaignUpdatesUseCase.execute({
      campaignId,
      user: user ? { id: user.id, role: user.role } : null,
    });
  }

  @Delete(':id/updates/:updateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  public async deleteUpdate(
    @Param('id', new ParseUUIDPipe()) campaignId: string,
    @Param('updateId') updateId: string,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<void> {
    return this.deleteCampaignUpdateUseCase.execute(campaignId, updateId, user);
  }
}

