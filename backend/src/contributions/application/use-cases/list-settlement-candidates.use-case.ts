import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type SettlementCandidate,
} from '../ports/contribution.repository.port';

/** Campanas todo-o-nada vencidas, sin meta alcanzada y con aportes por devolver. */
@Injectable()
export class ListSettlementCandidatesUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(): Promise<SettlementCandidate[]> {
    return this.contributionRepository.listAllOrNothingSettlementCandidates();
  }
}
