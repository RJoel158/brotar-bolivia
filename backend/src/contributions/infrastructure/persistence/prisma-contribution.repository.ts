import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { contribution_status } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import { toPersistenceUnavailable } from '../../../shared/persistence/prisma-errors';
import type {
  CampaignCheckoutView,
  CampaignSupportSummary,
  ConfirmPaymentData,
  ContributionRepositoryPort,
  ContributionStatus,
  ContributionType,
  ContributionView,
  CreateContributionData,
  MyContributionFilters,
  PaginatedContributions,
  RewardCheckoutView,
  RewardGuard,
  CreateSponsorDisputeData,
  RefundedContribution,
  SettlementCandidate,
  SettlementResult,
  SponsorDisputeView,
  SponsorSummary,
} from '../../application/ports/contribution.repository.port';

type ContributionRecord = Prisma.contributionsGetPayload<{
  include: {
    campaigns: { select: { id: true; title: true; cover_image_url: true } };
    users: { select: { full_name: true } };
    reward: { select: { title: true; estimated_delivery_on: true } };
  };
}>;

const WITH_RELATIONS = {
  campaigns: { select: { id: true, title: true, cover_image_url: true } },
  users: { select: { full_name: true } },
  reward: { select: { title: true, estimated_delivery_on: true } },
} as const;

interface RewardRow {
  id: string;
  campaign_id: string;
  title: string;
  min_amount: Prisma.Decimal | number | string;
  currency: string;
  quantity_total: number | null;
  quantity_claimed: number;
  is_active: boolean;
}

function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

function toRewardView(row: RewardRow): RewardCheckoutView {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    title: row.title,
    minimumContribution: toNumber(row.min_amount),
    currency: row.currency,
    quantityTotal: row.quantity_total,
    quantityClaimed: row.quantity_claimed,
    isActive: row.is_active,
  };
}

@Injectable()
export class PrismaContributionRepository implements ContributionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async findCampaignForCheckout(campaignId: string): Promise<CampaignCheckoutView | null> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return null;
    }

    return {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      coverImageUrl: campaign.cover_image_url,
      ownerUserId: campaign.owner_user_id,
      status: campaign.status,
      campaignType: campaign.campaign_type,
      fundingModel: campaign.funding_model,
      currency: campaign.currency,
      goalAmount: toNumber(campaign.goal_amount),
      currentAmount: toNumber(campaign.current_amount),
      endDate: campaign.end_date ? campaign.end_date.toISOString() : null,
    };
  }

  public async findRewardForCheckout(rewardId: string): Promise<RewardCheckoutView | null> {
    return this.run(async () => {
      const reward = await this.prisma.campaign_rewards.findUnique({
        where: { id: rewardId },
        select: {
          id: true,
          campaign_id: true,
          title: true,
          min_amount: true,
          currency: true,
          quantity_total: true,
          quantity_claimed: true,
          is_active: true,
        },
      });
      return reward ? toRewardView(reward) : null;
    });
  }

  public async create(
    data: CreateContributionData,
    rewardGuard?: RewardGuard,
  ): Promise<ContributionView> {
    const insert = (client: Prisma.TransactionClient | PrismaService) =>
      client.contributions.create({
        data: {
          campaign_id: data.campaignId,
          sponsor_user_id: data.sponsorUserId,
          amount: data.amount,
          commission_rate: data.commissionRate,
          commission_amount: data.commissionAmount,
          net_amount: data.netAmount,
          currency: data.currency,
          contribution_type: data.contributionType,
          reward_id: data.rewardId,
          supporter_message: data.supporterMessage,
          is_anonymous: data.isAnonymous,
          status: 'pending',
        },
        include: WITH_RELATIONS,
      });

    return this.run(async () => {
      if (!rewardGuard || !data.rewardId) {
        return this.toView(await insert(this.prisma));
      }
      const rewardId = data.rewardId;
      return this.prisma.$transaction(async (tx) => {
        // FOR SHARE: una edicion o borrado de la recompensa (FOR UPDATE) espera
        // a que este aporte termine, y luego lo encuentra y queda bloqueado.
        const rows = await tx.$queryRaw<RewardRow[]>`
          SELECT id, campaign_id, title, min_amount, currency, quantity_total, quantity_claimed, is_active
          FROM campaign_rewards WHERE id = ${rewardId}::uuid FOR SHARE`;
        rewardGuard(rows[0] ? toRewardView(rows[0]) : null);
        return this.toView(await insert(tx));
      });
    });
  }

  public async findById(id: string): Promise<ContributionView | null> {
    return this.run(async () => {
      const record = await this.prisma.contributions.findUnique({
        where: { id },
        include: WITH_RELATIONS,
      });
      return record ? this.toView(record) : null;
    });
  }

  public async findByIdForSponsor(
    id: string,
    sponsorUserId: string,
  ): Promise<ContributionView | null> {
    return this.run(async () => {
      const record = await this.prisma.contributions.findFirst({
        where: { id, sponsor_user_id: sponsorUserId },
        include: WITH_RELATIONS,
      });
      return record ? this.toView(record) : null;
    });
  }

  public async listBySponsor(
    sponsorUserId: string,
    filters: MyContributionFilters,
  ): Promise<PaginatedContributions> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 10));

    const where: Prisma.contributionsWhereInput = { sponsor_user_id: sponsorUserId };
    if (filters.status) {
      where.status = filters.status as contribution_status;
    }

    return this.run(async () => {
      const [records, total] = await Promise.all([
        this.prisma.contributions.findMany({
          where,
          include: WITH_RELATIONS,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.contributions.count({ where }),
      ]);

      return { items: records.map((record) => this.toView(record)), total, page, limit };
    });
  }

  /**
   * Una sola transaccion. El UPDATE condicional sobre el aporte deja ganar a
   * una sola confirmacion: una segunda solicitud espera el bloqueo de la fila,
   * la encuentra confirmada y no suma nada. El UPDATE condicional sobre la
   * recompensa hace lo mismo con el ultimo cupo. Si no hay cupo, se revierte
   * todo y el aporte queda pendiente, sin sumar a la recaudacion.
   */
  public async confirmPayment(id: string, data: ConfirmPaymentData): Promise<ContributionView> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const claimed = await tx.contributions.updateMany({
          where: { id, status: 'pending' },
          data: {
            status: 'confirmed',
            payment_method: data.paymentMethod,
            gateway_reference: data.gatewayReference,
            paid_at: now,
            updated_at: now,
          },
        });
        if (claimed.count === 0) {
          const exists = await tx.contributions.findUnique({ where: { id }, select: { id: true } });
          if (!exists) {
            throw new NotFoundException('Aporte no encontrado');
          }
          throw new ConflictException('Este aporte ya fue procesado');
        }

        const record = await tx.contributions.findUniqueOrThrow({
          where: { id },
          include: WITH_RELATIONS,
        });

        if (record.reward_id) {
          const adjudicated = await tx.$executeRaw`
            UPDATE campaign_rewards
            SET quantity_claimed = quantity_claimed + 1, updated_at = now()
            WHERE id = ${record.reward_id}::uuid
              AND campaign_id = ${record.campaign_id}::uuid
              AND is_active
              AND (quantity_total IS NULL OR quantity_claimed < quantity_total)`;
          if (adjudicated === 0) {
            throw new ConflictException(
              'La recompensa se agoto o dejo de estar disponible antes de confirmar el pago. El aporte no se confirmo ni se sumo a la recaudacion.',
            );
          }
        }

        await tx.campaign.update({
          where: { id: record.campaign_id },
          data: {
            current_amount: { increment: record.amount },
            updated_at: now,
          },
        });

        return this.toView(record);
      }),
    );
  }

  public async markFailed(id: string, reason: string): Promise<ContributionView> {
    return this.run(async () => {
      await this.prisma.contributions.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'failed', failure_reason: reason, updated_at: new Date() },
      });
      const record = await this.prisma.contributions.findUnique({
        where: { id },
        include: WITH_RELATIONS,
      });
      if (!record) {
        throw new NotFoundException('Aporte no encontrado');
      }
      return this.toView(record);
    });
  }

  public async cancel(id: string): Promise<ContributionView> {
    return this.run(async () => {
      const now = new Date();
      const cancelled = await this.prisma.contributions.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'cancelled', cancelled_at: now, updated_at: now },
      });
      const record = await this.prisma.contributions.findUnique({
        where: { id },
        include: WITH_RELATIONS,
      });
      if (!record) {
        throw new NotFoundException('Aporte no encontrado');
      }
      if (cancelled.count === 0) {
        throw new BadRequestException('Solo se puede cancelar un aporte pendiente de pago');
      }
      return this.toView(record);
    });
  }

  public async getCampaignSupportSummary(campaignId: string): Promise<CampaignSupportSummary> {
    return this.run(async () => {
      const [confirmed, supporters, rewards, campaign] = await Promise.all([
        this.prisma.contributions.aggregate({
          where: { campaign_id: campaignId, status: 'confirmed' },
          _sum: { amount: true },
        }),
        this.prisma.contributions.findMany({
          where: { campaign_id: campaignId, status: 'confirmed' },
          distinct: ['sponsor_user_id'],
          select: { sponsor_user_id: true },
        }),
        this.prisma.campaign_rewards.findMany({
          where: { campaign_id: campaignId },
          select: { id: true, quantity_claimed: true },
        }),
        this.prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { currency: true },
        }),
      ]);

      const claimedByReward: Record<string, number> = {};
      for (const reward of rewards) {
        claimedByReward[reward.id] = reward.quantity_claimed;
      }

      return {
        campaignId,
        supportersCount: supporters.length,
        confirmedAmount: toNumber(confirmed._sum.amount),
        currency: campaign?.currency ?? 'BOB',
        claimedByReward,
      };
    });
  }

  // ------------------------------------------------ Panel del patrocinador

  public async getSponsorSummary(sponsorUserId: string): Promise<SponsorSummary> {
    return this.run(async () => {
      const [confirmed, campaigns, pendingCount, refunded, openDisputes, latest] =
        await Promise.all([
          this.prisma.contributions.aggregate({
            where: { sponsor_user_id: sponsorUserId, status: 'confirmed' },
            _sum: { amount: true },
            _count: { _all: true },
          }),
          this.prisma.contributions.findMany({
            where: { sponsor_user_id: sponsorUserId, status: 'confirmed' },
            distinct: ['campaign_id'],
            select: { campaign_id: true },
          }),
          this.prisma.contributions.count({
            where: { sponsor_user_id: sponsorUserId, status: 'pending' },
          }),
          this.prisma.contributions.aggregate({
            where: { sponsor_user_id: sponsorUserId, status: 'refunded' },
            _sum: { amount: true },
            _count: { _all: true },
          }),
          this.prisma.disputes.count({
            where: { reporter_user_id: sponsorUserId, status: { in: ['open', 'in_review'] } },
          }),
          this.prisma.contributions.findFirst({
            where: { sponsor_user_id: sponsorUserId },
            orderBy: { created_at: 'desc' },
            select: { currency: true },
          }),
        ]);

      return {
        confirmedAmount: toNumber(confirmed._sum.amount),
        confirmedCount: confirmed._count._all,
        supportedCampaigns: campaigns.length,
        pendingCount,
        refundedAmount: toNumber(refunded._sum.amount),
        refundedCount: refunded._count._all,
        openDisputes,
        currency: latest?.currency ?? 'BOB',
      };
    });
  }

  // ---------------------------------------------- Disputas del patrocinador

  public async findOpenDisputeForContribution(
    contributionId: string,
  ): Promise<SponsorDisputeView | null> {
    return this.run(async () => {
      const record = await this.prisma.disputes.findFirst({
        where: { contribution_id: contributionId, status: { in: ['open', 'in_review'] } },
        orderBy: { opened_at: 'desc' },
      });
      return record ? this.toDisputeView(record) : null;
    });
  }

  public async createSponsorDispute(data: CreateSponsorDisputeData): Promise<SponsorDisputeView> {
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const dispute = await tx.disputes.create({
          data: {
            code: data.code,
            campaign_id: data.campaignId,
            contribution_id: data.contributionId,
            reporter_user_id: data.reporterUserId,
            dispute_type: data.disputeType,
            description: data.description,
            priority: data.priority,
            status: 'open',
          },
        });
        await tx.dispute_messages.create({
          data: {
            dispute_id: dispute.id,
            author_user_id: null,
            is_system: true,
            body: `Caso ${data.code} abierto por el patrocinador desde "Mis aportes".`,
          },
        });
        return dispute;
      });
      return this.toDisputeView(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El codigo de disputa ya existe');
      }
      throw toPersistenceUnavailable(error);
    }
  }

  public async listDisputesForContribution(
    contributionId: string,
    reporterUserId: string,
  ): Promise<SponsorDisputeView[]> {
    return this.run(async () => {
      const records = await this.prisma.disputes.findMany({
        where: { contribution_id: contributionId, reporter_user_id: reporterUserId },
        orderBy: { opened_at: 'desc' },
      });
      return records.map((record) => this.toDisputeView(record));
    });
  }

  // --------------------------------------- Liquidacion de campanas todo-o-nada

  public async listAllOrNothingSettlementCandidates(): Promise<SettlementCandidate[]> {
    return this.run(async () => {
      const rows = await this.prisma.$queryRaw<
        Array<{
          campaign_id: string;
          title: string;
          goal_amount: Prisma.Decimal;
          currency: string;
          end_date: Date;
          confirmed_amount: Prisma.Decimal;
          confirmed_count: bigint;
          pending_count: bigint;
        }>
      >`
        SELECT c.id AS campaign_id, c.title, c.goal_amount, c.currency, c.end_date,
               COALESCE(SUM(ct.amount) FILTER (WHERE ct.status = 'confirmed'), 0) AS confirmed_amount,
               COUNT(ct.id) FILTER (WHERE ct.status = 'confirmed') AS confirmed_count,
               COUNT(ct.id) FILTER (WHERE ct.status = 'pending') AS pending_count
        FROM campaigns c
        JOIN contributions ct ON ct.campaign_id = c.id
        WHERE c.funding_model = 'all_or_nothing'
          AND c.end_date IS NOT NULL
          AND c.end_date < CURRENT_DATE
        GROUP BY c.id, c.title, c.goal_amount, c.currency, c.end_date
        HAVING COUNT(ct.id) FILTER (WHERE ct.status IN ('confirmed', 'pending')) > 0
           AND COALESCE(SUM(ct.amount) FILTER (WHERE ct.status = 'confirmed'), 0) < c.goal_amount
        ORDER BY c.end_date ASC`;

      return rows.map((row) => ({
        campaignId: row.campaign_id,
        title: row.title,
        goalAmount: toNumber(row.goal_amount),
        confirmedAmount: toNumber(row.confirmed_amount),
        currency: row.currency,
        endDate: row.end_date.toISOString().slice(0, 10),
        confirmedCount: Number(row.confirmed_count),
        pendingCount: Number(row.pending_count),
      }));
    });
  }

  public async refundAllOrNothingCampaign(campaignId: string): Promise<SettlementResult> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        // Bloquea la campana: dos liquidaciones simultaneas no pueden devolver dos veces.
        const locked = await tx.$queryRaw<
          Array<{
            funding_model: string;
            has_ended: boolean;
            goal_amount: Prisma.Decimal;
            currency: string;
          }>
        >`
          SELECT funding_model::text AS funding_model,
                 (end_date IS NOT NULL AND end_date < CURRENT_DATE) AS has_ended,
                 goal_amount, currency
          FROM campaigns WHERE id = ${campaignId}::uuid FOR UPDATE`;
        const campaign = locked[0];
        if (!campaign) {
          throw new NotFoundException('Campana no encontrada');
        }
        if (campaign.funding_model !== 'all_or_nothing') {
          throw new BadRequestException('Solo se devuelven aportes de campanas todo o nada');
        }
        if (!campaign.has_ended) {
          throw new BadRequestException('La campana todavia no cerro su periodo de recaudacion');
        }

        const confirmed = await tx.contributions.aggregate({
          where: { campaign_id: campaignId, status: 'confirmed' },
          _sum: { amount: true },
        });
        if (toNumber(confirmed._sum.amount) >= toNumber(campaign.goal_amount)) {
          throw new ConflictException('La campana alcanzo su meta: no corresponde devolver los aportes');
        }

        const expiredPending = await tx.$executeRaw`
          UPDATE contributions SET status = 'expired', updated_at = now()
          WHERE campaign_id = ${campaignId}::uuid AND status = 'pending'`;

        const rows = await tx.$queryRaw<
          Array<{
            id: string;
            amount: Prisma.Decimal;
            currency: string;
            reward_id: string | null;
            gateway_reference: string | null;
          }>
        >`
          UPDATE contributions SET status = 'refunded', updated_at = now()
          WHERE campaign_id = ${campaignId}::uuid AND status = 'confirmed'
          RETURNING id, amount, currency, reward_id, gateway_reference`;

        // Cada aporte devuelto libera el cupo que habia adjudicado.
        const releasedByReward = new Map<string, number>();
        for (const row of rows) {
          if (row.reward_id) {
            releasedByReward.set(row.reward_id, (releasedByReward.get(row.reward_id) ?? 0) + 1);
          }
        }
        for (const [rewardId, released] of releasedByReward) {
          await tx.$executeRaw`
            UPDATE campaign_rewards
            SET quantity_claimed = GREATEST(quantity_claimed - ${released}::int, 0), updated_at = now()
            WHERE id = ${rewardId}::uuid`;
        }

        const refunded: RefundedContribution[] = rows.map((row) => ({
          id: row.id,
          amount: toNumber(row.amount),
          currency: row.currency,
          gatewayReference: row.gateway_reference,
        }));
        const refundedAmount =
          Math.round(refunded.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

        if (refundedAmount > 0) {
          await tx.$executeRaw`
            UPDATE campaigns
            SET current_amount = GREATEST(current_amount - ${refundedAmount.toFixed(2)}::numeric, 0),
                updated_at = now()
            WHERE id = ${campaignId}::uuid`;
        }

        return { campaignId, refunded, refundedAmount, expiredPending };
      }),
    );
  }

  private toDisputeView(record: {
    id: string;
    code: string;
    contribution_id: string | null;
    dispute_type: string;
    description: string;
    status: string;
    resolution: string | null;
    opened_at: Date;
    resolved_at: Date | null;
  }): SponsorDisputeView {
    return {
      id: record.id,
      code: record.code,
      contributionId: record.contribution_id,
      disputeType: record.dispute_type,
      description: record.description,
      status: record.status,
      resolution: record.resolution,
      openedAt: record.opened_at.toISOString(),
      resolvedAt: record.resolved_at ? record.resolved_at.toISOString() : null,
    };
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw toPersistenceUnavailable(error);
    }
  }

  private toView(record: ContributionRecord): ContributionView {
    return {
      id: record.id,
      campaignId: record.campaigns.id,
      campaignTitle: record.campaigns.title,
      campaignCoverUrl: record.campaigns.cover_image_url,
      sponsorUserId: record.sponsor_user_id,
      sponsorName: record.users.full_name,
      amount: toNumber(record.amount),
      commissionAmount: toNumber(record.commission_amount),
      netAmount: toNumber(record.net_amount),
      currency: record.currency,
      contributionType: record.contribution_type as ContributionType,
      rewardId: record.reward_id,
      rewardTitle: record.reward?.title ?? null,
      rewardEstimatedDeliveryOn: record.reward
        ? record.reward.estimated_delivery_on.toISOString().slice(0, 10)
        : null,
      supporterMessage: record.supporter_message,
      isAnonymous: record.is_anonymous,
      status: record.status as ContributionStatus,
      paymentMethod: record.payment_method,
      gatewayReference: record.gateway_reference,
      paidAt: record.paid_at ? record.paid_at.toISOString() : null,
      cancelledAt: record.cancelled_at ? record.cancelled_at.toISOString() : null,
      failureReason: record.failure_reason,
      createdAt: record.created_at.toISOString(),
    };
  }
}
