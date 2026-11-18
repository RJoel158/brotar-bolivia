import { jest } from '@jest/globals';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubmitCampaignForReviewUseCase } from './submit-campaign-for-review.use-case';
import { ReviewCampaignUseCase } from './review-campaign.use-case';
import { PublishCampaignUseCase } from './publish-campaign.use-case';
import { GetCampaignByIdUseCase } from './get-campaign-by-id.use-case';
import { GetMyCampaignsUseCase } from './get-my-campaigns.use-case';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignStatus } from '../../domain/value-objects/campaign-status.vo';

function buildCampaign(ownerId: string): Campaign {
  return Campaign.create({
    title: 'Conservación de bosques andinos',
    category: 'ambiental',
    campaignType: 'donation',
    fundingModel: 'all_or_nothing',
    goalAmount: 15000,
    ownerUserId: ownerId,
    location: 'Cochabamba',
    shortSummary: 'Protección de la biodiversidad andina con la comunidad local.',
  });
}

describe('Campaign workflow use cases', () => {
  const ownerId = '22222222-2222-4222-8222-222222222222';
  const otherUserId = '33333333-3333-4333-8333-333333333333';

  let mockRepository: jest.Mocked<CampaignRepositoryPort>;
  let campaign: Campaign;

  beforeEach(() => {
    campaign = buildCampaign(ownerId);
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn<() => Promise<Campaign | null>>().mockResolvedValue(campaign),
      findAccessById: jest.fn(),
      findAll: jest.fn(),
      findByOwnerUserId: jest
        .fn<() => Promise<Campaign[]>>()
        .mockResolvedValue([campaign]),
      update: jest.fn<(c: Campaign) => Promise<Campaign>>().mockImplementation(async (c) => c),
      delete: jest.fn(),
    };
  });

  it('lists mine by owner', async () => {
    const useCase = new GetMyCampaignsUseCase(mockRepository);
    const result = await useCase.execute(ownerId);
    expect(mockRepository.findByOwnerUserId).toHaveBeenCalledWith(ownerId);
    expect(result).toHaveLength(1);
    expect(result[0].ownerUserId).toBe(ownerId);
  });

  const rewardRepository = {
    findByCampaignId: jest.fn().mockResolvedValue([]),
  } as never;

  it('submits owned draft for review', async () => {
    const useCase = new SubmitCampaignForReviewUseCase(mockRepository, rewardRepository, { findById: jest.fn().mockResolvedValue({ isActive: () => true, isVerified: () => true }) } as never);
    const result = await useCase.execute(campaign.getId(), ownerId);
    expect(result.status).toBe('pending_review');
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
  });

  it.each(['pending', 'rejected', 'requires_documentation', 'missing', 'inactive'])(
    'blocks submission when owner verification is %s', async (state) => {
      const users = { findById: jest.fn().mockResolvedValue(state === 'missing' ? null : {
        isActive: () => state !== 'inactive',
        isVerified: () => state === 'inactive',
      }) };
      const useCase = new SubmitCampaignForReviewUseCase(mockRepository, rewardRepository, users as never);
      await expect(useCase.execute(campaign.getId(), ownerId)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(campaign.getStatus().getValue()).toBe('draft');
    },
  );

  it('forbids submit for non-owner', async () => {
    const useCase = new SubmitCampaignForReviewUseCase(mockRepository, rewardRepository, { findById: jest.fn().mockResolvedValue({ isActive: () => true, isVerified: () => true }) } as never);
    await expect(useCase.execute(campaign.getId(), otherUserId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('approves, rejects and requests changes only from pending_review', async () => {
    const mockReviewRepo = {
      save: jest.fn().mockResolvedValue({}),
      findByCampaignId: jest.fn().mockResolvedValue([]),
    };
    const review = new ReviewCampaignUseCase(mockRepository, mockReviewRepo as never);
    const reviewerId = '11111111-1111-4111-8111-111111111111';

    campaign.submitForReview();
    const approved = await review.execute({
      campaignId: campaign.getId(),
      reviewerUserId: reviewerId,
      action: 'approve',
    });
    expect(approved.status).toBe('approved');

    campaign = buildCampaign(ownerId);
    mockRepository.findById.mockResolvedValue(campaign);
    campaign.submitForReview();
    const rejected = await review.execute({
      campaignId: campaign.getId(),
      reviewerUserId: reviewerId,
      action: 'reject',
      rejectionReason: 'Documentación insuficiente para aprobar el proyecto.',
    });
    expect(rejected.status).toBe('rejected');
    expect(rejected.reviewRejectionReason).toContain('Documentación insuficiente');

    campaign = buildCampaign(ownerId);
    mockRepository.findById.mockResolvedValue(campaign);
    campaign.submitForReview();
    const changes = await review.execute({
      campaignId: campaign.getId(),
      reviewerUserId: reviewerId,
      action: 'request_changes',
      sectionNotes: { generalInfo: 'Completa el resumen y la sección de impacto.' },
    });
    expect(changes.status).toBe('changes_requested');
    expect(changes.reviewNotes).toContain('Completa el resumen');
    expect(mockReviewRepo.save).toHaveBeenCalledTimes(3);
  });

  it('rejects invalid review transitions', async () => {
    const mockReviewRepo = {
      save: jest.fn(),
      findByCampaignId: jest.fn(),
    };
    const review = new ReviewCampaignUseCase(mockRepository, mockReviewRepo as never);
    await expect(
      review.execute({
        campaignId: campaign.getId(),
        reviewerUserId: '11111111-1111-4111-8111-111111111111',
        action: 'approve',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes only approved campaigns', async () => {
    const publish = new PublishCampaignUseCase(mockRepository);

    await expect(publish.execute(campaign.getId())).rejects.toBeInstanceOf(ConflictException);

    campaign.submitForReview();
    campaign.approve();
    const published = await publish.execute(campaign.getId());
    expect(published.status).toBe('published');
  });

  it('getById allows public published and forbids private without viewer', async () => {
    const useCase = new GetCampaignByIdUseCase(mockRepository);

    await expect(useCase.execute(campaign.getId(), null)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    campaign.submitForReview();
    campaign.approve();
    campaign.publish();

    const published = await useCase.execute(campaign.getId(), null);
    expect(published.status).toBe('published');
  });

  it('getById allows owner to see draft', async () => {
    const useCase = new GetCampaignByIdUseCase(mockRepository);
    const draft = await useCase.execute(campaign.getId(), {
      id: ownerId,
      role: 'creator',
    });
    expect(draft.status).toBe('draft');
  });

  it('getById keeps reading the owner and organization names for the detail view', async () => {
    mockRepository.findById.mockResolvedValue(
      Campaign.reconstitute({
        id: campaign.getId(),
        ownerUserId: ownerId,
        organizationId: '44444444-4444-4444-8444-444444444444',
        category: 'ambiental',
        title: 'Conservación de bosques andinos',
        slug: 'conservacion-de-bosques-andinos',
        location: 'Cochabamba',
        shortSummary: 'Protección de la biodiversidad andina con la comunidad local.',
        coverImageUrl: null,
        campaignType: 'donation',
        fundingModel: 'all_or_nothing',
        goalAmount: 15000,
        currentAmount: 0,
        currency: 'BOB',
        startDate: null,
        endDate: null,
        status: CampaignStatus.PUBLISHED,
        problem: null,
        solution: null,
        beneficiaries: null,
        expectedImpact: null,
        impactIndicators: null,
        reviewNotes: null,
        reviewRejectionReason: null,
        creatorName: 'Ana Pérez',
        organizationName: 'Fundación Bosques Vivos',
        createdAt: new Date('2026-10-01T12:00:00.000Z'),
        updatedAt: new Date('2026-10-02T12:00:00.000Z'),
        publishedAt: new Date('2026-10-02T12:00:00.000Z'),
      }),
    );
    const useCase = new GetCampaignByIdUseCase(mockRepository);

    const result = await useCase.execute(campaign.getId(), null);

    expect(result.creatorName).toBe('Ana Pérez');
    expect(result.organizationName).toBe('Fundación Bosques Vivos');
    expect(mockRepository.findAccessById).not.toHaveBeenCalled();
  });

  it('getById throws NotFound for missing campaign', async () => {
    mockRepository.findById.mockResolvedValue(null);
    const useCase = new GetCampaignByIdUseCase(mockRepository);
    await expect(useCase.execute('missing', null)).rejects.toBeInstanceOf(NotFoundException);
  });
});
