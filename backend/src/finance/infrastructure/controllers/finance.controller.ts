import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetFinanceSummaryUseCase } from '../../application/use-cases/get-finance-summary.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/list-payments.use-case';
import { GetReconciliationBoardUseCase } from '../../application/use-cases/get-reconciliation-board.use-case';
import { ResolveDiscrepancyUseCase } from '../../application/use-cases/resolve-discrepancy.use-case';
import { GetDisbursementsBoardUseCase } from '../../application/use-cases/get-disbursements-board.use-case';
import { ReviewDisbursementUseCase } from '../../application/use-cases/review-disbursement.use-case';
import { GetDisputesBoardUseCase } from '../../application/use-cases/get-disputes-board.use-case';
import { GetDisputeDetailUseCase } from '../../application/use-cases/get-dispute-detail.use-case';
import { ReplyDisputeUseCase } from '../../application/use-cases/reply-dispute.use-case';
import { ResolveDisputeUseCase } from '../../application/use-cases/resolve-dispute.use-case';
import {
  ListDisbursementsHttpDto,
  ListDiscrepanciesHttpDto,
  ListDisputesHttpDto,
  ListPaymentsHttpDto,
  ReplyDisputeHttpDto,
  ResolveDiscrepancyHttpDto,
  ResolveDisputeHttpDto,
  ReviewDisbursementHttpDto,
} from './dto/finance.http-dto';
import { JwtAuthGuard } from '../../../users/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../users/infrastructure/guards/roles.guard';
import { Roles } from '../../../users/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../users/infrastructure/decorators/current-user.decorator';

/**
 * Modulo de finanzas del panel de administracion. Todo el controlador exige
 * sesion valida y rol admin: no hay ninguna ruta publica aqui.
 */
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class FinanceController {
  constructor(
    private readonly getFinanceSummaryUseCase: GetFinanceSummaryUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly getReconciliationBoardUseCase: GetReconciliationBoardUseCase,
    private readonly resolveDiscrepancyUseCase: ResolveDiscrepancyUseCase,
    private readonly getDisbursementsBoardUseCase: GetDisbursementsBoardUseCase,
    private readonly reviewDisbursementUseCase: ReviewDisbursementUseCase,
    private readonly getDisputesBoardUseCase: GetDisputesBoardUseCase,
    private readonly getDisputeDetailUseCase: GetDisputeDetailUseCase,
    private readonly replyDisputeUseCase: ReplyDisputeUseCase,
    private readonly resolveDisputeUseCase: ResolveDisputeUseCase,
  ) {}

  // ------------------------------------------------------- Resumen financiero

  @Get('summary')
  public async getSummary() {
    return this.getFinanceSummaryUseCase.execute();
  }

  @Get('payments')
  public async listPayments(@Query() query: ListPaymentsHttpDto) {
    return this.listPaymentsUseCase.execute(query);
  }

  // ------------------------------------------------------------ Conciliacion

  @Get('reconciliation')
  public async getReconciliation(@Query() query: ListDiscrepanciesHttpDto) {
    return this.getReconciliationBoardUseCase.execute(query.status);
  }

  @Patch('reconciliation/:id/resolve')
  public async resolveDiscrepancy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDiscrepancyHttpDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.resolveDiscrepancyUseCase.execute(id, adminUserId, dto.note);
  }

  // ------------------------------------------------------------- Desembolsos

  @Get('disbursements')
  public async getDisbursements(@Query() query: ListDisbursementsHttpDto) {
    return this.getDisbursementsBoardUseCase.execute(query);
  }

  @Patch('disbursements/:id/review')
  public async reviewDisbursement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDisbursementHttpDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.reviewDisbursementUseCase.execute(id, adminUserId, dto.decision, dto.reason);
  }

  // ---------------------------------------------------------------- Disputas

  @Get('disputes')
  public async getDisputes(@Query() query: ListDisputesHttpDto) {
    return this.getDisputesBoardUseCase.execute(query);
  }

  @Get('disputes/:id')
  public async getDisputeDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.getDisputeDetailUseCase.execute(id);
  }

  @Post('disputes/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  public async replyDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyDisputeHttpDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.replyDisputeUseCase.execute(id, adminUserId, dto.body);
  }

  @Patch('disputes/:id/resolve')
  public async resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeHttpDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.resolveDisputeUseCase.execute(id, adminUserId, dto.decision, dto.resolution);
  }
}
