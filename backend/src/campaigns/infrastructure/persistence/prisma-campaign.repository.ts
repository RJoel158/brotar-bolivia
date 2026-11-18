import { Injectable } from '@nestjs/common';
import { campaign_category, campaign_status } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';
import {
  CampaignFilterCriteria,
  CampaignRepositoryPort,
} from '../../application/ports/campaign.repository.port';
import { PrismaCampaignMapper } from '../adapters/prisma-campaign.mapper';

/** Only the public owner names; the user row also holds documents and credentials. */
const OWNER_PUBLIC_NAMES = {
  users: { select: { full_name: true, organization_name: true } },
  organizations: { select: { legal_name: true } },
} as const;

/** No relations: without relationJoins each one is an extra sequential query. */
const ACCESS_FIELDS = {
  id: true,
  owner_user_id: true,
  status: true,
  campaign_type: true,
  currency: true,
  goal_amount: true,
} as const;

@Injectable()
export class PrismaCampaignRepository implements CampaignRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async save(campaign: Campaign): Promise<Campaign> {
    const data = PrismaCampaignMapper.toPersistence(campaign);

    const record = await this.prisma.campaign.create({
      data,
    });

    return PrismaCampaignMapper.toDomain(record);
  }

  public async findById(id: string): Promise<Campaign | null> {
    const record = await this.prisma.campaign.findUnique({
      where: { id },
      include: OWNER_PUBLIC_NAMES,
    });

    if (!record) {
      return null;
    }

    return PrismaCampaignMapper.toDomain(record);
  }

  public async findAccessById(id: string): Promise<CampaignAccess | null> {
    const record = await this.prisma.campaign.findUnique({
      where: { id },
      select: ACCESS_FIELDS,
    });

    if (!record) {
      return null;
    }

    return PrismaCampaignMapper.toAccess(record);
  }

  public async findAll(criteria?: CampaignFilterCriteria): Promise<Campaign[]> {
    const where: {
      category?: campaign_category;
      status?: campaign_status;
      owner_user_id?: string;
    } = {};

    if (criteria?.category) {
      where.category = criteria.category.toLowerCase().trim() as campaign_category;
    }
    if (criteria?.status) {
      where.status = criteria.status.toLowerCase().trim() as campaign_status;
    }
    if (criteria?.ownerUserId) {
      where.owner_user_id = criteria.ownerUserId;
    }

    const records = await this.prisma.campaign.findMany({
      where,
      include: OWNER_PUBLIC_NAMES,
      orderBy: { created_at: 'desc' },
    });

    return records.map((record) => PrismaCampaignMapper.toDomain(record));
  }

  public async findByOwnerUserId(ownerUserId: string): Promise<Campaign[]> {
    const records = await this.prisma.campaign.findMany({
      where: { owner_user_id: ownerUserId },
      include: OWNER_PUBLIC_NAMES,
      orderBy: { created_at: 'desc' },
    });

    return records.map((record) => PrismaCampaignMapper.toDomain(record));
  }

  public async update(campaign: Campaign): Promise<Campaign> {
    const data = PrismaCampaignMapper.toUpdatePersistence(campaign);

    const record = await this.prisma.campaign.update({
      where: { id: campaign.getId() },
      data,
    });

    return PrismaCampaignMapper.toDomain(record);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.campaign.delete({
      where: { id },
    });
  }
}
