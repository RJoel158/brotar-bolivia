import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../shared/persistence/prisma.service';
import { toCampaignResponseDto } from '../../application/dto/campaign-mapper';
import { PrismaCampaignRepository } from './prisma-campaign.repository';

function rawCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    owner_user_id: '11111111-1111-4111-8111-111111111111',
    organization_id: null,
    category: 'ambiental',
    title: 'Reforestación comunitaria',
    slug: 'reforestacion-comunitaria',
    location: 'Cochabamba',
    short_summary: 'Resumen suficientemente largo para validar.',
    cover_image_url: null,
    campaign_type: 'donation',
    funding_model: 'flexible',
    goal_amount: 15000,
    current_amount: 0,
    currency: 'BOB',
    start_date: null,
    end_date: null,
    status: 'pending_review',
    problem: null,
    solution: null,
    beneficiaries: null,
    expected_impact: null,
    impact_indicators: null,
    review_notes: null,
    review_rejection_reason: null,
    created_at: new Date('2026-10-01T12:00:00.000Z'),
    updated_at: new Date('2026-10-02T12:00:00.000Z'),
    published_at: null,
    ...overrides,
  };
}

describe('PrismaCampaignRepository owner names', () => {
  const findMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
  const findUnique = jest.fn<(args: unknown) => Promise<unknown>>();
  const prisma = { campaign: { findMany, findUnique } } as unknown as PrismaService;
  const repository = new PrismaCampaignRepository(prisma);

  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
  });

  it('loads the review queue with the owner names in a single query', async () => {
    findMany.mockResolvedValue([
      rawCampaign({ users: { full_name: 'Ana Pérez', organization_name: null }, organizations: null }),
      rawCampaign({
        id: '33333333-3333-4333-8333-333333333333',
        users: { full_name: 'Luis Rojas', organization_name: 'Bosques Vivos' },
        organizations: { legal_name: 'Fundación Bosques Vivos' },
      }),
    ]);

    const result = (await repository.findAll({ status: 'pending_review' })).map(toCampaignResponseDto);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.map((c) => [c.creatorName, c.organizationName])).toEqual([
      ['Ana Pérez', null],
      ['Luis Rojas', 'Fundación Bosques Vivos'],
    ]);
    expect(result[0].ownerUserId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('selects only public name columns from the owner and organization', async () => {
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);

    await repository.findAll();
    await repository.findById('22222222-2222-4222-8222-222222222222');

    const expected = {
      users: { select: { full_name: true, organization_name: true } },
      organizations: { select: { legal_name: true } },
    };
    expect(findMany.mock.calls[0][0]).toMatchObject({ include: expected });
    expect(findUnique.mock.calls[0][0]).toMatchObject({ include: expected });
  });

  it('reports a missing owner name as null instead of inventing one', async () => {
    findUnique.mockResolvedValue(rawCampaign({ users: null, organizations: null }));

    const campaign = await repository.findById('22222222-2222-4222-8222-222222222222');
    const dto = toCampaignResponseDto(campaign!);

    expect(dto.creatorName).toBeNull();
    expect(dto.organizationName).toBeNull();
  });
});

describe('PrismaCampaignRepository access read', () => {
  const findUnique = jest.fn<(args: unknown) => Promise<unknown>>();
  const prisma = { campaign: { findUnique } } as unknown as PrismaService;
  const repository = new PrismaCampaignRepository(prisma);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('reads only the campaign columns, without the owner or organization', async () => {
    findUnique.mockResolvedValue(null);

    await repository.findAccessById('22222222-2222-4222-8222-222222222222');

    expect(findUnique).toHaveBeenCalledTimes(1);
    const args = findUnique.mock.calls[0][0] as Record<string, unknown>;
    expect(args).toEqual({
      where: { id: '22222222-2222-4222-8222-222222222222' },
      select: {
        id: true,
        owner_user_id: true,
        status: true,
        campaign_type: true,
        currency: true,
        goal_amount: true,
      },
    });
    expect(args).not.toHaveProperty('include');
  });

  it('maps the fields used by the access rules', async () => {
    findUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      owner_user_id: '11111111-1111-4111-8111-111111111111',
      status: 'changes_requested',
      campaign_type: 'reward',
      currency: 'USD',
      goal_amount: new Prisma.Decimal('15000.50'),
    });

    const access = await repository.findAccessById('22222222-2222-4222-8222-222222222222');

    expect(access).not.toBeNull();
    expect(access!.getId()).toBe('22222222-2222-4222-8222-222222222222');
    expect(access!.isOwnedBy('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(access!.isOwnedBy('33333333-3333-4333-8333-333333333333')).toBe(false);
    expect(access!.getStatus().getValue()).toBe('changes_requested');
    expect(access!.isEditable()).toBe(true);
    expect(access!.getCampaignType()).toBe('reward');
    expect(access!.getCurrency()).toBe('USD');
    expect(access!.getGoalAmount()).toBe(15000.5);
  });

  it('returns null for a missing campaign', async () => {
    findUnique.mockResolvedValue(null);
    await expect(repository.findAccessById('missing')).resolves.toBeNull();
  });
});
