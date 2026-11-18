import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateCampaignRewardUseCase } from '../../application/use-cases/create-campaign-reward.use-case';
import { UpdateCampaignRewardUseCase } from '../../application/use-cases/update-campaign-reward.use-case';
import { SetCampaignRewardActiveUseCase } from '../../application/use-cases/set-campaign-reward-active.use-case';
import { DeleteCampaignRewardUseCase } from '../../application/use-cases/delete-campaign-reward.use-case';
import { ListCampaignRewardsUseCase } from '../../application/use-cases/list-campaign-rewards.use-case';
import type { CampaignRewardResponseDto } from '../../application/dto/campaign-reward-response.dto';
import { CreateCampaignRewardHttpDto } from './dto/create-campaign-reward.http-dto';
import { UpdateCampaignRewardHttpDto } from './dto/update-campaign-reward.http-dto';
import { SetCampaignRewardActiveHttpDto } from './dto/set-campaign-reward-active.http-dto';
import { JwtAuthGuard } from '../../../users/infrastructure/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../users/infrastructure/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../../users/infrastructure/guards/roles.guard';
import { Roles } from '../../../users/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../users/infrastructure/decorators/current-user.decorator';

@Controller('campaigns/:campaignId/rewards')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CampaignRewardController {
  constructor(
    private readonly listCampaignRewardsUseCase: ListCampaignRewardsUseCase,
    private readonly createCampaignRewardUseCase: CreateCampaignRewardUseCase,
    private readonly updateCampaignRewardUseCase: UpdateCampaignRewardUseCase,
    private readonly setCampaignRewardActiveUseCase: SetCampaignRewardActiveUseCase,
    private readonly deleteCampaignRewardUseCase: DeleteCampaignRewardUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  public async list(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user?: { id: string; role: string } | null,
  ): Promise<CampaignRewardResponseDto[]> {
    return this.listCampaignRewardsUseCase.execute({
      campaignId,
      viewer: user ? { id: user.id, role: user.role } : null,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async create(
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCampaignRewardHttpDto,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignRewardResponseDto> {
    return this.createCampaignRewardUseCase.execute({
      ...dto,
      campaignId,
      authenticatedUserId: userId,
    });
  }

  @Patch(':rewardId/active')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async setActive(
    @Param('campaignId') campaignId: string,
    @Param('rewardId') rewardId: string,
    @Body() dto: SetCampaignRewardActiveHttpDto,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignRewardResponseDto> {
    return this.setCampaignRewardActiveUseCase.execute({
      campaignId,
      rewardId,
      authenticatedUserId: userId,
      isActive: dto.isActive,
    });
  }

  @Patch(':rewardId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async update(
    @Param('campaignId') campaignId: string,
    @Param('rewardId') rewardId: string,
    @Body() dto: UpdateCampaignRewardHttpDto,
    @CurrentUser('id') userId: string,
  ): Promise<CampaignRewardResponseDto> {
    return this.updateCampaignRewardUseCase.execute({
      campaignId,
      rewardId,
      authenticatedUserId: userId,
      changes: dto,
    });
  }

  @Delete(':rewardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator')
  public async remove(
    @Param('campaignId') campaignId: string,
    @Param('rewardId') rewardId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.deleteCampaignRewardUseCase.execute({
      campaignId,
      rewardId,
      authenticatedUserId: userId,
    });
  }
}
