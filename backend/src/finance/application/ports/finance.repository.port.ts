export const FINANCE_REPOSITORY_PORT = Symbol('FINANCE_REPOSITORY_PORT');

/**
 * El modulo de finanzas es de solo lectura agregada en su mayor parte (paneles
 * con totales y listados), asi que el puerto expone modelos de lectura ya
 * formados en vez de entidades de dominio. Las acciones que si mutan estado
 * (conciliar, aprobar desembolso, resolver disputa) viven en metodos aparte.
 */

export interface FinanceSummaryView {
  grossCollected: number;
  platformCommission: number;
  pendingDisbursement: number;
  campaignsAwaitingDisbursement: number;
  growthVsPreviousMonth: number | null;
  currency: string;
}

export interface PaymentView {
  id: string;
  campaignId: string;
  campaignTitle: string;
  sponsorName: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  /** Detalle del pago (QA finanzas): lo mismo que se exporta al CSV. */
  commissionAmount: number;
  netAmount: number;
  contributionType: string;
  paymentMethod: string | null;
  gatewayReference: string | null;
  rewardTitle: string | null;
  failureReason: string | null;
}

export interface PaginatedView<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ReconciliationSummaryView {
  collectedToday: number;
  transactionsToday: number;
  successfulToday: number;
  openDiscrepancies: number;
  reconciliationRate: number;
  lastCutAt: string | null;
  currency: string;
}

export interface DiscrepancyView {
  id: string;
  gatewayReference: string;
  discrepancyType: string;
  internalAmount: number | null;
  gatewayAmount: number | null;
  currency: string;
  status: string;
  detectedAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface DisbursementSummaryView {
  totalPending: number;
  pendingCount: number;
  completedAmount: number;
  failedOrRejectedCount: number;
  guaranteeFund: number;
  currency: string;
}

export interface DisbursementView {
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
  status: string;
  createdAt: string;
}

export interface DisputeSummaryView {
  active: number;
  inReview: number;
  resolvedThisMonth: number;
  averageResponseHours: number | null;
}

export interface DisputeView {
  id: string;
  code: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverUrl: string | null;
  creatorName: string;
  reporterName: string;
  contributionAmount: number | null;
  currency: string;
  disputeType: string;
  status: string;
  priority: string;
  openedAt: string;
}

export interface DisputeMessageView {
  id: string;
  authorName: string;
  isSystem: boolean;
  body: string;
  createdAt: string;
}

export interface DisputeDetailView extends DisputeView {
  description: string;
  resolution: string | null;
  linkedOperation: string | null;
  messages: DisputeMessageView[];
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface DisputeFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface DisbursementFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FinanceRepositoryPort {
  getFinanceSummary(): Promise<FinanceSummaryView>;
  listPayments(filters: PaymentFilters): Promise<PaginatedView<PaymentView>>;

  getReconciliationSummary(): Promise<ReconciliationSummaryView>;
  listDiscrepancies(status?: string): Promise<DiscrepancyView[]>;
  resolveDiscrepancy(id: string, adminUserId: string, note?: string): Promise<DiscrepancyView>;

  getDisbursementSummary(): Promise<DisbursementSummaryView>;
  listDisbursements(filters: DisbursementFilters): Promise<PaginatedView<DisbursementView>>;
  reviewDisbursement(
    id: string,
    adminUserId: string,
    decision: 'approved' | 'rejected' | 'completed',
    reason?: string,
  ): Promise<DisbursementView>;

  getDisputeSummary(): Promise<DisputeSummaryView>;
  listDisputes(filters: DisputeFilters): Promise<PaginatedView<DisputeView>>;
  findDisputeById(id: string): Promise<DisputeDetailView | null>;
  addDisputeMessage(id: string, authorUserId: string, body: string): Promise<DisputeMessageView>;
  resolveDispute(
    id: string,
    adminUserId: string,
    decision: 'resolved' | 'in_review',
    resolution?: string,
  ): Promise<DisputeDetailView>;
}
