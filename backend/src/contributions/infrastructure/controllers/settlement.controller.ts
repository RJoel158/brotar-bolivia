import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ListSettlementCandidatesUseCase } from '../../application/use-cases/list-settlement-candidates.use-case';
import { RefundAllOrNothingCampaignUseCase } from '../../application/use-cases/refund-all-or-nothing-campaign.use-case';
import { JwtAuthGuard } from '../../../users/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../users/infrastructure/guards/roles.guard';
import { Roles } from '../../../users/infrastructure/decorators/roles.decorator';

/**
 * Liquidacion de campanas todo-o-nada que cerraron sin alcanzar su meta.
 * Solo el administrador ve las candidatas y ejecuta la devolucion simulada.
 */
@Controller('admin/settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettlementController {
  constructor(
    private readonly listSettlementCandidatesUseCase: ListSettlementCandidatesUseCase,
    private readonly refundAllOrNothingCampaignUseCase: RefundAllOrNothingCampaignUseCase,
  ) {}

  @Get('all-or-nothing')
  public async listCandidates() {
    return this.listSettlementCandidatesUseCase.execute();
  }

  @Post('all-or-nothing/:campaignId/refund')
  @HttpCode(HttpStatus.OK)
  public async refund(@Param('campaignId') campaignId: string) {
    return this.refundAllOrNothingCampaignUseCase.execute(campaignId);
  }
}
