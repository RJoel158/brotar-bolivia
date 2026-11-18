import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DisbursementView,
  type FinanceRepositoryPort,
} from '../ports/finance.repository.port';

export type DisbursementDecision = 'approved' | 'rejected' | 'completed';

/**
 * Autorizacion de fondos a creadores. Las reglas de transicion (solo se aprueba
 * lo pendiente, solo se completa lo aprobado, y nunca se aprueba una cuenta sin
 * verificar) se validan en el repositorio junto a la lectura del estado actual.
 */
@Injectable()
export class ReviewDisbursementUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(
    id: string,
    adminUserId: string,
    decision: DisbursementDecision,
    reason?: string,
  ): Promise<DisbursementView> {
    return this.financeRepository.reviewDisbursement(id, adminUserId, decision, reason);
  }
}
