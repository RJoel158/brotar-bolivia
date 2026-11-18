import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTRIBUTION_REPOSITORY_PORT,
  type ContributionRepositoryPort,
  type SponsorDisputeType,
  type SponsorDisputeView,
} from '../ports/contribution.repository.port';
import { SponsorDisputeRules } from '../../domain/sponsor-dispute.rules';

export interface CreateSponsorDisputeCommand {
  contributionId: string;
  sponsorUserId: string;
  disputeType: SponsorDisputeType;
  description: string;
}

/** Codigos aleatorios: si chocan con uno existente se reintenta. */
const MAX_CODE_ATTEMPTS = 5;

/**
 * "Reportar problema" desde Mis aportes: abre un caso en la bandeja de
 * disputas del administrador, vinculado al aporte y a su campana.
 */
@Injectable()
export class CreateSponsorDisputeUseCase {
  constructor(
    @Inject(CONTRIBUTION_REPOSITORY_PORT)
    private readonly contributionRepository: ContributionRepositoryPort,
  ) {}

  public async execute(command: CreateSponsorDisputeCommand): Promise<SponsorDisputeView> {
    const contribution = await this.contributionRepository.findByIdForSponsor(
      command.contributionId,
      command.sponsorUserId,
    );
    if (!contribution) {
      throw new NotFoundException('Aporte no encontrado');
    }

    const description = SponsorDisputeRules.validateDescription(command.description);
    SponsorDisputeRules.validateContribution(contribution, command.disputeType);
    SponsorDisputeRules.ensureNoOpenDispute(
      await this.contributionRepository.findOpenDisputeForContribution(contribution.id),
    );

    for (let attempt = 1; ; attempt += 1) {
      try {
        return await this.contributionRepository.createSponsorDispute({
          code: SponsorDisputeRules.generateCode(),
          campaignId: contribution.campaignId,
          contributionId: contribution.id,
          reporterUserId: command.sponsorUserId,
          disputeType: command.disputeType,
          description,
          priority: SponsorDisputeRules.priorityFor(command.disputeType),
        });
      } catch (error) {
        if (!(error instanceof ConflictException) || attempt >= MAX_CODE_ATTEMPTS) {
          throw error;
        }
      }
    }
  }
}
