import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DiscrepancyView,
  type FinanceRepositoryPort,
} from '../ports/finance.repository.port';

/** Boton "Conciliar" de la tabla de discrepancias. */
@Injectable()
export class ResolveDiscrepancyUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(id: string, adminUserId: string, note?: string): Promise<DiscrepancyView> {
    return this.financeRepository.resolveDiscrepancy(id, adminUserId, note);
  }
}
