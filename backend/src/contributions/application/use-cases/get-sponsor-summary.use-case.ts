import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type SponsorSummary,
} from '../ports/contribution.repository.port';

/** Metricas del panel del patrocinador sobre todos sus aportes. */
@Injectable()
export class GetSponsorSummaryUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(sponsorUserId: string): Promise<SponsorSummary> {
    return this.contributionRepository.getSponsorSummary(sponsorUserId);
  }
}
