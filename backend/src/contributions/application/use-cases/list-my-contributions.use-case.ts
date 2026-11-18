import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type MyContributionFilters,
  type PaginatedContributions,
} from '../ports/contribution.repository.port';

/** Pantalla "Mis aportes" del patrocinador. */
@Injectable()
export class ListMyContributionsUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(
    sponsorUserId: string,
    filters: MyContributionFilters,
  ): Promise<PaginatedContributions> {
    return this.contributionRepository.listBySponsor(sponsorUserId, filters);
  }
}
