import { jest } from '@jest/globals';
import { CreateCampaignUseCase } from './create-campaign.use-case';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { Campaign } from '../../domain/entities/campaign.entity';

describe('CreateCampaignUseCase', () => {
  let useCase: CreateCampaignUseCase;
  let mockRepository: jest.Mocked<CampaignRepositoryPort>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockImplementation(async (c: Campaign) => c),
      findById: jest.fn(),
      findAccessById: jest.fn(),
      findAll: jest.fn(),
      findByOwnerUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new CreateCampaignUseCase(mockRepository);
  });

  it('should successfully execute creation and return CampaignResponseDto', async () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 15);

    const result = await useCase.execute({
      title: 'Conservación de bosques andinos',
      category: 'ambiental',
      campaignType: 'donation',
      fundingModel: 'all_or_nothing',
      goalAmount: 15000,
      ownerUserId: '22222222-2222-4222-8222-222222222222',
      endDate: futureDate,
      location: 'Cochabamba',
      shortSummary: 'Protección de la biodiversidad andina con la comunidad local.',
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Conservación de bosques andinos');
    expect(result.status).toBe('draft');
    expect(result.goalAmount).toBe(15000);
    expect(result.currentAmount).toBe(0);
    expect(result.slug).toBeDefined();
    expect(result.campaignType).toBe('donation');
    expect(result.fundingModel).toBe('all_or_nothing');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
