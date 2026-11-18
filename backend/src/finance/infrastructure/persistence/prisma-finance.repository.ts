import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  contribution_status,
  disbursement_status,
  dispute_status,
  reconciliation_status,
} from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import {
  DEFAULT_CURRENCY,
  DISBURSEMENT_BLOCKING_STATUSES,
} from '../../domain/finance.constants';
import type {
  DisbursementFilters,
  DisbursementSummaryView,
  DisbursementView,
  DiscrepancyView,
  DisputeDetailView,
  DisputeFilters,
  DisputeMessageView,
  DisputeSummaryView,
  DisputeView,
  FinanceRepositoryPort,
  FinanceSummaryView,
  PaginatedView,
  PaymentFilters,
  PaymentView,
  ReconciliationSummaryView,
} from '../../application/ports/finance.repository.port';

type DecimalLike = Prisma.Decimal | number | null | undefined;

function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}

function toNullableNumber(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(monthsAgo = 0): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

@Injectable()
export class PrismaFinanceRepository implements FinanceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- Finanzas

  public async getFinanceSummary(): Promise<FinanceSummaryView> {
    const [confirmed, pendingDisbursements, awaitingCampaigns, thisMonth, previousMonth] =
      await Promise.all([
        this.prisma.contributions.aggregate({
          where: { status: 'confirmed' },
          _sum: { amount: true, commission_amount: true },
        }),
        this.prisma.disbursements.aggregate({
          where: { status: { in: DISBURSEMENT_BLOCKING_STATUSES } },
          _sum: { net_amount: true },
        }),
        this.prisma.disbursements.findMany({
          where: { status: { in: DISBURSEMENT_BLOCKING_STATUSES } },
          distinct: ['campaign_id'],
          select: { campaign_id: true },
        }),
        this.prisma.contributions.aggregate({
          where: { status: 'confirmed', paid_at: { gte: startOfMonth() } },
          _sum: { amount: true },
        }),
        this.prisma.contributions.aggregate({
          where: {
            status: 'confirmed',
            paid_at: { gte: startOfMonth(1), lt: startOfMonth() },
          },
          _sum: { amount: true },
        }),
      ]);

    const current = toNumber(thisMonth._sum.amount);
    const previous = toNumber(previousMonth._sum.amount);

    return {
      grossCollected: toNumber(confirmed._sum.amount),
      platformCommission: toNumber(confirmed._sum.commission_amount),
      pendingDisbursement: toNumber(pendingDisbursements._sum.net_amount),
      campaignsAwaitingDisbursement: awaitingCampaigns.length,
      growthVsPreviousMonth:
        previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null,
      currency: DEFAULT_CURRENCY,
    };
  }

  public async listPayments(filters: PaymentFilters): Promise<PaginatedView<PaymentView>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 10));

    const where: Prisma.contributionsWhereInput = {};
    if (filters.status) {
      where.status = filters.status as contribution_status;
    }
    if (filters.search) {
      // Busca por proyecto, patrocinador o codigo de operacion.
      const search = filters.search.trim();
      where.OR = [
        { campaigns: { title: { contains: search, mode: 'insensitive' } } },
        { users: { full_name: { contains: search, mode: 'insensitive' } } },
        { gateway_reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.contributions.findMany({
        where,
        // select en vez de include: solo las columnas que muestra la tabla.
        select: {
          id: true,
          amount: true,
          commission_amount: true,
          net_amount: true,
          currency: true,
          status: true,
          contribution_type: true,
          payment_method: true,
          gateway_reference: true,
          failure_reason: true,
          paid_at: true,
          created_at: true,
          campaigns: { select: { id: true, title: true } },
          users: { select: { full_name: true } },
          reward: { select: { title: true } },
        },
        orderBy: [{ paid_at: 'desc' }, { created_at: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contributions.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        campaignId: record.campaigns.id,
        campaignTitle: record.campaigns.title,
        sponsorName: record.users.full_name,
        amount: toNumber(record.amount),
        currency: record.currency,
        status: record.status,
        paidAt: record.paid_at?.toISOString() ?? null,
        createdAt: record.created_at.toISOString(),
        commissionAmount: toNumber(record.commission_amount),
        netAmount: toNumber(record.net_amount),
        contributionType: record.contribution_type,
        paymentMethod: record.payment_method,
        gatewayReference: record.gateway_reference,
        rewardTitle: record.reward?.title ?? null,
        failureReason: record.failure_reason,
      })),
      total,
      page,
      limit,
    };
  }

  // ------------------------------------------------------------ Conciliacion

  public async getReconciliationSummary(): Promise<ReconciliationSummaryView> {
    const today = startOfToday();

    const [collected, transactionsToday, successfulToday, openDiscrepancies, lastCut] =
      await Promise.all([
        this.prisma.contributions.aggregate({
          where: { status: 'confirmed', paid_at: { gte: today } },
          _sum: { amount: true },
        }),
        this.prisma.contributions.count({ where: { created_at: { gte: today } } }),
        this.prisma.contributions.count({
          where: { status: 'confirmed', paid_at: { gte: today } },
        }),
        this.prisma.payment_reconciliations.count({ where: { status: 'pending' } }),
        this.prisma.payment_reconciliations.findFirst({
          orderBy: { detected_at: 'desc' },
          select: { detected_at: true },
        }),
      ]);

    const totalTransactions = await this.prisma.contributions.count();
    const reconciliationRate =
      totalTransactions > 0
        ? Math.round((1 - openDiscrepancies / totalTransactions) * 1000) / 10
        : 100;

    return {
      collectedToday: toNumber(collected._sum.amount),
      transactionsToday,
      successfulToday,
      openDiscrepancies,
      reconciliationRate,
      lastCutAt: lastCut?.detected_at.toISOString() ?? null,
      currency: DEFAULT_CURRENCY,
    };
  }

  public async listDiscrepancies(status?: string): Promise<DiscrepancyView[]> {
    const records = await this.prisma.payment_reconciliations.findMany({
      where: status ? { status: status as reconciliation_status } : undefined,
      orderBy: { detected_at: 'desc' },
    });

    return records.map((record) => ({
      id: record.id,
      gatewayReference: record.gateway_reference,
      discrepancyType: record.discrepancy_type,
      internalAmount: toNullableNumber(record.internal_amount),
      gatewayAmount: toNullableNumber(record.gateway_amount),
      currency: record.currency,
      status: record.status,
      detectedAt: record.detected_at.toISOString(),
      resolvedAt: record.resolved_at?.toISOString() ?? null,
      resolutionNote: record.resolution_note,
    }));
  }

  public async resolveDiscrepancy(
    id: string,
    adminUserId: string,
    note?: string,
  ): Promise<DiscrepancyView> {
    const existing = await this.prisma.payment_reconciliations.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Discrepancia no encontrada');
    }
    if (existing.status !== 'pending') {
      throw new BadRequestException('La discrepancia ya fue atendida');
    }

    const record = await this.prisma.payment_reconciliations.update({
      where: { id },
      data: {
        status: 'resolved',
        resolved_by_user_id: adminUserId,
        resolution_note: note ?? null,
        resolved_at: new Date(),
      },
    });

    return {
      id: record.id,
      gatewayReference: record.gateway_reference,
      discrepancyType: record.discrepancy_type,
      internalAmount: toNullableNumber(record.internal_amount),
      gatewayAmount: toNullableNumber(record.gateway_amount),
      currency: record.currency,
      status: record.status,
      detectedAt: record.detected_at.toISOString(),
      resolvedAt: record.resolved_at?.toISOString() ?? null,
      resolutionNote: record.resolution_note,
    };
  }

  // ------------------------------------------------------------ Desembolsos

  public async getDisbursementSummary(): Promise<DisbursementSummaryView> {
    const [pending, pendingCount, completed, failed, commissions] = await Promise.all([
      // El monto comprometido incluye aprobados y en proceso: es plata que ya
      // no esta disponible aunque todavia no haya salido.
      this.prisma.disbursements.aggregate({
        where: { status: { in: DISBURSEMENT_BLOCKING_STATUSES } },
        _sum: { net_amount: true },
      }),
      // El contador, en cambio, es solo lo que el admin todavia debe revisar,
      // para que cuadre con la pestana "Pendientes".
      this.prisma.disbursements.count({ where: { status: 'pending' } }),
      this.prisma.disbursements.aggregate({
        where: { status: 'completed' },
        _sum: { net_amount: true },
      }),
      this.prisma.disbursements.count({ where: { status: { in: ['failed', 'rejected'] } } }),
      this.prisma.contributions.aggregate({
        where: { status: 'confirmed' },
        _sum: { commission_amount: true },
      }),
    ]);

    return {
      totalPending: toNumber(pending._sum.net_amount),
      pendingCount,
      completedAmount: toNumber(completed._sum.net_amount),
      failedOrRejectedCount: failed,
      // El "Fondo de Garantia" del Figma no tiene tabla propia: lo representamos
      // con las comisiones retenidas por la plataforma, que es el dinero que
      // Brotar conserva y no se desembolsa.
      guaranteeFund: toNumber(commissions._sum.commission_amount),
      currency: DEFAULT_CURRENCY,
    };
  }

  public async listDisbursements(
    filters: DisbursementFilters,
  ): Promise<PaginatedView<DisbursementView>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 10));

    const where: Prisma.disbursementsWhereInput = {};
    if (filters.status) {
      where.status = filters.status as disbursement_status;
    }
    if (filters.search) {
      where.campaigns = { title: { contains: filters.search, mode: 'insensitive' } };
    }

    const [records, total] = await Promise.all([
      this.prisma.disbursements.findMany({
        where,
        include: {
          campaigns: { select: { id: true, title: true, cover_image_url: true } },
          requested_by: { select: { full_name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.disbursements.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toDisbursementView(record)),
      total,
      page,
      limit,
    };
  }

  public async reviewDisbursement(
    id: string,
    adminUserId: string,
    decision: 'approved' | 'rejected' | 'completed',
    reason?: string,
  ): Promise<DisbursementView> {
    const existing = await this.prisma.disbursements.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Desembolso no encontrado');
    }

    if (decision === 'completed' && existing.status !== 'approved') {
      throw new BadRequestException('Solo se puede completar un desembolso aprobado');
    }
    if (decision !== 'completed' && existing.status !== 'pending') {
      throw new BadRequestException('El desembolso ya fue revisado');
    }
    if (decision === 'approved' && !existing.account_verified) {
      throw new BadRequestException(
        'No se puede aprobar un desembolso con cuenta bancaria sin verificar',
      );
    }

    const record = await this.prisma.disbursements.update({
      where: { id },
      data: {
        status: decision,
        reviewed_by_user_id: adminUserId,
        reviewed_at: new Date(),
        processed_at: decision === 'completed' ? new Date() : undefined,
        failure_reason: decision === 'rejected' ? (reason ?? null) : undefined,
        updated_at: new Date(),
      },
      include: {
        campaigns: { select: { id: true, title: true, cover_image_url: true } },
        requested_by: { select: { full_name: true } },
      },
    });

    return this.toDisbursementView(record);
  }

  private toDisbursementView(record: {
    id: string;
    campaigns: { id: string; title: string; cover_image_url: string | null };
    requested_by: { full_name: string };
    gross_amount: Prisma.Decimal;
    commission_rate: Prisma.Decimal;
    commission_amount: Prisma.Decimal;
    net_amount: Prisma.Decimal;
    currency: string;
    bank_name: string | null;
    bank_account: string | null;
    account_verified: boolean;
    status: string;
    created_at: Date;
  }): DisbursementView {
    return {
      id: record.id,
      campaignId: record.campaigns.id,
      campaignTitle: record.campaigns.title,
      campaignCoverUrl: record.campaigns.cover_image_url,
      creatorName: record.requested_by.full_name,
      grossAmount: toNumber(record.gross_amount),
      commissionRate: toNumber(record.commission_rate),
      commissionAmount: toNumber(record.commission_amount),
      netAmount: toNumber(record.net_amount),
      currency: record.currency,
      bankName: record.bank_name,
      bankAccount: record.bank_account,
      accountVerified: record.account_verified,
      status: record.status,
      createdAt: record.created_at.toISOString(),
    };
  }

  // ---------------------------------------------------------------- Disputas

  public async getDisputeSummary(): Promise<DisputeSummaryView> {
    const [active, inReview, resolvedThisMonth, resolvedSample] = await Promise.all([
      this.prisma.disputes.count({ where: { status: 'open' } }),
      this.prisma.disputes.count({ where: { status: 'in_review' } }),
      this.prisma.disputes.count({
        where: { status: 'resolved', resolved_at: { gte: startOfMonth() } },
      }),
      this.prisma.disputes.findMany({
        where: { status: 'resolved', resolved_at: { not: null } },
        select: { opened_at: true, resolved_at: true },
        take: 100,
        orderBy: { resolved_at: 'desc' },
      }),
    ]);

    let averageResponseHours: number | null = null;
    if (resolvedSample.length > 0) {
      const totalHours = resolvedSample.reduce((sum, dispute) => {
        const resolvedAt = dispute.resolved_at as Date;
        return sum + (resolvedAt.getTime() - dispute.opened_at.getTime()) / 3_600_000;
      }, 0);
      averageResponseHours = Math.round((totalHours / resolvedSample.length) * 10) / 10;
    }

    return { active, inReview, resolvedThisMonth, averageResponseHours };
  }

  public async listDisputes(filters: DisputeFilters): Promise<PaginatedView<DisputeView>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 10));

    const where: Prisma.disputesWhereInput = filters.status
      ? { status: filters.status as dispute_status }
      : {};

    const [records, total] = await Promise.all([
      this.prisma.disputes.findMany({
        where,
        include: {
          campaigns: {
            select: { id: true, title: true, cover_image_url: true, users: { select: { full_name: true } } },
          },
          reporter: { select: { full_name: true } },
          contributions: { select: { amount: true, currency: true } },
        },
        orderBy: { opened_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.disputes.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        code: record.code,
        campaignId: record.campaigns.id,
        campaignTitle: record.campaigns.title,
        campaignCoverUrl: record.campaigns.cover_image_url,
        creatorName: record.campaigns.users.full_name,
        reporterName: record.reporter.full_name,
        contributionAmount: toNullableNumber(record.contributions?.amount),
        currency: record.contributions?.currency ?? DEFAULT_CURRENCY,
        disputeType: record.dispute_type,
        status: record.status,
        priority: record.priority,
        openedAt: record.opened_at.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  public async findDisputeById(id: string): Promise<DisputeDetailView | null> {
    const record = await this.prisma.disputes.findUnique({
      where: { id },
      include: {
        campaigns: {
          select: { id: true, title: true, cover_image_url: true, users: { select: { full_name: true } } },
        },
        reporter: { select: { full_name: true } },
        contributions: { select: { amount: true, currency: true, gateway_reference: true } },
        messages: {
          orderBy: { created_at: 'asc' },
          include: { author: { select: { full_name: true } } },
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      code: record.code,
      campaignId: record.campaigns.id,
      campaignTitle: record.campaigns.title,
      campaignCoverUrl: record.campaigns.cover_image_url,
      creatorName: record.campaigns.users.full_name,
      reporterName: record.reporter.full_name,
      contributionAmount: toNullableNumber(record.contributions?.amount),
      currency: record.contributions?.currency ?? DEFAULT_CURRENCY,
      disputeType: record.dispute_type,
      status: record.status,
      priority: record.priority,
      openedAt: record.opened_at.toISOString(),
      description: record.description,
      resolution: record.resolution,
      linkedOperation: record.contributions?.gateway_reference ?? null,
      messages: record.messages.map((message) => ({
        id: message.id,
        authorName: message.is_system ? 'Sistema' : (message.author?.full_name ?? 'Usuario'),
        isSystem: message.is_system,
        body: message.body,
        createdAt: message.created_at.toISOString(),
      })),
    };
  }

  public async addDisputeMessage(
    id: string,
    authorUserId: string,
    body: string,
  ): Promise<DisputeMessageView> {
    const dispute = await this.prisma.disputes.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Disputa no encontrada');
    }

    const message = await this.prisma.dispute_messages.create({
      data: { dispute_id: id, author_user_id: authorUserId, body },
      include: { author: { select: { full_name: true } } },
    });

    return {
      id: message.id,
      authorName: message.author?.full_name ?? 'Usuario',
      isSystem: message.is_system,
      body: message.body,
      createdAt: message.created_at.toISOString(),
    };
  }

  public async resolveDispute(
    id: string,
    adminUserId: string,
    decision: 'resolved' | 'in_review',
    resolution?: string,
  ): Promise<DisputeDetailView> {
    const dispute = await this.prisma.disputes.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Disputa no encontrada');
    }
    if (dispute.status === 'resolved') {
      throw new BadRequestException('La disputa ya esta resuelta');
    }

    await this.prisma.$transaction([
      this.prisma.disputes.update({
        where: { id },
        data: {
          status: decision,
          assigned_to_user_id: adminUserId,
          resolution: decision === 'resolved' ? (resolution ?? null) : undefined,
          resolved_at: decision === 'resolved' ? new Date() : null,
          updated_at: new Date(),
        },
      }),
      this.prisma.dispute_messages.create({
        data: {
          dispute_id: id,
          is_system: true,
          body:
            decision === 'resolved'
              ? `Caso resuelto por administracion.${resolution ? ` ${resolution}` : ''}`
              : 'Caso escalado a revision por administracion.',
        },
      }),
    ]);

    const detail = await this.findDisputeById(id);
    if (!detail) {
      throw new NotFoundException('Disputa no encontrada');
    }
    return detail;
  }
}
