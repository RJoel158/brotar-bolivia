import { jest } from '@jest/globals';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateCampaignUseCase } from './update-campaign.use-case';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignStatus } from '../../domain/value-objects/campaign-status.vo';

describe('UpdateCampaignUseCase', () => {
  const ownerId = '22222222-2222-4222-8222-222222222222';
  const otherUserId = '33333333-3333-4333-8333-333333333333';

  let useCase: UpdateCampaignUseCase;
  let mockRepository: jest.Mocked<CampaignRepositoryPort>;
  let campaign: Campaign;

  beforeEach(() => {
    campaign = Campaign.create({
      title: 'Conservación de bosques andinos',
      category: 'ambiental',
      campaignType: 'donation',
      fundingModel: 'all_or_nothing',
      goalAmount: 15000,
      ownerUserId: ownerId,
      location: 'Cochabamba',
      shortSummary: 'Protección de la biodiversidad andina con la comunidad local.',
    });

    mockRepository = {
      save: jest.fn(),
      findById: jest.fn<() => Promise<Campaign | null>>().mockResolvedValue(campaign),
      findAccessById: jest.fn(),
      findAll: jest.fn(),
      findByOwnerUserId: jest.fn(),
      update: jest.fn<(c: Campaign) => Promise<Campaign>>().mockImplementation(async (c) => c),
      delete: jest.fn(),
    };

    useCase = new UpdateCampaignUseCase(mockRepository, {
      findByCampaignId: jest.fn().mockResolvedValue([]),
    } as never);
  });

  it('updates a draft owned by the authenticated creator', async () => {
    const result = await useCase.execute({
      campaignId: campaign.getId(),
      authenticatedUserId: ownerId,
      changes: {
        title: 'Bosques andinos actualizados',
        problem: 'Pérdida de cobertura vegetal.',
      },
    });

    expect(result.title).toBe('Bosques andinos actualizados');
    expect(result.problem).toBe('Pérdida de cobertura vegetal.');
    expect(result.ownerUserId).toBe(ownerId);
    expect(result.slug).toBe(campaign.getSlug());
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
  });

  it('throws NotFound when the campaign does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        campaignId: 'missing-id',
        authenticatedUserId: ownerId,
        changes: { title: 'Otro título válido' },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Forbidden when the authenticated user is not the owner', async () => {
    await expect(
      useCase.execute({
        campaignId: campaign.getId(),
        authenticatedUserId: otherUserId,
        changes: { title: 'Intento ajeno de edición' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(campaign.getTitle()).toBe('Conservación de bosques andinos');
  });

  it('does not change ownerUserId even if an extra field is supplied at runtime', async () => {
    const forgedChanges = {
      title: 'Título todavía propio',
      ownerUserId: otherUserId,
    } as { title: string; ownerUserId: string };

    const result = await useCase.execute({
      campaignId: campaign.getId(),
      authenticatedUserId: ownerId,
      changes: forgedChanges,
    });

    expect(result.ownerUserId).toBe(ownerId);
    expect(campaign.getOwnerUserId()).toBe(ownerId);
  });

  it('rejects invalid domain values', async () => {
    await expect(
      useCase.execute({
        campaignId: campaign.getId(),
        authenticatedUserId: ownerId,
        changes: { goalAmount: 1 },
      }),
    ).rejects.toThrow('La meta de recaudación debe ser de al menos 10 BOB.');

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('rejects updates when the campaign is not editable', async () => {
    campaign.submitForReview();
    campaign.approve();
    campaign.publish();

    await expect(
      useCase.execute({
        campaignId: campaign.getId(),
        authenticatedUserId: ownerId,
        changes: { title: 'No debería persistir' },
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});
