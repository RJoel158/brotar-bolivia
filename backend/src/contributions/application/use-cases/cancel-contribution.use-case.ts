import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type ContributionView,
} from '../ports/contribution.repository.port';

/**
 * El patrocinador abandona un checkout a medias. Solo se cancela un aporte
 * pendiente, que nunca ocupo cupo de recompensa.
 */
@Injectable()
export class CancelContributionUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(id: string, sponsorUserId: string): Promise<ContributionView> {
    const contribution = await this.contributionRepository.findById(id);
    if (!contribution) {
      throw new NotFoundException('Aporte no encontrado');
    }
    if (contribution.sponsorUserId !== sponsorUserId) {
      throw new ForbiddenException('Este aporte no te pertenece');
    }

    return this.contributionRepository.cancel(id);
  }
}
