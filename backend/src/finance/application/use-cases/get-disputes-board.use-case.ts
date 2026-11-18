import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DisputeFilters,
  type DisputeSummaryView,
  type DisputeView,
  type FinanceRepositoryPort,
  type PaginatedView,
} from '../ports/finance.repository.port';

export interface DisputesBoard {
  summary: DisputeSummaryView;
  disputes: PaginatedView<DisputeView>;
}

/** Pantalla "Disputas": contadores de cabecera mas la bandeja de casos. */
@Injectable()
export class GetDisputesBoardUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(filters: DisputeFilters): Promise<DisputesBoard> {
    const [summary, disputes] = await Promise.all([
      this.financeRepository.getDisputeSummary(),
      this.financeRepository.listDisputes(filters),
    ]);

    return { summary, disputes };
  }
}
