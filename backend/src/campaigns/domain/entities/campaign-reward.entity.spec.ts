import { CampaignReward } from './campaign-reward.entity';
import { CampaignRewardValidationRules } from '../rules/campaign-reward-validation.rules';

describe('CampaignReward', () => {
  // 2026-10-02 02:00 UTC is still 2026-10-01 22:00 in America/La_Paz (UTC-4).
  const NOW = new Date('2026-10-02T02:00:00.000Z');
  const campaignId = '11111111-1111-4111-8111-111111111111';

  const validCommand = {
    campaignId,
    currency: 'BOB',
    title: '  Kit de semillas nativas  ',
    description: '  Paquete con 10 variedades de semillas nativas.  ',
    minimumContribution: 50,
    quantityTotal: 100,
    estimatedDeliveryOn: '2026-12-15',
  };

  describe('create', () => {
    it('creates a valid reward with a generated id and trimmed texts', () => {
      const reward = CampaignReward.create(validCommand, NOW);

      expect(reward.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(reward.getCampaignId()).toBe(campaignId);
      expect(reward.getTitle()).toBe('Kit de semillas nativas');
      expect(reward.getDescription()).toBe('Paquete con 10 variedades de semillas nativas.');
      expect(reward.getMinimumContribution()).toBe(50);
      expect(reward.getQuantityTotal()).toBe(100);
      expect(reward.getEstimatedDeliveryOn()).toBe('2026-12-15');
      expect(reward.getCurrency()).toBe('BOB');
      expect(reward.getQuantityClaimed()).toBe(0);
      expect(reward.getQuantityRemaining()).toBe(100);
      expect(reward.isActive()).toBe(true);
    });

    it('accepts null quantityTotal as unlimited availability', () => {
      const reward = CampaignReward.create({ ...validCommand, quantityTotal: null }, NOW);
      expect(reward.getQuantityTotal()).toBeNull();
      expect(reward.getQuantityRemaining()).toBeNull();
      expect(reward.isSoldOut()).toBe(false);
    });

    it('keeps a client-supplied id so retried creates do not duplicate', () => {
      const id = '99999999-9999-4999-8999-999999999999';
      expect(CampaignReward.create({ ...validCommand, id }, NOW).getId()).toBe(id);
    });

    // 0.29 * 100 and 19.99 * 100 are not integers in floating point, so a
    // multiplication-based check would wrongly reject them.
    it.each([0.01, 0.29, 19.99, 25.5, 100])('accepts %p as minimum contribution', (amount) => {
      const reward = CampaignReward.create({ ...validCommand, minimumContribution: amount }, NOW);
      expect(reward.getMinimumContribution()).toBe(amount);
    });

    it.each([1.001, 10.555, 0.1 + 0.2, 1e-7])(
      'rejects %p for having more than 2 decimals',
      (amount) => {
        expect(() =>
          CampaignReward.create({ ...validCommand, minimumContribution: amount }, NOW),
        ).toThrow('El aporte mínimo admite como máximo 2 decimales.');
      },
    );

    it.each([
      ['empty title', { title: '   ' }, 'El título de la recompensa es obligatorio.'],
      ['title over 120 chars', { title: 'a'.repeat(121) }, 'El título no puede exceder 120 caracteres.'],
      ['empty description', { description: '  ' }, 'La descripción de la recompensa es obligatoria.'],
      [
        'description over 500 chars',
        { description: 'a'.repeat(501) },
        'La descripción no puede exceder 500 caracteres.',
      ],
      ['zero amount', { minimumContribution: 0 }, 'El aporte mínimo debe ser mayor a 0.'],
      ['negative amount', { minimumContribution: -10 }, 'El aporte mínimo debe ser mayor a 0.'],
      ['NaN amount', { minimumContribution: Number.NaN }, 'El aporte mínimo debe ser mayor a 0.'],
      [
        'zero quantity',
        { quantityTotal: 0 },
        'El cupo total debe ser un número entero mayor a 0 o ilimitado.',
      ],
      [
        'decimal quantity',
        { quantityTotal: 2.5 },
        'El cupo total debe ser un número entero mayor a 0 o ilimitado.',
      ],
      [
        'month-only date',
        { estimatedDeliveryOn: '2026-12' },
        'La fecha estimada de entrega debe ser una fecha válida (YYYY-MM-DD).',
      ],
      [
        'non-existent date',
        { estimatedDeliveryOn: '2027-02-30' },
        'La fecha estimada de entrega debe ser una fecha válida (YYYY-MM-DD).',
      ],
      [
        'date before today',
        { estimatedDeliveryOn: '2026-09-30' },
        'La fecha estimada de entrega no puede ser anterior a hoy.',
      ],
    ])('rejects %s', (_label, override, message) => {
      expect(() => CampaignReward.create({ ...validCommand, ...override }, NOW)).toThrow(message);
    });

    it('uses the America/La_Paz calendar day to decide what "today" is', () => {
      expect(CampaignRewardValidationRules.todayIsoDate(NOW)).toBe('2026-10-01');
      expect(() =>
        CampaignReward.create({ ...validCommand, estimatedDeliveryOn: '2026-10-01' }, NOW),
      ).not.toThrow();
    });
  });

  describe('updateDetails', () => {
    it('applies only the provided fields and keeps the id', () => {
      const reward = CampaignReward.create(validCommand, NOW);
      const originalId = reward.getId();

      reward.updateDetails({ title: 'Kit ampliado', quantityTotal: null }, NOW);

      expect(reward.getId()).toBe(originalId);
      expect(reward.getTitle()).toBe('Kit ampliado');
      expect(reward.getQuantityTotal()).toBeNull();
      expect(reward.getDescription()).toBe('Paquete con 10 variedades de semillas nativas.');
      expect(reward.getEstimatedDeliveryOn()).toBe('2026-12-15');
    });

    it('keeps a stored past delivery date when it is omitted or sent unchanged', () => {
      const reward = CampaignReward.reconstitute({
        id: 'reward-1',
        campaignId,
        title: 'Recompensa antigua',
        description: 'Creada cuando la fecha todavía era futura.',
        minimumContribution: 30,
        currency: 'BOB',
        quantityTotal: 5,
        quantityClaimed: 0,
        isActive: true,
        estimatedDeliveryOn: '2025-01-10',
        createdAt: new Date('2024-12-01T00:00:00.000Z'),
        updatedAt: new Date('2024-12-01T00:00:00.000Z'),
      });

      expect(() => reward.updateDetails({ title: 'Nuevo título' }, NOW)).not.toThrow();
      expect(() =>
        reward.updateDetails({ estimatedDeliveryOn: '2025-01-10' }, NOW),
      ).not.toThrow();
      expect(reward.getEstimatedDeliveryOn()).toBe('2025-01-10');
    });

    it('rejects a changed delivery date that is before today', () => {
      const reward = CampaignReward.create(validCommand, NOW);
      expect(() => reward.updateDetails({ estimatedDeliveryOn: '2026-09-30' }, NOW)).toThrow(
        'La fecha estimada de entrega no puede ser anterior a hoy.',
      );
    });

    it('does not apply any change when one of the fields is invalid', () => {
      const reward = CampaignReward.create(validCommand, NOW);

      expect(() =>
        reward.updateDetails({ title: 'Título que no debe aplicarse', minimumContribution: 0 }, NOW),
      ).toThrow('El aporte mínimo debe ser mayor a 0.');
      expect(reward.getTitle()).toBe('Kit de semillas nativas');
      expect(reward.getMinimumContribution()).toBe(50);
    });
  });

  it('reconstitutes stored rewards with past delivery dates without validating them', () => {
    const reward = CampaignReward.reconstitute({
      id: 'reward-old',
      campaignId,
      title: 'Recompensa entregada',
      description: 'Fecha estimada ya pasada.',
      minimumContribution: 10,
      currency: 'BOB',
      quantityTotal: null,
      quantityClaimed: 3,
      isActive: true,
      estimatedDeliveryOn: '2020-05-01',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    expect(reward.getEstimatedDeliveryOn()).toBe('2020-05-01');
  });

  describe('availability and review validity', () => {
    const stored = (overrides: Partial<Parameters<typeof CampaignReward.reconstitute>[0]> = {}) =>
      CampaignReward.reconstitute({
        id: 'reward-1',
        campaignId,
        title: 'Canasta',
        description: 'Canasta mensual del huerto.',
        minimumContribution: 5,
        currency: 'BOB',
        quantityTotal: 10,
        quantityClaimed: 4,
        isActive: true,
        estimatedDeliveryOn: '2020-05-01',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        updatedAt: new Date('2020-01-01T00:00:00.000Z'),
        ...overrides,
      });

    it('distinguishes total, claimed and remaining slots', () => {
      const reward = stored();
      expect(reward.getQuantityTotal()).toBe(10);
      expect(reward.getQuantityClaimed()).toBe(4);
      expect(reward.getQuantityRemaining()).toBe(6);
      expect(reward.isSoldOut()).toBe(false);
    });

    it('is sold out when every slot is claimed, without deactivating it', () => {
      const reward = stored({ quantityClaimed: 10 });
      expect(reward.getQuantityRemaining()).toBe(0);
      expect(reward.isSoldOut()).toBe(true);
      expect(reward.isActive()).toBe(true);
    });

    it('changes only isActive and keeps claimed slots when activated or deactivated', () => {
      const reward = stored({ quantityClaimed: 10, isActive: false });
      reward.setActive(true);
      expect(reward.isActive()).toBe(true);
      expect(reward.getQuantityClaimed()).toBe(10);
      expect(reward.isSoldOut()).toBe(true);
      reward.setActive(false);
      expect(reward.isActive()).toBe(false);
      expect(reward.isSoldOut()).toBe(true);
    });

    it('counts a stored reward with a past date as valid for review', () => {
      expect(stored().isValidForReview()).toBe(true);
    });

    it('does not count inactive or broken rewards as valid for review', () => {
      expect(stored({ isActive: false }).isValidForReview()).toBe(false);
      expect(stored({ description: '' }).isValidForReview()).toBe(false);
      expect(stored({ minimumContribution: 0 }).isValidForReview()).toBe(false);
      expect(stored({ estimatedDeliveryOn: '2020-02-30' }).isValidForReview()).toBe(false);
    });
  });
});
