import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_REPOSITORY_PORT,
  type DisputeMessageView,
  type FinanceRepositoryPort,
} from '../ports/finance.repository.port';

const MAX_MESSAGE_LENGTH = 2000;

/** Respuesta de administracion dentro del hilo de un caso. */
@Injectable()
export class ReplyDisputeUseCase {
  constructor(
    @Inject(FINANCE_REPOSITORY_PORT)
    private readonly financeRepository: FinanceRepositoryPort,
  ) {}

  public async execute(
    id: string,
    adminUserId: string,
    body: string,
  ): Promise<DisputeMessageView> {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException('El mensaje no puede estar vacio');
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`,
      );
    }

    return this.financeRepository.addDisputeMessage(id, adminUserId, trimmed);
  }
}
