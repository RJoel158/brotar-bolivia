import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { GetCampaignUpdatesUseCase } from './get-campaign-updates.use-case';
import { GetCampaignReviewsUseCase } from './get-campaign-reviews.use-case';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';
import { CampaignStatus } from '../../domain/value-objects/campaign-status.vo';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type {
  CampaignUpdateRepositoryPort,
  CampaignUpdateWithAuthor,
} from '../ports/campaign-update.repository.port';
import type {
  CampaignReviewRecord,
  CampaignReviewRepositoryPort,
} from '../ports/campaign-review.repository.port';

const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';
const OWNER_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';

describe('Campaign updates and review history use cases', () => {
  let campaignRepository: jest.Mocked<CampaignRepositoryPort>;

  beforeEach(() => {
    campaignRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAccessById: jest.fn<() => Promise<CampaignAccess | null>>().mockResolvedValue(
        CampaignAccess.reconstitute({
          id: CAMPAIGN_ID,
          ownerUserId: OWNER_ID,
          status: CampaignStatus.PUBLISHED,
          campaignType: 'donation',
          currency: 'BOB',
          goalAmount: 15000,
        }),
      ),
      findAll: jest.fn(),
      findByOwnerUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  });

  afterEach(() => {
    expect(campaignRepository.findById).not.toHaveBeenCalled();
  });

  describe('GetCampaignUpdatesUseCase', () => {
    let updateRepository: jest.Mocked<CampaignUpdateRepositoryPort>;
    let useCase: GetCampaignUpdatesUseCase;

    beforeEach(() => {
      updateRepository = {
        save: jest.fn(),
        findById: jest.fn(),
        findByCampaignId: jest
          .fn<() => Promise<CampaignUpdateWithAuthor[]>>()
          .mockResolvedValue([]),
        delete: jest.fn(),
        isUserCampaignSupporter: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
      };
      useCase = new GetCampaignUpdatesUseCase(campaignRepository, updateRepository);
    });

    const visibilitiesRequested = () => updateRepository.findByCampaignId.mock.calls[0][1];

    it('throws NotFound when the campaign does not exist', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      await expect(useCase.execute({ campaignId: 'missing' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(updateRepository.findByCampaignId).not.toHaveBeenCalled();
    });

    it('shows only public updates to anonymous visitors', async () => {
      await useCase.execute({ campaignId: CAMPAIGN_ID, user: null });
      expect(visibilitiesRequested()).toEqual(['public']);
      expect(updateRepository.isUserCampaignSupporter).not.toHaveBeenCalled();
    });

    it('shows supporter updates to the owner without checking contributions', async () => {
      await useCase.execute({ campaignId: CAMPAIGN_ID, user: { id: OWNER_ID, role: 'creator' } });
      expect(visibilitiesRequested()).toEqual(['public', 'supporters_only']);
      expect(updateRepository.isUserCampaignSupporter).not.toHaveBeenCalled();
    });

    it('shows supporter updates to admins', async () => {
      await useCase.execute({ campaignId: CAMPAIGN_ID, user: { id: OTHER_USER_ID, role: 'admin' } });
      expect(visibilitiesRequested()).toEqual(['public', 'supporters_only']);
    });

    it('shows supporter updates to other users only when they support the campaign', async () => {
      updateRepository.isUserCampaignSupporter.mockResolvedValueOnce(true);
      await useCase.execute({ campaignId: CAMPAIGN_ID, user: { id: OTHER_USER_ID, role: 'sponsor' } });
      expect(updateRepository.isUserCampaignSupporter).toHaveBeenCalledWith(CAMPAIGN_ID, OTHER_USER_ID);
      expect(visibilitiesRequested()).toEqual(['public', 'supporters_only']);

      updateRepository.findByCampaignId.mockClear();
      await useCase.execute({ campaignId: CAMPAIGN_ID, user: { id: OTHER_USER_ID, role: 'sponsor' } });
      expect(visibilitiesRequested()).toEqual(['public']);
    });
  });

  describe('GetCampaignReviewsUseCase', () => {
    let reviewRepository: jest.Mocked<CampaignReviewRepositoryPort>;
    let useCase: GetCampaignReviewsUseCase;

    beforeEach(() => {
      reviewRepository = {
        save: jest.fn(),
        findByCampaignId: jest.fn<() => Promise<CampaignReviewRecord[]>>().mockResolvedValue([
          {
            id: '55555555-5555-4555-8555-555555555555',
            campaignId: CAMPAIGN_ID,
            reviewerUserId: OTHER_USER_ID,
            reviewerFullName: 'Revisora',
            reviewerEmail: null,
            action: 'changes_requested',
            reason: 'Completar el presupuesto.',
            sectionNotes: { planBudget: 'Detallar materiales.' },
            createdAt: new Date('2026-10-03T12:00:00.000Z'),
          },
        ]),
      };
      useCase = new GetCampaignReviewsUseCase(campaignRepository, reviewRepository);
    });

    it('returns the review history of an existing campaign', async () => {
      const result = await useCase.execute(CAMPAIGN_ID);
      expect(reviewRepository.findByCampaignId).toHaveBeenCalledWith(CAMPAIGN_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        action: 'changes_requested',
        sectionNotes: { planBudget: 'Detallar materiales.' },
        createdAt: '2026-10-03T12:00:00.000Z',
      });
    });

    it('throws NotFound when the campaign does not exist', async () => {
      campaignRepository.findAccessById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(reviewRepository.findByCampaignId).not.toHaveBeenCalled();
    });
  });
});
