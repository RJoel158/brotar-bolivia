import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CONTRIBUTION_REPOSITORY_PORT } from './application/ports/contribution.repository.port';
import { PAYMENT_GATEWAY_PORT } from './application/ports/payment-gateway.port';
import { PrismaContributionRepository } from './infrastructure/persistence/prisma-contribution.repository';
import { SimulatedPaymentGateway } from './infrastructure/adapters/simulated-payment.gateway';
import { CreateContributionUseCase } from './application/use-cases/create-contribution.use-case';
import { PayContributionUseCase } from './application/use-cases/pay-contribution.use-case';
import { ListMyContributionsUseCase } from './application/use-cases/list-my-contributions.use-case';
import { GetMyContributionUseCase } from './application/use-cases/get-my-contribution.use-case';
import { CancelContributionUseCase } from './application/use-cases/cancel-contribution.use-case';
import { GetCampaignSupportSummaryUseCase } from './application/use-cases/get-campaign-support-summary.use-case';
import { GetSponsorSummaryUseCase } from './application/use-cases/get-sponsor-summary.use-case';
import { CreateSponsorDisputeUseCase } from './application/use-cases/create-sponsor-dispute.use-case';
import { ListContributionDisputesUseCase } from './application/use-cases/list-contribution-disputes.use-case';
import { ListSettlementCandidatesUseCase } from './application/use-cases/list-settlement-candidates.use-case';
import { RefundAllOrNothingCampaignUseCase } from './application/use-cases/refund-all-or-nothing-campaign.use-case';
import { ContributionController } from './infrastructure/controllers/contribution.controller';
import { SettlementController } from './infrastructure/controllers/settlement.controller';

@Module({
  imports: [UsersModule],
  controllers: [ContributionController, SettlementController],
  providers: [
    {
      provide: CONTRIBUTION_REPOSITORY_PORT,
      useClass: PrismaContributionRepository,
    },
    {
      // Cuando exista una pasarela real, se cambia solo este adaptador.
      provide: PAYMENT_GATEWAY_PORT,
      useClass: SimulatedPaymentGateway,
    },
    CreateContributionUseCase,
    PayContributionUseCase,
    ListMyContributionsUseCase,
    GetMyContributionUseCase,
    CancelContributionUseCase,
    GetCampaignSupportSummaryUseCase,
    GetSponsorSummaryUseCase,
    CreateSponsorDisputeUseCase,
    ListContributionDisputesUseCase,
    ListSettlementCandidatesUseCase,
    RefundAllOrNothingCampaignUseCase,
  ],
  exports: [CONTRIBUTION_REPOSITORY_PORT],
})
export class ContributionsModule {}
