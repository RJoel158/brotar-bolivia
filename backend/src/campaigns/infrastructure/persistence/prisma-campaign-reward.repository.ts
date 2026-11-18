import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import { toPersistenceUnavailable } from '../../../shared/persistence/prisma-errors';
import { CampaignReward } from '../../domain/entities/campaign-reward.entity';
import { CampaignRewardInUseError } from '../../domain/errors/campaign-reward-in-use.error';
import type { CampaignRewardRepositoryPort } from '../../application/ports/campaign-reward.repository.port';
import { PrismaCampaignRewardMapper } from '../adapters/prisma-campaign-reward.mapper';

@Injectable()
export class PrismaCampaignRewardRepository implements CampaignRewardRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async save(reward: CampaignReward): Promise<CampaignReward> {
    return this.run(async () => {
      const record = await this.prisma.campaign_rewards.create({
        data: PrismaCampaignRewardMapper.toPersistence(reward),
      });
      return PrismaCampaignRewardMapper.toDomain(record);
    });
  }

  public async update(reward: CampaignReward): Promise<CampaignReward> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        await this.lockIfUnreferenced(tx, reward.getId());
        const record = await tx.campaign_rewards.update({
          where: { id: reward.getId() },
          data: PrismaCampaignRewardMapper.toUpdatePersistence(reward),
        });
        return PrismaCampaignRewardMapper.toDomain(record);
      }),
    );
  }

  public async setActive(reward: CampaignReward): Promise<CampaignReward> {
    return this.run(async () => {
      const record = await this.prisma.campaign_rewards.update({
        where: { id: reward.getId() },
        data: { is_active: reward.isActive(), updated_at: reward.getUpdatedAt() },
      });
      return PrismaCampaignRewardMapper.toDomain(record);
    });
  }

  public async findById(id: string): Promise<CampaignReward | null> {
    return this.run(async () => {
      const record = await this.prisma.campaign_rewards.findUnique({ where: { id } });
      return record ? PrismaCampaignRewardMapper.toDomain(record) : null;
    });
  }

  public async findByCampaignId(campaignId: string): Promise<CampaignReward[]> {
    return this.run(async () => {
      const records = await this.prisma.campaign_rewards.findMany({
        where: { campaign_id: campaignId },
        orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      });
      return records.map((record) => PrismaCampaignRewardMapper.toDomain(record));
    });
  }

  public async delete(id: string): Promise<void> {
    await this.run(async () => {
      try {
        await this.prisma.$transaction(async (tx) => {
          await this.lockIfUnreferenced(tx, id);
          await tx.campaign_rewards.delete({ where: { id } });
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          throw new CampaignRewardInUseError();
        }
        throw error;
      }
    });
  }

  /**
   * Locks the reward row before looking for contributions. Creating a
   * contribution takes a share lock on the same row, so both operations are
   * serialized and an edit cannot slip in between the check and the change.
   */
  private async lockIfUnreferenced(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campaign_rewards WHERE id = ${id}::uuid FOR UPDATE`;
    if (locked.length === 0) {
      throw new NotFoundException('La recompensa no fue encontrada.');
    }
    const contribution = await tx.contributions.findFirst({
      where: { reward_id: id },
      select: { id: true },
    });
    if (contribution) {
      throw new CampaignRewardInUseError();
    }
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('La recompensa no fue encontrada.');
      }
      throw toPersistenceUnavailable(error);
    }
  }
}
