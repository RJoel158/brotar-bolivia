import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FINANCE_REPOSITORY_PORT } from './application/ports/finance.repository.port';
import { PrismaFinanceRepository } from './infrastructure/persistence/prisma-finance.repository';
import { GetFinanceSummaryUseCase } from './application/use-cases/get-finance-summary.use-case';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';
import { GetReconciliationBoardUseCase } from './application/use-cases/get-reconciliation-board.use-case';
import { ResolveDiscrepancyUseCase } from './application/use-cases/resolve-discrepancy.use-case';
import { GetDisbursementsBoardUseCase } from './application/use-cases/get-disbursements-board.use-case';
import { ReviewDisbursementUseCase } from './application/use-cases/review-disbursement.use-case';
import { GetDisputesBoardUseCase } from './application/use-cases/get-disputes-board.use-case';
import { GetDisputeDetailUseCase } from './application/use-cases/get-dispute-detail.use-case';
import { ReplyDisputeUseCase } from './application/use-cases/reply-dispute.use-case';
import { ResolveDisputeUseCase } from './application/use-cases/resolve-dispute.use-case';
import { FinanceController } from './infrastructure/controllers/finance.controller';

@Module({
  imports: [UsersModule],
  controllers: [FinanceController],
  providers: [
    {
      provide: FINANCE_REPOSITORY_PORT,
      useClass: PrismaFinanceRepository,
    },
    GetFinanceSummaryUseCase,
    ListPaymentsUseCase,
    GetReconciliationBoardUseCase,
    ResolveDiscrepancyUseCase,
    GetDisbursementsBoardUseCase,
    ReviewDisbursementUseCase,
    GetDisputesBoardUseCase,
    GetDisputeDetailUseCase,
    ReplyDisputeUseCase,
    ResolveDisputeUseCase,
  ],
  exports: [FINANCE_REPOSITORY_PORT],
})
export class FinanceModule {}
