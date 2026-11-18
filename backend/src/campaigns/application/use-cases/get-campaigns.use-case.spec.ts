import { jest } from '@jest/globals';
import { GetCampaignsUseCase } from './get-campaigns.use-case';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { Campaign } from '../../domain/entities/campaign.entity';

describe('GetCampaignsUseCase', () => {
  it('returns mapped campaigns from repository filters', async () => {
    const draft = Campaign.create({
      title: 'Borrador privado',
      category: 'ambiental',
      campaignType: 'donation',
      fundingModel: 'flexible',
      goalAmount: 1000,
      ownerUserId: '11111111-1111-4111-8111-111111111111',
      location: 'La Paz',
      shortSummary: 'Resumen suficientemente largo para validar.',
    });

    const published = Campaign.create({
      title: 'Campaña publicada visible',
      category: 'social',
      campaignType: 'donation',
      fundingModel: 'flexible',
      goalAmount: 2000,
      ownerUserId: '11111111-1111-4111-8111-111111111111',
      location: 'La Paz',
      shortSummary: 'Resumen suficientemente largo para validar.',
    });
    published.submitForReview();
    published.approve();
    published.publish();

    const mockRepository: jest.Mocked<CampaignRepositoryPort> = {
      save: jest.fn(),
      findById: jest.fn(),
      findAccessById: jest.fn(),
      findAll: jest
        .fn<() => Promise<Campaign[]>>()
        .mockImplementation(async (criteria) => {
          if (criteria?.status === 'published') {
            return [published];
          }
          return [draft, published];
        }),
      findByOwnerUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const useCase = new GetCampaignsUseCase(mockRepository);
    const result = await useCase.execute({ status: 'published' });

    expect(mockRepository.findAll).toHaveBeenCalledWith({ status: 'published' });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('published');
    expect(result[0].title).toBe('Campaña publicada visible');
  });
});
