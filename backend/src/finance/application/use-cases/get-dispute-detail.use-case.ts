import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DisputeDetailView,
  type FinanceRepositoryPort,
} from '../ports/finance.repository.port';

/** Vista "Informacion del Caso" con el hilo de mensajes. */
@Injectable()
export class GetDisputeDetailUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(id: string): Promise<DisputeDetailView> {
    const dispute = await this.financeRepository.findDisputeById(id);
    if (!dispute) {
      throw new NotFoundException('Disputa no encontrada');
    }
    return dispute;
  }
}
