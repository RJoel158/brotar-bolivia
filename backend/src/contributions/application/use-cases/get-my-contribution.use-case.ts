import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type ContributionView,
} from '../ports/contribution.repository.port';

/** Detalle de un aporte propio: sirve de comprobante tras el pago. */
@Injectable()
export class GetMyContributionUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(id: string, sponsorUserId: string): Promise<ContributionView> {
    const contribution = await this.contributionRepository.findByIdForSponsor(id, sponsorUserId);
    if (!contribution) {
      throw new NotFoundException('Aporte no encontrado');
    }
    return contribution;
  }
}
