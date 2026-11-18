import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type FinanceRepositoryPort,
  type FinanceSummaryView,
} from '../ports/finance.repository.port';

/** Tarjetas del "Resumen Financiero": bruto, comision Brotar y pendiente. */
@Injectable()
export class GetFinanceSummaryUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(): Promise<FinanceSummaryView> {
    return this.financeRepository.getFinanceSummary();
  }
}
