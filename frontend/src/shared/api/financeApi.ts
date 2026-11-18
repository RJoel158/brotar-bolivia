import { apiClient } from './apiClient.ts';

/** Modulo de finanzas del panel de administracion. Todas las rutas exigen rol admin. */

export interface FinanceSummary {
  grossCollected: number;
  platformCommission: number;
  pendingDisbursement: number;
  campaignsAwaitingDisbursement: number;
  growthVsPreviousMonth: number | null;
  currency: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type PaymentStatus =
  | 'pending'
  | 'confirmed'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface Payment {
  id: string;
  campaignId: string;
  campaignTitle: string;
  sponsorName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  commissionAmount: number;
  netAmount: number;
  contributionType: string;
  paymentMethod: string | null;
  gatewayReference: string | null;
  rewardTitle: string | null;
  failureReason: string | null;
}

export interface ReconciliationSummary {
  collectedToday: number;
  transactionsToday: number;
  successfulToday: number;
  openDiscrepancies: number;
  reconciliationRate: number;
  lastCutAt: string | null;
  currency: string;
}

export type DiscrepancyType =
  | 'amount_mismatch'
  | 'missing_in_gateway'
  | 'missing_internally'
  | 'duplicated';

export interface Discrepancy {
  id: string;
  gatewayReference: string;
  discrepancyType: DiscrepancyType;
  internalAmount: number | null;
  gatewayAmount: number | null;
  currency: string;
  status: 'pending' | 'resolved' | 'ignored';
  detectedAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface ReconciliationBoard {
  summary: ReconciliationSummary;
  discrepancies: Discrepancy[];
}

export type DisbursementStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface Disbursement {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverUrl: string | null;
  creatorName: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  bankName: string | null;
  bankAccount: string | null;
  accountVerified: boolean;
  status: DisbursementStatus;
  createdAt: string;
}

export interface DisbursementsBoard {
  summary: {
    totalPending: number;
    pendingCount: number;
    completedAmount: number;
    failedOrRejectedCount: number;
    guaranteeFund: number;
    currency: string;
  };
  disbursements: Paginated<Disbursement>;
}

export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

export type DisputeType =
  | 'payment_not_recognized'
  | 'reward_not_received'
  | 'metrics_discrepancy'
  | 'project_not_executed'
  | 'refund_request'
  | 'other';

export interface Dispute {
  id: string;
  code: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverUrl: string | null;
  creatorName: string;
  reporterName: string;
  contributionAmount: number | null;
  currency: string;
  disputeType: DisputeType;
  status: DisputeStatus;
  priority: 'low' | 'medium' | 'high';
  openedAt: string;
}

export interface DisputeMessage {
  id: string;
  authorName: string;
  isSystem: boolean;
  body: string;
  createdAt: string;
}

export interface DisputeDetail extends Dispute {
  description: string;
  resolution: string | null;
  linkedOperation: string | null;
  messages: DisputeMessage[];
}

export interface DisputesBoard {
  summary: {
    active: number;
    inReview: number;
    resolvedThisMonth: number;
    averageResponseHours: number | null;
  };
  disputes: Paginated<Dispute>;
}

export const financeApi = {
  async getSummary(): Promise<FinanceSummary> {
    const { data } = await apiClient.get<FinanceSummary>('/admin/finance/summary');
    return data;
  },

  async listPayments(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<Payment>> {
    const { data } = await apiClient.get<Paginated<Payment>>('/admin/finance/payments', {
      params,
    });
    return data;
  },

  async getReconciliation(status?: string): Promise<ReconciliationBoard> {
    const { data } = await apiClient.get<ReconciliationBoard>('/admin/finance/reconciliation', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async resolveDiscrepancy(id: string, note?: string): Promise<Discrepancy> {
    const { data } = await apiClient.patch<Discrepancy>(
      `/admin/finance/reconciliation/${id}/resolve`,
      { note },
    );
    return data;
  },

  async getDisbursements(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DisbursementsBoard> {
    const { data } = await apiClient.get<DisbursementsBoard>('/admin/finance/disbursements', {
      params,
    });
    return data;
  },

  async reviewDisbursement(
    id: string,
    decision: 'approved' | 'rejected' | 'completed',
    reason?: string,
  ): Promise<Disbursement> {
    const { data } = await apiClient.patch<Disbursement>(
      `/admin/finance/disbursements/${id}/review`,
      { decision, reason },
    );
    return data;
  },

  async getDisputes(params: { status?: string; page?: number; limit?: number }): Promise<DisputesBoard> {
    const { data } = await apiClient.get<DisputesBoard>('/admin/finance/disputes', { params });
    return data;
  },

  async getDisputeDetail(id: string): Promise<DisputeDetail> {
    const { data } = await apiClient.get<DisputeDetail>(`/admin/finance/disputes/${id}`);
    return data;
  },

  async replyDispute(id: string, body: string): Promise<DisputeMessage> {
    const { data } = await apiClient.post<DisputeMessage>(
      `/admin/finance/disputes/${id}/messages`,
      { body },
    );
    return data;
  },

  async resolveDispute(
    id: string,
    decision: 'resolved' | 'in_review',
    resolution?: string,
  ): Promise<DisputeDetail> {
    const { data } = await apiClient.patch<DisputeDetail>(
      `/admin/finance/disputes/${id}/resolve`,
      { decision, resolution },
    );
    return data;
  },
};
