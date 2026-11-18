import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CampaignCheckoutView,
  ContributionRepositoryPort,
  ContributionView,
  CreateContributionData,
  RewardCheckoutView,
  RewardGuard,
} from '../ports/contribution.repository.port';
import type { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { CreateContributionUseCase } from './create-contribution.use-case';
import { PayContributionUseCase } from './pay-contribution.use-case';

describe('Contribution use cases with rewards', () => {
  const ownerId = '22222222-2222-4222-8222-222222222222';
  const sponsorId = '33333333-3333-4333-8333-333333333333';
  const rewardId = '55555555-5555-4555-8555-555555555555';

  const campaign: CampaignCheckoutView = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Huertos urbanos',
    slug: 'huertos-urbanos',
    coverImageUrl: null,
    ownerUserId: ownerId,
    status: 'published',
    campaignType: 'reward',
    fundingModel: 'flexible',
    currency: 'BOB',
    goalAmount: 20000,
    currentAmount: 0,
    endDate: null,
  };

  let reward: RewardCheckoutView;
  let repository: jest.Mocked<ContributionRepositoryPort>;

  const view = (overrides: Partial<ContributionView> = {}): ContributionView => ({
    id: '66666666-6666-4666-8666-666666666666',
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    campaignCoverUrl: null,
    sponsorUserId: sponsorId,
    sponsorName: 'Ana',
    amount: 5,
    commissionAmount: 0.25,
    netAmount: 4.75,
    currency: 'BOB',
    contributionType: 'reward',
    rewardId,
    rewardTitle: 'Sticker',
    rewardEstimatedDeliveryOn: '2099-01-31',
    supporterMessage: null,
    isAnonymous: false,
    status: 'pending',
    paymentMethod: null,
    gatewayReference: null,
    paidAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    reward = {
      id: rewardId,
      campaignId: campaign.id,
      title: 'Sticker',
      minimumContribution: 5,
      currency: 'BOB',
      quantityTotal: 1,
      quantityClaimed: 0,
      isActive: true,
    };

    repository = {
      findCampaignForCheckout: jest
        .fn<ContributionRepositoryPort['findCampaignForCheckout']>()
        .mockResolvedValue(campaign),
      findRewardForCheckout: jest
        .fn<ContributionRepositoryPort['findRewardForCheckout']>()
        .mockImplementation(async () => reward),
      // Simula al repositorio: ejecuta la guarda con la recompensa "bloqueada".
      create: jest
        .fn<ContributionRepositoryPort['create']>()
        .mockImplementation(async (data: CreateContributionData, guard?: RewardGuard) => {
          guard?.(reward);
          return view({ amount: data.amount, rewardId: data.rewardId });
        }),
      findById: jest.fn<ContributionRepositoryPort['findById']>().mockResolvedValue(view()),
      findByIdForSponsor: jest.fn<ContributionRepositoryPort['findByIdForSponsor']>(),
      listBySponsor: jest.fn<ContributionRepositoryPort['listBySponsor']>(),
      confirmPayment: jest
        .fn<ContributionRepositoryPort['confirmPayment']>()
        .mockResolvedValue(view({ status: 'confirmed' })),
      markFailed: jest
        .fn<ContributionRepositoryPort['markFailed']>()
        .mockResolvedValue(view({ status: 'failed' })),
      cancel: jest.fn<ContributionRepositoryPort['cancel']>(),
      getCampaignSupportSummary: jest.fn<ContributionRepositoryPort['getCampaignSupportSummary']>(),
      getSponsorSummary: jest.fn<ContributionRepositoryPort['getSponsorSummary']>(),
      findOpenDisputeForContribution: jest.fn<ContributionRepositoryPort['findOpenDisputeForContribution']>(),
      createSponsorDispute: jest.fn<ContributionRepositoryPort['createSponsorDispute']>(),
      listDisputesForContribution: jest.fn<ContributionRepositoryPort['listDisputesForContribution']>(),
      listAllOrNothingSettlementCandidates: jest.fn<
        ContributionRepositoryPort['listAllOrNothingSettlementCandidates']
      >(),
      refundAllOrNothingCampaign: jest.fn<ContributionRepositoryPort['refundAllOrNothingCampaign']>(),
    };
  });

  describe('CreateContributionUseCase', () => {
    let useCase: CreateContributionUseCase;

    beforeEach(() => {
      useCase = new CreateContributionUseCase(repository);
    });

    const command = (overrides: Partial<Parameters<CreateContributionUseCase['execute']>[0]> = {}) => ({
      campaignId: campaign.id,
      sponsorUserId: sponsorId,
      amount: 5,
      contributionType: 'reward' as const,
      rewardId,
      ...overrides,
    });

    it('acepta el minimo de la recompensa aunque sea menor a 10 y pasa la guarda', async () => {
      const result = await useCase.execute(command());

      expect(result.rewardId).toBe(rewardId);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ rewardId, amount: 5, currency: 'BOB' }),
        expect.any(Function),
      );
    });

    it('mantiene el minimo de 10 para donaciones sin recompensa', async () => {
      await expect(
        useCase.execute(command({ contributionType: 'donation', rewardId: null, amount: 5 })),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza montos con mas de dos decimales o en notacion exponencial', async () => {
      await expect(useCase.execute(command({ amount: 5.001 }))).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(command({ amount: 1e-7 }))).rejects.toThrow(BadRequestException);
    });

    it('no registra el aporte si la recompensa esta agotada', async () => {
      reward = { ...reward, quantityClaimed: 1 };

      await expect(useCase.execute(command())).rejects.toThrow(ConflictException);
    });

    it('no registra el aporte si la recompensa pertenece a otra campana', async () => {
      reward = { ...reward, campaignId: '44444444-4444-4444-8444-444444444444' };

      await expect(useCase.execute(command())).rejects.toThrow(NotFoundException);
    });

    it('no ejecuta guarda para una donacion', async () => {
      await useCase.execute(command({ contributionType: 'donation', rewardId: null, amount: 10 }));

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ rewardId: null }));
      expect(repository.create.mock.calls[0]).toHaveLength(1);
    });
  });

  describe('PayContributionUseCase', () => {
    let gateway: jest.Mocked<PaymentGatewayPort>;
    let useCase: PayContributionUseCase;

    beforeEach(() => {
      gateway = {
        charge: jest
          .fn<PaymentGatewayPort['charge']>()
          .mockResolvedValue({ approved: true, reference: 'SIM-1' }),
        refund: jest
          .fn<PaymentGatewayPort['refund']>()
          .mockResolvedValue({ refunded: true, reference: 'SIMR-1' }),
      };
      useCase = new PayContributionUseCase(repository, gateway);
    });

    const pay = () =>
      useCase.execute({ contributionId: view().id, sponsorUserId: sponsorId, method: 'qr' });

    it('confirma un aporte con recompensa disponible', async () => {
      const result = await pay();

      expect(result.approved).toBe(true);
      expect(repository.confirmPayment).toHaveBeenCalledWith(view().id, {
        paymentMethod: 'qr',
        gatewayReference: 'SIM-1',
      });
    });

    it('no cobra si la recompensa ya se agoto y deja el aporte rechazado con el motivo', async () => {
      reward = { ...reward, quantityClaimed: 1 };

      const result = await pay();

      expect(result.approved).toBe(false);
      expect(result.declineReason).toMatch(/cupos/);
      expect(gateway.charge).not.toHaveBeenCalled();
      expect(repository.confirmPayment).not.toHaveBeenCalled();
      expect(repository.markFailed).toHaveBeenCalledWith(view().id, expect.stringMatching(/cupos/));
    });

    it('no cobra si la recompensa fue deshabilitada', async () => {
      reward = { ...reward, isActive: false };

      const result = await pay();

      expect(result.approved).toBe(false);
      expect(gateway.charge).not.toHaveBeenCalled();
    });

    it('rechaza pagar un aporte ya procesado', async () => {
      repository.findById.mockResolvedValue(view({ status: 'confirmed' }));

      await expect(pay()).rejects.toThrow(BadRequestException);
      expect(gateway.charge).not.toHaveBeenCalled();
    });

    it('si el ultimo cupo se agota al confirmar, devuelve el cobro y rechaza el aporte', async () => {
      repository.confirmPayment.mockRejectedValue(
        new ConflictException('La recompensa se agoto'),
      );

      const result = await pay();

      expect(result.approved).toBe(false);
      expect(gateway.refund).toHaveBeenCalledWith(
        expect.objectContaining({ contributionId: view().id, reference: 'SIM-1' }),
      );
      expect(repository.markFailed).toHaveBeenCalledWith(view().id, expect.stringMatching(/devolvimos/));
    });

    it('propaga otros errores de la confirmacion sin devolver el cobro', async () => {
      repository.confirmPayment.mockRejectedValue(new BadRequestException('Otro error'));

      await expect(pay()).rejects.toThrow(BadRequestException);
      expect(gateway.refund).not.toHaveBeenCalled();
      expect(repository.markFailed).not.toHaveBeenCalled();
    });
  });
});
