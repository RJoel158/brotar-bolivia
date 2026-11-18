import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GetCampaignPlanUseCase } from './get-campaign-plan.use-case';
import { SaveCampaignPlanUseCase } from './save-campaign-plan.use-case';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CampaignPlanRepositoryPort } from '../ports/campaign-plan.repository.port';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignPlan } from '../../domain/entities/campaign-plan.entity';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';

const OWNER_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';

function buildCampaign(): Campaign {
  return Campaign.create({
    title: 'Conservación de bosques andinos',
    category: 'ambiental',
    campaignType: 'donation',
    fundingModel: 'all_or_nothing',
    goalAmount: 10000,
    ownerUserId: OWNER_ID,
    location: 'Cochabamba',
    shortSummary: 'Protección de la biodiversidad andina con la comunidad local.',
  });
}

function accessOf(campaign: Campaign): CampaignAccess {
  return CampaignAccess.reconstitute({
    id: campaign.getId(),
    ownerUserId: campaign.getOwnerUserId(),
    status: campaign.getStatus(),
    campaignType: campaign.getCampaignType(),
    currency: campaign.getCurrency(),
    goalAmount: campaign.getGoalAmount(),
  });
}

const activities = [{ name: 'Preparar terreno', startDate: '2026-11-01', endDate: '2026-11-15' }];
const budgetItems = [{ category: 'Materiales', description: 'Plantines', amount: 12000 }];

describe('Campaign plan use cases', () => {
  let campaign: Campaign;
  let campaignRepository: jest.Mocked<CampaignRepositoryPort>;
  let planRepository: jest.Mocked<CampaignPlanRepositoryPort>;

  beforeEach(() => {
    campaign = buildCampaign();
    campaignRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAccessById: jest
        .fn<() => Promise<CampaignAccess | null>>()
        .mockImplementation(async () => accessOf(campaign)),
      findAll: jest.fn(),
      findByOwnerUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    planRepository = {
      findByCampaignId: jest
        .fn<(id: string) => Promise<CampaignPlan>>()
        .mockImplementation(async (id) =>
          CampaignPlan.restore({ campaignId: id, activities: [], budgetItems: [] }),
        ),
      replace: jest
        .fn<(plan: CampaignPlan) => Promise<CampaignPlan>>()
        .mockImplementation(async (plan) => plan),
    };
  });

  afterEach(() => {
    expect(campaignRepository.findById).not.toHaveBeenCalled();
  });

  describe('SaveCampaignPlanUseCase', () => {
    it('saves the plan of an owned draft and reports the budget against the goal', async () => {
      const useCase = new SaveCampaignPlanUseCase(campaignRepository, planRepository);

      const result = await useCase.execute({
        campaignId: campaign.getId(),
        authenticatedUserId: OWNER_ID,
        activities,
        budgetItems,
      });

      expect(planRepository.replace).toHaveBeenCalledTimes(1);
      expect(result.activities).toHaveLength(1);
      expect(result.totalBudget).toBe(12000);
      expect(result.goalAmount).toBe(10000);
      expect(result.exceedsGoal).toBe(true);
    });

    it('rejects a missing campaign', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      const useCase = new SaveCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(
        useCase.execute({
          campaignId: 'missing',
          authenticatedUserId: OWNER_ID,
          activities,
          budgetItems,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids saving the plan of another user campaign', async () => {
      const useCase = new SaveCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(
        useCase.execute({
          campaignId: campaign.getId(),
          authenticatedUserId: OTHER_USER_ID,
          activities,
          budgetItems,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(planRepository.replace).not.toHaveBeenCalled();
    });

    it('rejects editing the plan once the campaign is under review', async () => {
      campaign.submitForReview();
      const useCase = new SaveCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(
        useCase.execute({
          campaignId: campaign.getId(),
          authenticatedUserId: OWNER_ID,
          activities,
          budgetItems,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps domain validation errors to BadRequest', async () => {
      const useCase = new SaveCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(
        useCase.execute({
          campaignId: campaign.getId(),
          authenticatedUserId: OWNER_ID,
          activities: [{ ...activities[0], endDate: '2026-10-01' }],
          budgetItems,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(planRepository.replace).not.toHaveBeenCalled();
    });
  });

  describe('GetCampaignPlanUseCase', () => {
    it('lets the owner see the plan of a draft', async () => {
      const useCase = new GetCampaignPlanUseCase(campaignRepository, planRepository);
      const result = await useCase.execute(campaign.getId(), { id: OWNER_ID, role: 'creator' });
      expect(result.campaignId).toBe(campaign.getId());
    });

    it('lets an admin see the plan of a draft', async () => {
      const useCase = new GetCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(
        useCase.execute(campaign.getId(), { id: OTHER_USER_ID, role: 'admin' }),
      ).resolves.toBeDefined();
    });

    it('hides the plan of an unpublished campaign from anonymous visitors', async () => {
      const useCase = new GetCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(useCase.execute(campaign.getId(), null)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(planRepository.findByCampaignId).not.toHaveBeenCalled();
    });

    it('shows the plan of a published campaign to anonymous visitors', async () => {
      campaign.submitForReview();
      campaign.approve();
      campaign.publish();
      const useCase = new GetCampaignPlanUseCase(campaignRepository, planRepository);
      await expect(useCase.execute(campaign.getId(), null)).resolves.toBeDefined();
    });
  });
});
