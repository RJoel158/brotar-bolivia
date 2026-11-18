import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CampaignCheckoutView,
  RewardCheckoutView,
} from '../application/ports/contribution.repository.port';
import { ContributionValidationRules, isRewardSoldOut } from './contribution-validation.rules';

describe('ContributionValidationRules', () => {
  const campaign: CampaignCheckoutView = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Huertos urbanos',
    slug: 'huertos-urbanos',
    coverImageUrl: null,
    ownerUserId: '22222222-2222-4222-8222-222222222222',
    status: 'published',
    campaignType: 'reward',
    fundingModel: 'flexible',
    currency: 'BOB',
    goalAmount: 20000,
    currentAmount: 0,
    endDate: null,
  };

  const reward = (overrides: Partial<RewardCheckoutView> = {}): RewardCheckoutView => ({
    id: '55555555-5555-4555-8555-555555555555',
    campaignId: campaign.id,
    title: 'Sticker',
    minimumContribution: 5,
    currency: 'BOB',
    quantityTotal: 10,
    quantityClaimed: 0,
    isActive: true,
    ...overrides,
  });

  describe('validateAmountFormat', () => {
    it.each([19.99, 0.01, 10, 1_000_000])('acepta %p', (amount) => {
      expect(() => ContributionValidationRules.validateAmountFormat(amount)).not.toThrow();
    });

    it.each([0, -1, 1e-7, 10.001, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000.01])(
      'rechaza %p',
      (amount) => {
        expect(() => ContributionValidationRules.validateAmountFormat(amount)).toThrow(
          BadRequestException,
        );
      },
    );
  });

  it('mantiene el minimo de plataforma para aportes sin recompensa', () => {
    expect(() => ContributionValidationRules.validatePlatformMinimum(9.99)).toThrow(
      BadRequestException,
    );
    expect(() => ContributionValidationRules.validatePlatformMinimum(10)).not.toThrow();
  });

  describe('validateTypeMatchesCampaign', () => {
    it('exige recompensa en un aporte de recompensa', () => {
      expect(() =>
        ContributionValidationRules.validateTypeMatchesCampaign('reward', campaign, null),
      ).toThrow(BadRequestException);
    });

    it('rechaza una recompensa en una donacion', () => {
      expect(() =>
        ContributionValidationRules.validateTypeMatchesCampaign('donation', campaign, reward().id),
      ).toThrow(BadRequestException);
    });

    it('acepta una donacion simple en una campana de recompensas', () => {
      expect(() =>
        ContributionValidationRules.validateTypeMatchesCampaign('donation', campaign, null),
      ).not.toThrow();
    });
  });

  describe('validateReward', () => {
    it('acepta el minimo de la recompensa aunque sea menor a 10', () => {
      expect(() => ContributionValidationRules.validateReward(reward(), campaign, 5)).not.toThrow();
    });

    it('rechaza montos bajo el minimo de la recompensa', () => {
      expect(() =>
        ContributionValidationRules.validateReward(reward({ minimumContribution: 80 }), campaign, 79.99),
      ).toThrow(BadRequestException);
    });

    it('rechaza una recompensa inexistente o de otra campana', () => {
      expect(() => ContributionValidationRules.validateReward(null, campaign, 50)).toThrow(
        NotFoundException,
      );
      expect(() =>
        ContributionValidationRules.validateReward(
          reward({ campaignId: '44444444-4444-4444-8444-444444444444' }),
          campaign,
          50,
        ),
      ).toThrow(NotFoundException);
    });

    it('rechaza una recompensa deshabilitada o de otra moneda', () => {
      expect(() =>
        ContributionValidationRules.validateReward(reward({ isActive: false }), campaign, 50),
      ).toThrow(BadRequestException);
      expect(() =>
        ContributionValidationRules.validateReward(reward({ currency: 'USD' }), campaign, 50),
      ).toThrow(BadRequestException);
    });

    it('rechaza una recompensa agotada con conflicto', () => {
      expect(() =>
        ContributionValidationRules.validateReward(
          reward({ quantityTotal: 3, quantityClaimed: 3 }),
          campaign,
          50,
        ),
      ).toThrow(ConflictException);
    });
  });

  it('isRewardSoldOut trata quantityTotal null como ilimitada', () => {
    expect(isRewardSoldOut(reward({ quantityTotal: null, quantityClaimed: 999 }))).toBe(false);
    expect(isRewardSoldOut(reward({ quantityTotal: 2, quantityClaimed: 1 }))).toBe(false);
    expect(isRewardSoldOut(reward({ quantityTotal: 2, quantityClaimed: 2 }))).toBe(true);
  });
});
