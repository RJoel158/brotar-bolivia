import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { GetCampaignCatalogUseCase } from './get-campaign-catalog.use-case';
import type { CampaignCatalogRepositoryPort } from '../ports/campaign-catalog.repository.port';

describe('Bounded public catalog', () => {
  const findPage = jest.fn<CampaignCatalogRepositoryPort['findPage']>();
  beforeEach(() => { findPage.mockReset(); findPage.mockResolvedValue({ items: [], next: null }); });
  it.each([0, -1, 49, 1.5, Number.NaN])('rejects an invalid limit %s before accessing persistence', async limit => {
    const useCase = new GetCampaignCatalogUseCase({ findPage });
    await expect(useCase.execute({ limit })).rejects.toBeInstanceOf(BadRequestException);
    expect(findPage).not.toHaveBeenCalled();
  });
  it('rejects malformed cursor before accessing persistence', async () => {
    await expect(new GetCampaignCatalogUseCase({ findPage }).execute({ cursor: 'invalid' })).rejects.toBeInstanceOf(BadRequestException);
    expect(findPage).not.toHaveBeenCalled();
  });
  it('uses a bounded default and normalizes the search without changing the response shape', async () => {
    await expect(new GetCampaignCatalogUseCase({ findPage }).execute({ query: '  bosque  ' })).resolves.toEqual({ items: [], nextCursor: null });
    expect(findPage).toHaveBeenCalledWith({ limit: 24, category: undefined, query: 'bosque', after: undefined });
  });
});
