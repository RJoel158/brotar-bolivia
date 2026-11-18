import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY_PORT } from '../ports/campaign.repository.port';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import {
  CAMPAIGN_REVIEW_REPOSITORY_PORT,
  formatSectionNotesAsText,
  hasSectionNotes,
  normalizeSectionNotes,
  type CampaignReviewRepositoryPort,
  type CampaignReviewSectionNotes,
} from '../ports/campaign-review.repository.port';
import type { CampaignResponseDto } from '../dto/campaign-response.dto';
import { toCampaignResponseDto } from '../dto/campaign-mapper';

type AdminReviewAction = 'approve' | 'reject' | 'request_changes';

export interface ReviewCampaignCommand {
  campaignId: string;
  reviewerUserId: string;
  action: AdminReviewAction;
  notes?: string | null;
  rejectionReason?: string | null;
  sectionNotes?: CampaignReviewSectionNotes | null;
}

@Injectable()
export class ReviewCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY_PORT)
    private readonly campaignRepository: CampaignRepositoryPort,
    @Inject(CAMPAIGN_REVIEW_REPOSITORY_PORT)
    private readonly campaignReviewRepository: CampaignReviewRepositoryPort,
  ) {}

  public async execute(command: ReviewCampaignCommand): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findById(command.campaignId);

    if (!campaign) {
      throw new NotFoundException(`Campaña con ID "${command.campaignId}" no encontrada.`);
    }

    const sectionNotes = normalizeSectionNotes(command.sectionNotes);
    const freeNotes = command.notes?.trim() || null;
    const combinedNotes =
      formatSectionNotesAsText(sectionNotes) || freeNotes;

    try {
      if (command.action === 'approve') {
        campaign.approve(combinedNotes);
      } else if (command.action === 'reject') {
        const reason = command.rejectionReason?.trim();
        if (!reason) {
          throw new BadRequestException('Debes indicar el motivo oficial de rechazo.');
        }
        campaign.reject(reason);
      } else {
        if (!hasSectionNotes(sectionNotes) && !freeNotes) {
          throw new BadRequestException(
            'Debes indicar al menos una nota por sección u observación para solicitar cambios.',
          );
        }
        campaign.requestChanges(combinedNotes || freeNotes || '');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Acción de revisión no permitida.';
      throw new ConflictException(message);
    }

    const saved = await this.campaignRepository.update(campaign);

    await this.campaignReviewRepository.save({
      campaignId: command.campaignId,
      reviewerUserId: command.reviewerUserId,
      action:
        command.action === 'approve'
          ? 'approved'
          : command.action === 'reject'
            ? 'rejected'
            : 'changes_requested',
      reason:
        command.action === 'reject'
          ? command.rejectionReason?.trim() || null
          : combinedNotes,
      sectionNotes,
    });

    return toCampaignResponseDto(saved);
  }
}
