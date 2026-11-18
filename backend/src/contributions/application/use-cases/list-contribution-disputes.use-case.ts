import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type SponsorDisputeView,
} from '../ports/contribution.repository.port';

/** Casos que el patrocinador abrio sobre uno de sus aportes. */
@Injectable()
export class ListContributionDisputesUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(contributionId: string, sponsorUserId: string): Promise<SponsorDisputeView[]> {
    const contribution = await this.contributionRepository.findByIdForSponsor(
      contributionId,
      sponsorUserId,
    );
    if (!contribution) {
      throw new NotFoundException('Aporte no encontrado');
    }
    return this.contributionRepository.listDisputesForContribution(contributionId, sponsorUserId);
  }
}
