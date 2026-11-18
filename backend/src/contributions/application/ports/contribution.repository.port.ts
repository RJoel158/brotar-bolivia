export const CONTRIBUTION_REPOSITORY_PORT = Symbol('CONTRIBUTION_REPOSITORY_PORT');

export type ContributionType = 'donation' | 'reward' | 'presale';

export type ContributionStatus =
  | 'pending'
  | 'confirmed'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/** Datos de la campana que el checkout necesita para validar el aporte. */
export interface CampaignCheckoutView {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  ownerUserId: string;
  status: string;
  campaignType: string;
  fundingModel: string;
  currency: string;
  goalAmount: number;
  currentAmount: number;
  endDate: string | null;
}

/** Datos de la recompensa que el checkout necesita para validar el aporte. */
export interface RewardCheckoutView {
  id: string;
  campaignId: string;
  title: string;
  minimumContribution: number;
  currency: string;
  /** `null` = ilimitada. */
  quantityTotal: number | null;
  /** Aportes confirmados que ya adjudicaron la recompensa. */
  quantityClaimed: number;
  isActive: boolean;
}

/**
 * Validacion de la recompensa que el repositorio ejecuta con la fila bloqueada,
 * para que una edicion simultanea no cambie los datos ya validados.
 */
export type RewardGuard = (reward: RewardCheckoutView | null) => void;

export interface CreateContributionData {
  campaignId: string;
  sponsorUserId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  contributionType: ContributionType;
  rewardId: string | null;
  supporterMessage: string | null;
  isAnonymous: boolean;
}

export interface ContributionView {
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

export interface ConfirmPaymentData {
  paymentMethod: string;
  gatewayReference: string;
}

/** Totales publicos de apoyo a una campana. */
export interface CampaignSupportSummary {
  campaignId: string;
  supportersCount: number;
  confirmedAmount: number;
  currency: string;
  /** Cupos adjudicados por recompensa (aportes confirmados): { rewardId: cantidad }. */
  claimedByReward: Record<string, number>;
}

export interface MyContributionFilters {
  status?: ContributionStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedContributions {
  items: ContributionView[];
  total: number;
  page: number;
  limit: number;
}

/** Tipos de problema que un patrocinador puede reportar sobre su aporte. */
export type SponsorDisputeType =
  | 'payment_not_recognized'
  | 'reward_not_received'
  | 'project_not_executed'
  | 'refund_request'
  | 'other';

export interface CreateSponsorDisputeData {
  code: string;
  campaignId: string;
  contributionId: string;
  reporterUserId: string;
  disputeType: SponsorDisputeType;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

/** Caso de disputa visto por el patrocinador que lo abrio. */
export interface SponsorDisputeView {
  id: string;
  code: string;
  contributionId: string | null;
  disputeType: string;
  description: string;
  status: string;
  resolution: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

/** Totales del panel del patrocinador, calculados en la base (no en una pagina). */
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

/** Campana todo-o-nada vencida que no alcanzo su meta y aun tiene aportes por liquidar. */
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

export interface RefundedContribution {
  id: string;
  amount: number;
  currency: string;
  gatewayReference: string | null;
}

export interface SettlementResult {
  campaignId: string;
  refunded: RefundedContribution[];
  refundedAmount: number;
  expiredPending: number;
}

export interface ContributionRepositoryPort {
  findCampaignForCheckout(campaignId: string): Promise<CampaignCheckoutView | null>;
  findRewardForCheckout(rewardId: string): Promise<RewardCheckoutView | null>;
  /** Con `rewardGuard`, valida e inserta en una transaccion que retiene la fila de la recompensa. */
  create(data: CreateContributionData, rewardGuard?: RewardGuard): Promise<ContributionView>;
  findById(id: string): Promise<ContributionView | null>;
  findByIdForSponsor(id: string, sponsorUserId: string): Promise<ContributionView | null>;
  listBySponsor(
    sponsorUserId: string,
    filters: MyContributionFilters,
  ): Promise<PaginatedContributions>;
  /**
   * En una sola transaccion: pasa el aporte de pending a confirmed, adjudica el
   * cupo de la recompensa si tiene una y suma el monto bruto a la campana.
   * Solo una confirmacion puede ganar: repetirla no vuelve a sumar ni a
   * adjudicar. Si la recompensa ya no tiene cupo, no se aplica nada.
   */
  confirmPayment(id: string, data: ConfirmPaymentData): Promise<ContributionView>;
  /** Solo afecta aportes todavia pendientes. */
  markFailed(id: string, reason: string): Promise<ContributionView>;
  /** Solo afecta aportes todavia pendientes. */
  cancel(id: string): Promise<ContributionView>;
  getCampaignSupportSummary(campaignId: string): Promise<CampaignSupportSummary>;

  // ------------------------------------------------ Panel del patrocinador
  getSponsorSummary(sponsorUserId: string): Promise<SponsorSummary>;

  // ---------------------------------------------- Disputas del patrocinador
  /** Disputa todavia abierta (open o in_review) sobre el aporte, si existe. */
  findOpenDisputeForContribution(contributionId: string): Promise<SponsorDisputeView | null>;
  /** Crea el caso y su primer mensaje; falla con ConflictException si el codigo ya existe. */
  createSponsorDispute(data: CreateSponsorDisputeData): Promise<SponsorDisputeView>;
  listDisputesForContribution(
    contributionId: string,
    reporterUserId: string,
  ): Promise<SponsorDisputeView[]>;

  // --------------------------------------- Liquidacion de campanas todo-o-nada
  listAllOrNothingSettlementCandidates(): Promise<SettlementCandidate[]>;
  /**
   * En una transaccion: vence los aportes pendientes, pasa los confirmados a
   * reembolsados, libera sus cupos y descuenta el monto de la campana. Vuelve a
   * comprobar que la campana siga siendo candidata con la fila bloqueada.
   */
  refundAllOrNothingCampaign(campaignId: string): Promise<SettlementResult>;
}
