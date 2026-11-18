import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DiscrepancyView,
  type FinanceRepositoryPort,
  type ReconciliationSummaryView,
} from '../ports/finance.repository.port';

export interface ReconciliationBoard {
  summary: ReconciliationSummaryView;
  discrepancies: DiscrepancyView[];
}

/** Pantalla "Conciliacion de Pagos": totales del dia mas las discrepancias. */
@Injectable()
export class GetReconciliationBoardUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(status?: string): Promise<ReconciliationBoard> {
    const [summary, discrepancies] = await Promise.all([
      this.financeRepository.getReconciliationSummary(),
      this.financeRepository.listDiscrepancies(status),
    ]);

    return { summary, discrepancies };
  }
}
