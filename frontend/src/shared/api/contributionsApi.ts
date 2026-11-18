import { apiClient } from './apiClient.ts';

/** Aportes del patrocinador: checkout, pago simulado y "mis aportes". */

export type ContributionType = 'donation' | 'reward' | 'presale';

export type ContributionStatus =
  | 'pending'
  | 'confirmed'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 'card' | 'qr' | 'transfer';

export interface Contribution {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverUrl: string | null;
  sponsorUserId: string;
  sponsorName: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  contributionType: ContributionType;
  rewardId: string | null;
  rewardTitle: string | null;
  /** YYYY-MM-DD. */
  rewardEstimatedDeliveryOn: string | null;
  supporterMessage: string | null;
  isAnonymous: boolean;
  status: ContributionStatus;
  paymentMethod: string | null;
  gatewayReference: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PaginatedContributions {
  items: Contribution[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignSupportSummary {
  campaignId: string;
  supportersCount: number;
  confirmedAmount: number;
  currency: string;
  /** Cupos adjudicados por recompensa (solo aportes confirmados). */
  claimedByReward: Record<string, number>;
}

export interface CreateContributionRequest {
  campaignId: string;
  amount: number;
  contributionType: ContributionType;
  rewardId?: string;
  supporterMessage?: string;
  isAnonymous?: boolean;
}

export interface PaymentCard {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}

export interface PayContributionResult {
  approved: boolean;
  declineReason?: string;
  contribution: Contribution;
}

/** Tipos de problema que el patrocinador puede reportar. */
export type SponsorDisputeType =
  | 'payment_not_recognized'
  | 'reward_not_received'
  | 'project_not_executed'
  | 'refund_request'
  | 'other';

export interface SponsorDispute {
  id: string;
  code: string;
  contributionId: string | null;
  disputeType: SponsorDisputeType | string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected' | string;
  resolution: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

/** Metricas del panel del patrocinador, calculadas sobre todos sus aportes. */
export interface SponsorSummary {
  confirmedAmount: number;
  confirmedCount: number;
  supportedCampaigns: number;
  pendingCount: number;
  refundedAmount: number;
  refundedCount: number;
  openDisputes: number;
  currency: string;
}

/** Campana todo-o-nada vencida sin meta, con aportes por devolver (admin). */
export interface SettlementCandidate {
  campaignId: string;
  title: string;
  goalAmount: number;
  confirmedAmount: number;
  currency: string;
  /** YYYY-MM-DD. */
  endDate: string;
  confirmedCount: number;
  pendingCount: number;
}

export interface RefundSettlementResult {
  campaignId: string;
  refundedCount: number;
  refundedAmount: number;
  expiredPending: number;
  gatewayFailures: string[];
}

export const contributionsApi = {
  async create(payload: CreateContributionRequest): Promise<Contribution> {
    const { data } = await apiClient.post<Contribution>('/contributions', payload);
    return data;
  },

  async pay(
    id: string,
    method: PaymentMethod,
    card?: PaymentCard,
  ): Promise<PayContributionResult> {
    const { data } = await apiClient.post<PayContributionResult>(`/contributions/${id}/pay`, {
      method,
      card,
    });
    return data;
  },

  async cancel(id: string): Promise<Contribution> {
    const { data } = await apiClient.patch<Contribution>(`/contributions/${id}/cancel`);
    return data;
  },

  async listMine(params: {
    status?: ContributionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedContributions> {
    const { data } = await apiClient.get<PaginatedContributions>('/contributions/me', { params });
    return data;
  },

  async getById(id: string): Promise<Contribution> {
    const { data } = await apiClient.get<Contribution>(`/contributions/${id}`);
    return data;
  },

  async getMySummary(): Promise<SponsorSummary> {
    const { data } = await apiClient.get<SponsorSummary>('/contributions/me/summary');
    return data;
  },

  async reportProblem(
    id: string,
    payload: { disputeType: SponsorDisputeType; description: string },
  ): Promise<SponsorDispute> {
    const { data } = await apiClient.post<SponsorDispute>(`/contributions/${id}/disputes`, payload);
    return data;
  },

  async listDisputes(id: string): Promise<SponsorDispute[]> {
    const { data } = await apiClient.get<SponsorDispute[]>(`/contributions/${id}/disputes`);
    return data;
  },

  /** Admin: campanas todo-o-nada vencidas que no alcanzaron su meta. */
  async listSettlementCandidates(): Promise<SettlementCandidate[]> {
    const { data } = await apiClient.get<SettlementCandidate[]>('/admin/settlements/all-or-nothing');
    return data;
  },

  /** Admin: simula la devolucion de los aportes de una campana todo-o-nada. */
  async refundCampaign(campaignId: string): Promise<RefundSettlementResult> {
    const { data } = await apiClient.post<RefundSettlementResult>(
      `/admin/settlements/all-or-nothing/${campaignId}/refund`,
    );
    return data;
  },

  async getCampaignSummary(campaignId: string): Promise<CampaignSupportSummary> {
    const { data } = await apiClient.get<CampaignSupportSummary>(
      `/contributions/campaign/${campaignId}/summary`,
    );
    return data;
  },
};
