import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignReward } from '../../domain/entities/campaign-reward.entity';
import { CampaignRewardInUseError } from '../../domain/errors/campaign-reward-in-use.error';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CampaignRewardRepositoryPort } from '../ports/campaign-reward.repository.port';
import type { CreateCampaignRewardDto } from '../dto/campaign-reward.dto';
import { CreateCampaignRewardUseCase } from './create-campaign-reward.use-case';
import { UpdateCampaignRewardUseCase } from './update-campaign-reward.use-case';
import { DeleteCampaignRewardUseCase } from './delete-campaign-reward.use-case';
import { ListCampaignRewardsUseCase } from './list-campaign-rewards.use-case';
import { UpdateCampaignUseCase } from './update-campaign.use-case';
import { SubmitCampaignForReviewUseCase } from './submit-campaign-for-review.use-case';
import { SetCampaignRewardActiveUseCase } from './set-campaign-reward-active.use-case';

describe('Campaign reward use cases', () => {
  const ownerId = '22222222-2222-4222-8222-222222222222';
  const otherUserId = '33333333-3333-4333-8333-333333333333';
  const otherCampaignId = '44444444-4444-4444-8444-444444444444';

  let campaign: Campaign;
  let campaignRepository: jest.Mocked<CampaignRepositoryPort>;
  let rewardRepository: jest.Mocked<CampaignRewardRepositoryPort>;

  const buildCampaign = (campaignType = 'reward'): Campaign =>
    Campaign.create({
      title: 'Huertos urbanos comunitarios',
      category: 'ambiental',
      campaignType,
      fundingModel: 'flexible',
      goalAmount: 20000,
      ownerUserId: ownerId,
      location: 'La Paz',
      shortSummary: 'Huertos comunitarios en barrios periurbanos de La Paz.',
    });

  const accessOf = (target: Campaign): CampaignAccess =>
    CampaignAccess.reconstitute({
      id: target.getId(),
      ownerUserId: target.getOwnerUserId(),
      status: target.getStatus(),
      campaignType: target.getCampaignType(),
      currency: target.getCurrency(),
      goalAmount: target.getGoalAmount(),
    });

  const expectNoFullCampaignRead = (): void => {
    expect(campaignRepository.findById).not.toHaveBeenCalled();
  };

  const storedReward = (
    overrides: Partial<{
      campaignId: string;
      estimatedDeliveryOn: string;
      isActive: boolean;
      quantityTotal: number | null;
      quantityClaimed: number;
    }> = {},
  ) =>
    CampaignReward.reconstitute({
      id: '55555555-5555-4555-8555-555555555555',
      campaignId: overrides.campaignId ?? campaign.getId(),
      title: 'Canasta de verduras',
      description: 'Canasta mensual con productos del huerto.',
      minimumContribution: 80,
      currency: 'BOB',
      quantityTotal: overrides.quantityTotal === undefined ? 20 : overrides.quantityTotal,
      quantityClaimed: overrides.quantityClaimed ?? 0,
      isActive: overrides.isActive ?? true,
      estimatedDeliveryOn: overrides.estimatedDeliveryOn ?? '2099-06-30',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  const createDto = (overrides: Partial<CreateCampaignRewardDto> = {}): CreateCampaignRewardDto => ({
    campaignId: campaign.getId(),
    authenticatedUserId: ownerId,
    title: 'Kit de semillas',
    description: 'Semillas nativas para iniciar un huerto en casa.',
    minimumContribution: 50,
    quantityTotal: 100,
    estimatedDeliveryOn: '2099-12-31',
    ...overrides,
  });

  const publish = (target: Campaign): void => {
    target.submitForReview();
    target.approve();
    target.publish();
  };

  beforeEach(() => {
    campaign = buildCampaign();

    campaignRepository = {
      save: jest.fn(),
      findById: jest.fn<() => Promise<Campaign | null>>().mockImplementation(async () => campaign),
      findAccessById: jest
        .fn<() => Promise<CampaignAccess | null>>()
        .mockImplementation(async () => accessOf(campaign)),
      findAll: jest.fn(),
      findByOwnerUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    rewardRepository = {
      save: jest
        .fn<(reward: CampaignReward) => Promise<CampaignReward>>()
        .mockImplementation(async (reward) => reward),
      update: jest
        .fn<(reward: CampaignReward) => Promise<CampaignReward>>()
        .mockImplementation(async (reward) => reward),
      setActive: jest
        .fn<(reward: CampaignReward) => Promise<CampaignReward>>()
        .mockImplementation(async (reward) => reward),
      findById: jest.fn<(id: string) => Promise<CampaignReward | null>>().mockResolvedValue(null),
      findByCampaignId: jest
        .fn<(campaignId: string) => Promise<CampaignReward[]>>()
        .mockResolvedValue([]),
      delete: jest.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
    };
  });

  describe('CreateCampaignRewardUseCase', () => {
    let useCase: CreateCampaignRewardUseCase;

    beforeEach(() => {
      useCase = new CreateCampaignRewardUseCase(campaignRepository, rewardRepository);
    });

    afterEach(expectNoFullCampaignRead);

    it('creates a reward with a server-generated id and the campaign currency', async () => {
      const result = await useCase.execute(createDto());

      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.campaignId).toBe(campaign.getId());
      expect(result.title).toBe('Kit de semillas');
      expect(result.quantityTotal).toBe(100);
      expect(result.estimatedDeliveryOn).toBe('2099-12-31');
      expect(result.currency).toBe('BOB');
      expect(result.quantityClaimed).toBe(0);
      expect(result.quantityRemaining).toBe(100);
      expect(result.isSoldOut).toBe(false);
      expect(rewardRepository.save).toHaveBeenCalledTimes(1);
    });

    it('creates a reward with unlimited availability', async () => {
      const result = await useCase.execute(createDto({ quantityTotal: null }));
      expect(result.quantityTotal).toBeNull();
      expect(result.quantityRemaining).toBeNull();
    });

    it('accepts a minimum contribution below the donation minimum', async () => {
      const result = await useCase.execute(createDto({ minimumContribution: 5 }));
      expect(result.minimumContribution).toBe(5);
    });

    it('keeps a client id and returns the stored reward when the same create is retried', async () => {
      const id = '66666666-6666-4666-8666-666666666666';
      const first = await useCase.execute(createDto({ id }));
      expect(first.id).toBe(id);

      rewardRepository.findById.mockResolvedValue(storedReward());
      const retried = await useCase.execute(createDto({ id: '55555555-5555-4555-8555-555555555555' }));

      expect(retried.id).toBe('55555555-5555-4555-8555-555555555555');
      expect(rewardRepository.save).toHaveBeenCalledTimes(1);
    });

    it('throws Conflict when a client id belongs to a reward of another campaign', async () => {
      rewardRepository.findById.mockResolvedValue(storedReward({ campaignId: otherCampaignId }));
      await expect(
        useCase.execute(createDto({ id: '55555555-5555-4555-8555-555555555555' })),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(rewardRepository.save).not.toHaveBeenCalled();
    });

    it('throws Conflict after the campaign is published', async () => {
      publish(campaign);
      await expect(useCase.execute(createDto())).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound when the campaign does not exist', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      await expect(useCase.execute(createDto())).rejects.toBeInstanceOf(NotFoundException);
      expect(rewardRepository.save).not.toHaveBeenCalled();
    });

    it('throws Forbidden when the user is not the campaign owner', async () => {
      await expect(
        useCase.execute(createDto({ authenticatedUserId: otherUserId })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(rewardRepository.save).not.toHaveBeenCalled();
    });

    it('throws Conflict when the campaign is not editable', async () => {
      campaign.submitForReview();
      await expect(useCase.execute(createDto())).rejects.toBeInstanceOf(ConflictException);
      expect(rewardRepository.save).not.toHaveBeenCalled();
    });

    it('throws Conflict when the campaign type is not reward', async () => {
      campaign = buildCampaign('donation');
      await expect(useCase.execute(createDto())).rejects.toThrow(
        'Solo las campañas de tipo recompensa pueden tener recompensas.',
      );
      await expect(useCase.execute(createDto())).rejects.toBeInstanceOf(ConflictException);
    });

    it.each([
      ['empty description', { description: '   ' }],
      ['zero amount', { minimumContribution: 0 }],
      ['amount with 3 decimals', { minimumContribution: 9.999 }],
      ['zero quantity', { quantityTotal: 0 }],
      ['decimal quantity', { quantityTotal: 1.5 }],
      ['invalid date', { estimatedDeliveryOn: '2099-02-30' }],
      ['past date', { estimatedDeliveryOn: '2000-01-01' }],
    ])('throws BadRequest for %s', async (_label, override) => {
      await expect(useCase.execute(createDto(override))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(rewardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('UpdateCampaignRewardUseCase', () => {
    let useCase: UpdateCampaignRewardUseCase;
    let reward: CampaignReward;

    beforeEach(() => {
      useCase = new UpdateCampaignRewardUseCase(campaignRepository, rewardRepository);
      reward = storedReward();
      rewardRepository.findById.mockResolvedValue(reward);
    });

    afterEach(expectNoFullCampaignRead);

    const command = (changes: object, authenticatedUserId = ownerId) => ({
      campaignId: campaign.getId(),
      rewardId: reward.getId(),
      authenticatedUserId,
      changes,
    });

    it('updates only the provided fields and keeps the id', async () => {
      const result = await useCase.execute(command({ title: 'Canasta grande', quantityTotal: null }));

      expect(result.id).toBe('55555555-5555-4555-8555-555555555555');
      expect(result.title).toBe('Canasta grande');
      expect(result.quantityTotal).toBeNull();
      expect(result.minimumContribution).toBe(80);
      expect(result.estimatedDeliveryOn).toBe('2099-06-30');
      expect(rewardRepository.update).toHaveBeenCalledTimes(1);
      expect(rewardRepository.save).not.toHaveBeenCalled();
    });

    it('allows editing a reward whose stored delivery date is already in the past', async () => {
      reward = storedReward({ estimatedDeliveryOn: '2020-01-15' });
      rewardRepository.findById.mockResolvedValue(reward);

      const result = await useCase.execute(
        command({ title: 'Título corregido', estimatedDeliveryOn: '2020-01-15' }),
      );

      expect(result.estimatedDeliveryOn).toBe('2020-01-15');
    });

    it('throws BadRequest when the delivery date changes to a past date', async () => {
      await expect(
        useCase.execute(command({ estimatedDeliveryOn: '2000-01-01' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(rewardRepository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequest for invalid amounts', async () => {
      await expect(
        useCase.execute(command({ minimumContribution: -5 })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when the campaign does not exist', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      await expect(useCase.execute(command({ title: 'X' }))).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Forbidden when the user is not the campaign owner', async () => {
      await expect(
        useCase.execute(command({ title: 'Intento ajeno' }, otherUserId)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(reward.getTitle()).toBe('Canasta de verduras');
    });

    it('throws Conflict when the campaign is not editable', async () => {
      campaign.submitForReview();
      await expect(useCase.execute(command({ title: 'No editable' }))).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws Conflict when the campaign type is not reward', async () => {
      campaign = buildCampaign('donation');
      await expect(useCase.execute(command({ title: 'Otro tipo' }))).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws NotFound when the reward belongs to another campaign', async () => {
      rewardRepository.findById.mockResolvedValue(storedReward({ campaignId: otherCampaignId }));
      await expect(useCase.execute(command({ title: 'Ajena' }))).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(rewardRepository.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when the reward does not exist', async () => {
      rewardRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute(command({ title: 'Inexistente' }))).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Conflict when the reward already has contributions', async () => {
      rewardRepository.update.mockRejectedValue(new CampaignRewardInUseError());
      await expect(useCase.execute(command({ title: 'Con aportes' }))).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('DeleteCampaignRewardUseCase', () => {
    let useCase: DeleteCampaignRewardUseCase;

    beforeEach(() => {
      useCase = new DeleteCampaignRewardUseCase(campaignRepository, rewardRepository);
      rewardRepository.findById.mockResolvedValue(storedReward());
    });

    afterEach(expectNoFullCampaignRead);

    const command = (authenticatedUserId = ownerId) => ({
      campaignId: campaign.getId(),
      rewardId: '55555555-5555-4555-8555-555555555555',
      authenticatedUserId,
    });

    it('removes a reward of an editable campaign owned by the user', async () => {
      await useCase.execute(command());
      expect(rewardRepository.delete).toHaveBeenCalledWith('55555555-5555-4555-8555-555555555555');
    });

    it('removes rewards of a campaign that is no longer of type reward', async () => {
      campaign.updateDetails({ campaignType: 'donation' });
      await useCase.execute(command());
      expect(rewardRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('throws Conflict when the reward already has contributions', async () => {
      rewardRepository.delete.mockRejectedValue(new CampaignRewardInUseError());
      await expect(useCase.execute(command())).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound when the campaign does not exist', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      await expect(useCase.execute(command())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when the user is not the campaign owner', async () => {
      await expect(useCase.execute(command(otherUserId))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(rewardRepository.delete).not.toHaveBeenCalled();
    });

    it('throws Conflict when the campaign is not editable', async () => {
      campaign.submitForReview();
      await expect(useCase.execute(command())).rejects.toBeInstanceOf(ConflictException);
      expect(rewardRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFound when the reward belongs to another campaign', async () => {
      rewardRepository.findById.mockResolvedValue(storedReward({ campaignId: otherCampaignId }));
      await expect(useCase.execute(command())).rejects.toBeInstanceOf(NotFoundException);
      expect(rewardRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('ListCampaignRewardsUseCase', () => {
    let useCase: ListCampaignRewardsUseCase;

    beforeEach(() => {
      useCase = new ListCampaignRewardsUseCase(campaignRepository, rewardRepository);
    });

    afterEach(expectNoFullCampaignRead);

    it('lists rewards of a published campaign for anonymous visitors, including past-dated ones', async () => {
      publish(campaign);
      rewardRepository.findByCampaignId.mockResolvedValue([
        storedReward({ estimatedDeliveryOn: '2020-03-01' }),
      ]);

      const result = await useCase.execute({ campaignId: campaign.getId(), viewer: null });

      expect(result).toHaveLength(1);
      expect(result[0].estimatedDeliveryOn).toBe('2020-03-01');
      expect(result[0].currency).toBe('BOB');
    });

    it('throws Forbidden for anonymous visitors of an unpublished campaign', async () => {
      await expect(
        useCase.execute({ campaignId: campaign.getId(), viewer: null }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Forbidden for other creators of an unpublished campaign', async () => {
      await expect(
        useCase.execute({ campaignId: campaign.getId(), viewer: { id: otherUserId, role: 'creator' } }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets the owner and admins read rewards of an unpublished campaign', async () => {
      rewardRepository.findByCampaignId.mockResolvedValue([storedReward()]);

      await expect(
        useCase.execute({ campaignId: campaign.getId(), viewer: { id: ownerId, role: 'creator' } }),
      ).resolves.toHaveLength(1);
      await expect(
        useCase.execute({ campaignId: campaign.getId(), viewer: { id: otherUserId, role: 'admin' } }),
      ).resolves.toHaveLength(1);
    });

    it('throws NotFound when the campaign does not exist', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      await expect(
        useCase.execute({ campaignId: 'missing', viewer: null }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('campaign type and currency changes', () => {
    let useCase: UpdateCampaignUseCase;

    beforeEach(() => {
      campaignRepository.update.mockImplementation(async (target: Campaign) => target);
      useCase = new UpdateCampaignUseCase(campaignRepository, rewardRepository);
    });

    const change = (changes: object) =>
      useCase.execute({ campaignId: campaign.getId(), authenticatedUserId: ownerId, changes });

    it('blocks changing the type while the campaign has rewards, without deleting them', async () => {
      rewardRepository.findByCampaignId.mockResolvedValue([storedReward()]);

      await expect(change({ campaignType: 'donation' })).rejects.toBeInstanceOf(ConflictException);
      expect(campaignRepository.update).not.toHaveBeenCalled();
      expect(rewardRepository.delete).not.toHaveBeenCalled();
      expect(campaign.getCampaignType()).toBe('reward');
    });

    it('blocks changing the currency while the campaign has rewards', async () => {
      rewardRepository.findByCampaignId.mockResolvedValue([storedReward()]);
      await expect(change({ currency: 'USD' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows changing the type once the campaign has no rewards', async () => {
      const result = await change({ campaignType: 'donation' });
      expect(result.campaignType).toBe('donation');
    });

    it('does not read rewards when neither type nor currency changes', async () => {
      await change({ title: 'Huertos urbanos renovados', campaignType: 'reward' });
      expect(rewardRepository.findByCampaignId).not.toHaveBeenCalled();
    });
  });

  describe('submit for review of reward campaigns', () => {
    let useCase: SubmitCampaignForReviewUseCase;

    beforeEach(() => {
      campaignRepository.update.mockImplementation(async (target: Campaign) => target);
      useCase = new SubmitCampaignForReviewUseCase(campaignRepository, rewardRepository, { findById: jest.fn().mockResolvedValue({ isActive: () => true, isVerified: () => true }) } as never);
    });

    it('rejects a reward campaign without saved rewards', async () => {
      await expect(useCase.execute(campaign.getId(), ownerId)).rejects.toThrow(
        'Una campaña de recompensas necesita al menos una recompensa válida guardada para enviarse a revisión.',
      );
      expect(campaignRepository.update).not.toHaveBeenCalled();
    });

    it('rejects a reward campaign whose only reward is inactive', async () => {
      rewardRepository.findByCampaignId.mockResolvedValue([storedReward({ isActive: false })]);
      await expect(useCase.execute(campaign.getId(), ownerId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('submits a reward campaign with at least one valid saved reward', async () => {
      rewardRepository.findByCampaignId.mockResolvedValue([storedReward()]);
      const result = await useCase.execute(campaign.getId(), ownerId);
      expect(result.status).toBe('pending_review');
    });

    it('does not require rewards for donation campaigns', async () => {
      campaign = buildCampaign('donation');
      const result = await useCase.execute(campaign.getId(), ownerId);
      expect(result.status).toBe('pending_review');
      expect(rewardRepository.findByCampaignId).not.toHaveBeenCalled();
    });
  });

  describe('SetCampaignRewardActiveUseCase', () => {
    let useCase: SetCampaignRewardActiveUseCase;
    const rewardId = '55555555-5555-4555-8555-555555555555';

    beforeEach(() => {
      useCase = new SetCampaignRewardActiveUseCase(campaignRepository, rewardRepository);
    });

    afterEach(expectNoFullCampaignRead);

    it('lets the owner deactivate a reward without changing claimed slots', async () => {
      rewardRepository.findById.mockResolvedValue(storedReward({ quantityClaimed: 4 }));
      const result = await useCase.execute({
        campaignId: campaign.getId(),
        rewardId,
        authenticatedUserId: ownerId,
        isActive: false,
      });

      expect(result.isActive).toBe(false);
      expect(result.quantityClaimed).toBe(4);
      expect(result.isSoldOut).toBe(false);
      expect(rewardRepository.setActive).toHaveBeenCalledTimes(1);
      expect(rewardRepository.update).not.toHaveBeenCalled();
      expect(rewardRepository.delete).not.toHaveBeenCalled();
    });

    it('lets the owner activate a reward', async () => {
      rewardRepository.findById.mockResolvedValue(storedReward({ isActive: false }));
      const result = await useCase.execute({
        campaignId: campaign.getId(),
        rewardId,
        authenticatedUserId: ownerId,
        isActive: true,
      });

      expect(result.isActive).toBe(true);
      expect(rewardRepository.update).not.toHaveBeenCalled();
    });

    it('rejects a creator who does not own the campaign', async () => {
      rewardRepository.findById.mockResolvedValue(storedReward());
      await expect(
        useCase.execute({
          campaignId: campaign.getId(),
          rewardId,
          authenticatedUserId: otherUserId,
          isActive: false,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(rewardRepository.setActive).not.toHaveBeenCalled();
    });

    it('keeps a sold-out reward sold out after it is activated', async () => {
      rewardRepository.findById.mockResolvedValue(
        storedReward({ isActive: false, quantityTotal: 2, quantityClaimed: 2 }),
      );
      const result = await useCase.execute({
        campaignId: campaign.getId(),
        rewardId,
        authenticatedUserId: ownerId,
        isActive: true,
      });

      expect(result.isActive).toBe(true);
      expect(result.quantityClaimed).toBe(2);
      expect(result.quantityTotal).toBe(2);
      expect(result.quantityRemaining).toBe(0);
      expect(result.isSoldOut).toBe(true);
    });

    it('deactivates an unlimited reward without treating it as sold out', async () => {
      rewardRepository.findById.mockResolvedValue(
        storedReward({ quantityTotal: null, quantityClaimed: 9 }),
      );
      const result = await useCase.execute({
        campaignId: campaign.getId(),
        rewardId,
        authenticatedUserId: ownerId,
        isActive: false,
      });

      expect(result.quantityTotal).toBeNull();
      expect(result.quantityClaimed).toBe(9);
      expect(result.quantityRemaining).toBeNull();
      expect(result.isSoldOut).toBe(false);
      expect(result.isActive).toBe(false);
    });

    it('still allows the toggle after the campaign is published', async () => {
      publish(campaign);
      rewardRepository.findById.mockResolvedValue(storedReward());
      const result = await useCase.execute({
        campaignId: campaign.getId(),
        rewardId,
        authenticatedUserId: ownerId,
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });
  });
});
