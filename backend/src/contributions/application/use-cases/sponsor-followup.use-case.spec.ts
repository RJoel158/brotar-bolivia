import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type {
  ContributionRepositoryPort,
  ContributionView,
  SponsorDisputeView,
} from '../ports/contribution.repository.port';
import type { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { CreateSponsorDisputeUseCase } from './create-sponsor-dispute.use-case';
import { RefundAllOrNothingCampaignUseCase } from './refund-all-or-nothing-campaign.use-case';

const sponsorId = '33333333-3333-4333-8333-333333333333';
const contributionId = '66666666-6666-4666-8666-666666666666';
const campaignId = '11111111-1111-4111-8111-111111111111';

const view = (overrides: Partial<ContributionView> = {}): ContributionView => ({
  id: contributionId,
  campaignId,
  campaignTitle: 'Huertos urbanos',
  campaignCoverUrl: null,
  sponsorUserId: sponsorId,
  sponsorName: 'Ana',
  amount: 100,
  commissionAmount: 5,
  netAmount: 95,
  currency: 'BOB',
  contributionType: 'donation',
  rewardId: null,
  rewardTitle: null,
  rewardEstimatedDeliveryOn: null,
  supporterMessage: null,
  isAnonymous: false,
  status: 'confirmed',
  paymentMethod: 'qr',
  gatewayReference: 'SIMQ-1',
  paidAt: '2026-01-01T00:00:00.000Z',
  cancelledAt: null,
  failureReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const dispute = (overrides: Partial<SponsorDisputeView> = {}): SponsorDisputeView => ({
  id: '77777777-7777-4777-8777-777777777777',
  code: 'DSP-1234-A',
  contributionId,
  disputeType: 'refund_request',
  description: 'Quiero la devolucion de mi aporte, por favor.',
  status: 'open',
  resolution: null,
  openedAt: '2026-01-02T00:00:00.000Z',
  resolvedAt: null,
  ...overrides,
});

function buildRepository(): jest.Mocked<ContributionRepositoryPort> {
  return {
    findCampaignForCheckout: jest.fn<ContributionRepositoryPort['findCampaignForCheckout']>(),
    findRewardForCheckout: jest.fn<ContributionRepositoryPort['findRewardForCheckout']>(),
    create: jest.fn<ContributionRepositoryPort['create']>(),
    findById: jest.fn<ContributionRepositoryPort['findById']>(),
    findByIdForSponsor: jest
      .fn<ContributionRepositoryPort['findByIdForSponsor']>()
      .mockResolvedValue(view()),
    listBySponsor: jest.fn<ContributionRepositoryPort['listBySponsor']>(),
    confirmPayment: jest.fn<ContributionRepositoryPort['confirmPayment']>(),
    markFailed: jest.fn<ContributionRepositoryPort['markFailed']>(),
    cancel: jest.fn<ContributionRepositoryPort['cancel']>(),
    getCampaignSupportSummary: jest.fn<ContributionRepositoryPort['getCampaignSupportSummary']>(),
    getSponsorSummary: jest.fn<ContributionRepositoryPort['getSponsorSummary']>(),
    findOpenDisputeForContribution: jest
      .fn<ContributionRepositoryPort['findOpenDisputeForContribution']>()
      .mockResolvedValue(null),
    createSponsorDispute: jest
      .fn<ContributionRepositoryPort['createSponsorDispute']>()
      .mockImplementation(async (data) => dispute({ code: data.code, disputeType: data.disputeType })),
    listDisputesForContribution: jest.fn<ContributionRepositoryPort['listDisputesForContribution']>(),
    listAllOrNothingSettlementCandidates: jest.fn<
      ContributionRepositoryPort['listAllOrNothingSettlementCandidates']
    >(),
    refundAllOrNothingCampaign: jest.fn<ContributionRepositoryPort['refundAllOrNothingCampaign']>(),
  };
}

describe('CreateSponsorDisputeUseCase', () => {
  let repository: jest.Mocked<ContributionRepositoryPort>;
  let useCase: CreateSponsorDisputeUseCase;
  const report = (overrides: Partial<Parameters<CreateSponsorDisputeUseCase['execute']>[0]> = {}) =>
    useCase.execute({
      contributionId,
      sponsorUserId: sponsorId,
      disputeType: 'refund_request',
      description: 'Quiero la devolucion de mi aporte, por favor.',
      ...overrides,
    });

  beforeEach(() => {
    repository = buildRepository();
    useCase = new CreateSponsorDisputeUseCase(repository);
  });

  it('abre el caso con prioridad alta para pedidos de devolucion', async () => {
    const result = await report();

    expect(result.code).toMatch(/^DSP-\d{4}-[A-Z]$/);
    expect(repository.createSponsorDispute).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId, contributionId, priority: 'high' }),
    );
  });

  it('no deja reportar un aporte ajeno o inexistente', async () => {
    repository.findByIdForSponsor.mockResolvedValue(null);
    await expect(report()).rejects.toThrow(NotFoundException);
  });

  it('exige una descripcion de al menos 20 caracteres', async () => {
    await expect(report({ description: 'muy corto' })).rejects.toThrow(BadRequestException);
    expect(repository.createSponsorDispute).not.toHaveBeenCalled();
  });

  it('no deja reportar un aporte pendiente de pago', async () => {
    repository.findByIdForSponsor.mockResolvedValue(view({ status: 'pending' }));
    await expect(report()).rejects.toThrow(BadRequestException);
  });

  it('no acepta reclamar una recompensa en una donacion', async () => {
    await expect(report({ disputeType: 'reward_not_received' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('no abre un segundo caso mientras haya uno abierto', async () => {
    repository.findOpenDisputeForContribution.mockResolvedValue(dispute());
    await expect(report()).rejects.toThrow(ConflictException);
    expect(repository.createSponsorDispute).not.toHaveBeenCalled();
  });

  it('reintenta con otro codigo si el generado ya existia', async () => {
    repository.createSponsorDispute
      .mockRejectedValueOnce(new ConflictException('codigo repetido'))
      .mockImplementationOnce(async (data) => dispute({ code: data.code }));

    await report();

    expect(repository.createSponsorDispute).toHaveBeenCalledTimes(2);
  });
});

describe('RefundAllOrNothingCampaignUseCase', () => {
  let repository: jest.Mocked<ContributionRepositoryPort>;
  let gateway: jest.Mocked<PaymentGatewayPort>;
  let useCase: RefundAllOrNothingCampaignUseCase;

  beforeEach(() => {
    repository = buildRepository();
    repository.refundAllOrNothingCampaign.mockResolvedValue({
      campaignId,
      refunded: [
        { id: 'a', amount: 100, currency: 'BOB', gatewayReference: 'SIMC-1' },
        { id: 'b', amount: 50.5, currency: 'BOB', gatewayReference: null },
      ],
      refundedAmount: 150.5,
      expiredPending: 2,
    });
    gateway = {
      charge: jest.fn<PaymentGatewayPort['charge']>(),
      refund: jest
        .fn<PaymentGatewayPort['refund']>()
        .mockImplementation(async (request) => ({ refunded: Boolean(request.reference) })),
    };
    useCase = new RefundAllOrNothingCampaignUseCase(repository, gateway);
  });

  it('devuelve cada aporte en la pasarela y resume la liquidacion', async () => {
    const result = await useCase.execute(campaignId);

    expect(gateway.refund).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      campaignId,
      refundedCount: 2,
      refundedAmount: 150.5,
      expiredPending: 2,
      gatewayFailures: ['b'],
    });
  });

  it('no llama a la pasarela si la liquidacion no corresponde', async () => {
    repository.refundAllOrNothingCampaign.mockRejectedValue(
      new ConflictException('La campana alcanzo su meta'),
    );

    await expect(useCase.execute(campaignId)).rejects.toThrow(ConflictException);
    expect(gateway.refund).not.toHaveBeenCalled();
  });
});
