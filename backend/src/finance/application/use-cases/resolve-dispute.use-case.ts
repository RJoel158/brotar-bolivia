import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DisputeDetailView,
  type FinanceRepositoryPort,
} from '../ports/finance.repository.port';

export type DisputeDecision = 'resolved' | 'in_review';

/**
 * "Acciones Criticas" del detalle del caso: resolver o escalar a revision.
 * Ambas dejan un mensaje de sistema en el hilo para que quede auditoria.
 */
@Injectable()
export class ResolveDisputeUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(
    id: string,
    adminUserId: string,
    decision: DisputeDecision,
    resolution?: string,
  ): Promise<DisputeDetailView> {
    return this.financeRepository.resolveDispute(id, adminUserId, decision, resolution);
  }
}
