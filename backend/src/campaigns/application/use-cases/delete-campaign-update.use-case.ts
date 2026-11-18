import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_UPDATE_REPOSITORY_PORT } from '../ports/campaign-update.repository.port';
import type { CampaignUpdateRepositoryPort } from '../ports/campaign-update.repository.port';

@Injectable()
export class DeleteCampaignUpdateUseCase {
  constructor(
    @Inject(CAMPAIGN_UPDATE_REPOSITORY_PORT)
    private readonly campaignUpdateRepository: CampaignUpdateRepositoryPort,
  ) {}

  public async execute(
    campaignId: string,
    updateId: string,
    user: { id: string; role: string },
  ): Promise<void> {
    const update = await this.campaignUpdateRepository.findById(updateId);
    if (!update || update.getCampaignId() !== campaignId) {
      throw new NotFoundException('La actualización no fue encontrada.');
    }

    if (user.role !== 'admin' && update.getAuthorUserId() !== user.id) {
      throw new ForbiddenException('No tienes permiso para eliminar esta actualización.');
    }

    await this.campaignUpdateRepository.delete(updateId);
  }
}
