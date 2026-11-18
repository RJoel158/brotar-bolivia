import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { CreateCampaignUpdateUseCase } from './create-campaign-update.use-case';
import { CampaignAccess } from '../../domain/value-objects/campaign-access.vo';
import { CampaignStatus } from '../../domain/value-objects/campaign-status.vo';
import type { CampaignRepositoryPort } from '../ports/campaign.repository.port';
import type { CampaignUpdateRepositoryPort } from '../ports/campaign-update.repository.port';

describe('CreateCampaignUpdateUseCase', () => {
  let campaignRepository: jest.Mocked<CampaignRepositoryPort>;
  let campaignUpdateRepository: jest.Mocked<CampaignUpdateRepositoryPort>;
  let useCase: CreateCampaignUpdateUseCase;

  const mockCampaign = CampaignAccess.reconstitute({
    id: '11111111-1111-4111-8111-111111111111',
    ownerUserId: 'user-creator-1',
    status: CampaignStatus.DRAFT,
    campaignType: 'donation',
    currency: 'BOB',
    goalAmount: 50000,
  });

  beforeEach(() => {
    campaignRepository = {
      findById: jest.fn(),
      findAccessById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findByOwnerUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    campaignUpdateRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCampaignId: jest.fn(),
      delete: jest.fn(),
      isUserCampaignSupporter: jest.fn(),
    };

    useCase = new CreateCampaignUpdateUseCase(campaignRepository, campaignUpdateRepository);
  });

  afterEach(() => {
    expect(campaignRepository.findById).not.toHaveBeenCalled();
  });

  it('should create and save an update when user is campaign owner', async () => {
    campaignRepository.findAccessById.mockResolvedValue(mockCampaign);
    campaignUpdateRepository.save.mockImplementation(async (update) => update);

    const result = await useCase.execute({
      campaignId: mockCampaign.getId(),
      authorUserId: 'user-creator-1',
      title: 'Primer hito alcanzado',
      body: 'Hemos plantado los primeros 500 plantines en la zona norte.',
      imageUrl: 'https://example.com/foto.jpg',
      visibility: 'public',
    });

    expect(result.title).toBe('Primer hito alcanzado');
    expect(result.visibility).toBe('public');
    expect(campaignUpdateRepository.save).toHaveBeenCalled();
  });

  it('should throw ForbiddenException if user is not campaign owner', async () => {
    campaignRepository.findAccessById.mockResolvedValue(mockCampaign);

    await expect(
      useCase.execute({
        campaignId: mockCampaign.getId(),
        authorUserId: 'other-user',
        title: 'Intento no autorizado',
        body: 'Contenido de prueba.',
      }),
    ).rejects.toThrow('Solo el creador de la campaña puede publicar actualizaciones.');
    expect(campaignUpdateRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if the campaign does not exist', async () => {
    campaignRepository.findAccessById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        campaignId: 'missing',
        authorUserId: 'user-creator-1',
        title: 'Sin campaña',
        body: 'Contenido de prueba.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(campaignUpdateRepository.save).not.toHaveBeenCalled();
  });

  it('should allow admin to post updates even if not owner', async () => {
    campaignRepository.findAccessById.mockResolvedValue(mockCampaign);
    campaignUpdateRepository.save.mockImplementation(async (update) => update);

    const result = await useCase.execute({
      campaignId: mockCampaign.getId(),
      authorUserId: 'admin-user',
      authorRole: 'admin',
      title: 'Aviso del Administrador',
      body: 'Esta campaña ha sido revisada y certificada por el equipo de Brotar.',
    });

    expect(result.title).toBe('Aviso del Administrador');
    expect(campaignUpdateRepository.save).toHaveBeenCalled();
  });
});
