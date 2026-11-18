import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type FinanceRepositoryPort,
  type PaginatedView,
  type PaymentFilters,
  type PaymentView,
} from '../ports/finance.repository.port';

/** "Listado de pagos recibidos", con busqueda por proyecto y paginacion. */
@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(filters: PaymentFilters): Promise<PaginatedView<PaymentView>> {
    return this.financeRepository.listPayments(filters);
  }
}
