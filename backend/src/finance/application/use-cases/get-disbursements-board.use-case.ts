import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DisbursementFilters,
  type DisbursementSummaryView,
  type DisbursementView,
  type FinanceRepositoryPort,
  type PaginatedView,
} from '../ports/finance.repository.port';

export interface DisbursementsBoard {
  summary: DisbursementSummaryView;
  disbursements: PaginatedView<DisbursementView>;
}

/** Pantalla "Desembolsos": tarjetas de cabecera mas la tabla por pestana. */
@Injectable()
export class GetDisbursementsBoardUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(filters: DisbursementFilters): Promise<DisbursementsBoard> {
    const [summary, disbursements] = await Promise.all([
      this.financeRepository.getDisbursementSummary(),
      this.financeRepository.listDisbursements(filters),
    ]);

    return { summary, disbursements };
  }
}
