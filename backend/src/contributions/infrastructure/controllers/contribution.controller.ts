import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateContributionUseCase } from '../../application/use-cases/create-contribution.use-case';
import { PayContributionUseCase } from '../../application/use-cases/pay-contribution.use-case';
import { ListMyContributionsUseCase } from '../../application/use-cases/list-my-contributions.use-case';
import { GetMyContributionUseCase } from '../../application/use-cases/get-my-contribution.use-case';
import { CancelContributionUseCase } from '../../application/use-cases/cancel-contribution.use-case';
import { GetCampaignSupportSummaryUseCase } from '../../application/use-cases/get-campaign-support-summary.use-case';
import { GetSponsorSummaryUseCase } from '../../application/use-cases/get-sponsor-summary.use-case';
import { CreateSponsorDisputeUseCase } from '../../application/use-cases/create-sponsor-dispute.use-case';
import { ListContributionDisputesUseCase } from '../../application/use-cases/list-contribution-disputes.use-case';
import {
  CreateContributionHttpDto,
  CreateSponsorDisputeHttpDto,
  ListMyContributionsHttpDto,
  PayContributionHttpDto,
} from './dto/contribution.http-dto';
import { JwtAuthGuard } from '../../../users/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../users/infrastructure/decorators/current-user.decorator';

/**
 * Flujo de aporte del patrocinador: elegir, pagar y consultar.
 *
 * No se exige el rol sponsor: un creador tambien puede apoyar campanas
 * ajenas. Lo que si se bloquea, en las reglas de dominio, es aportar a la
 * campana propia.
 */
@Controller('contributions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ContributionController {
  constructor(
    private readonly createContributionUseCase: CreateContributionUseCase,
    private readonly payContributionUseCase: PayContributionUseCase,
    private readonly listMyContributionsUseCase: ListMyContributionsUseCase,
    private readonly getMyContributionUseCase: GetMyContributionUseCase,
    private readonly cancelContributionUseCase: CancelContributionUseCase,
    private readonly getCampaignSupportSummaryUseCase: GetCampaignSupportSummaryUseCase,
    private readonly getSponsorSummaryUseCase: GetSponsorSummaryUseCase,
    private readonly createSponsorDisputeUseCase: CreateSponsorDisputeUseCase,
    private readonly listContributionDisputesUseCase: ListContributionDisputesUseCase,
  ) {}

  /** Resumen publico de apoyo de una campana, incluidos los cupos tomados. */
  @Get('campaign/:campaignId/summary')
  public async getCampaignSummary(@Param('campaignId') campaignId: string) {
    return this.getCampaignSupportSummaryUseCase.execute(campaignId);
  }

  /** Metricas del panel del patrocinador. Va antes de ':id' para no confundirse con un id. */
  @Get('me/summary')
  @UseGuards(JwtAuthGuard)
  public async getMySummary(@CurrentUser('id') sponsorUserId: string) {
    return this.getSponsorSummaryUseCase.execute(sponsorUserId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  public async listMine(
    @Query() query: ListMyContributionsHttpDto,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.listMyContributionsUseCase.execute(sponsorUserId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  public async create(
    @Body() dto: CreateContributionHttpDto,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.createContributionUseCase.execute({
      campaignId: dto.campaignId,
      sponsorUserId,
      amount: dto.amount,
      contributionType: dto.contributionType,
      rewardId: dto.rewardId ?? null,
      supporterMessage: dto.supporterMessage ?? null,
      isAnonymous: dto.isAnonymous ?? false,
    });
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async pay(
    @Param('id') id: string,
    @Body() dto: PayContributionHttpDto,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.payContributionUseCase.execute({
      contributionId: id,
      sponsorUserId,
      method: dto.method,
      card: dto.card,
    });
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  public async cancel(
    @Param('id') id: string,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.cancelContributionUseCase.execute(id, sponsorUserId);
  }

  /** "Reportar problema": abre una disputa sobre un aporte propio. */
  @Post(':id/disputes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  public async reportProblem(
    @Param('id') id: string,
    @Body() dto: CreateSponsorDisputeHttpDto,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.createSponsorDisputeUseCase.execute({
      contributionId: id,
      sponsorUserId,
      disputeType: dto.disputeType,
      description: dto.description,
    });
  }

  @Get(':id/disputes')
  @UseGuards(JwtAuthGuard)
  public async listDisputes(
    @Param('id') id: string,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.listContributionDisputesUseCase.execute(id, sponsorUserId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async getOne(
    @Param('id') id: string,
    @CurrentUser('id') sponsorUserId: string,
  ) {
    return this.getMyContributionUseCase.execute(id, sponsorUserId);
  }
}
