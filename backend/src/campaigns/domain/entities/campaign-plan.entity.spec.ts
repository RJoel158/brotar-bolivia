import { CampaignPlan } from './campaign-plan.entity';

const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';

const validActivity = {
  name: '  Preparación del terreno  ',
  description: '  Limpieza y cercado  ',
  startDate: '2026-11-01',
  endDate: '2026-11-15',
};

const validBudgetItem = {
  category: 'Materiales',
  description: '  Plantines de pino nativo  ',
  amount: 1200.5,
};

describe('CampaignPlan', () => {
  it('normalizes input and assigns display order from the input order', () => {
    const plan = CampaignPlan.create({
      campaignId: CAMPAIGN_ID,
      activities: [validActivity, { ...validActivity, name: 'Plantación' }],
      budgetItems: [validBudgetItem],
    });

    const [first, second] = plan.getActivities();
    expect(first).toMatchObject({
      id: null,
      name: 'Preparación del terreno',
      description: 'Limpieza y cercado',
      status: 'planned',
      progressPercent: 0,
      displayOrder: 0,
    });
    expect(second.displayOrder).toBe(1);
    expect(plan.getBudgetItems()[0]).toMatchObject({
      description: 'Plantines de pino nativo',
      displayOrder: 0,
    });
  });

  it('stores empty descriptions as null', () => {
    const plan = CampaignPlan.create({
      campaignId: CAMPAIGN_ID,
      activities: [{ ...validActivity, description: '   ' }],
      budgetItems: [],
    });
    expect(plan.getActivities()[0].description).toBeNull();
  });

  it('sums the budget without floating point drift', () => {
    const plan = CampaignPlan.create({
      campaignId: CAMPAIGN_ID,
      activities: [],
      budgetItems: [
        { ...validBudgetItem, amount: 0.1 },
        { ...validBudgetItem, amount: 0.2 },
      ],
    });
    expect(plan.getTotalBudget()).toBe(0.3);
  });

  it('reports when the budget exceeds the goal', () => {
    const plan = CampaignPlan.create({
      campaignId: CAMPAIGN_ID,
      activities: [],
      budgetItems: [{ ...validBudgetItem, amount: 1500 }],
    });
    expect(plan.exceedsGoal(1000)).toBe(true);
    expect(plan.exceedsGoal(1500)).toBe(false);
  });

  it.each([
    [{ ...validActivity, name: '  ' }, 'debe tener un nombre'],
    [{ ...validActivity, startDate: '2026-02-30' }, 'fecha de inicio'],
    [{ ...validActivity, endDate: '15/11/2026' }, 'fecha de fin'],
    [{ ...validActivity, endDate: '2026-10-31' }, 'anterior a su inicio'],
  ])('rejects an invalid activity (%#)', (activity, message) => {
    expect(() =>
      CampaignPlan.create({ campaignId: CAMPAIGN_ID, activities: [activity], budgetItems: [] }),
    ).toThrow(message);
  });

  it.each([
    [{ ...validBudgetItem, category: 'Viajes' }, 'categoría'],
    [{ ...validBudgetItem, description: '' }, 'concepto'],
    [{ ...validBudgetItem, amount: 0 }, 'mayor a 0'],
    [{ ...validBudgetItem, amount: 10.555 }, '2 decimales'],
    [{ ...validBudgetItem, amount: 5_000_001 }, 'no puede superar'],
  ])('rejects an invalid budget item (%#)', (item, message) => {
    expect(() =>
      CampaignPlan.create({ campaignId: CAMPAIGN_ID, activities: [], budgetItems: [item] }),
    ).toThrow(message);
  });

  it('identifies the invalid item by its position', () => {
    expect(() =>
      CampaignPlan.create({
        campaignId: CAMPAIGN_ID,
        activities: [],
        budgetItems: [validBudgetItem, { ...validBudgetItem, amount: -1 }],
      }),
    ).toThrow('El monto del gasto 2 debe ser mayor a 0.');
  });

  it('limits the number of activities', () => {
    const activities = Array.from({ length: 31 }, () => validActivity);
    expect(() =>
      CampaignPlan.create({ campaignId: CAMPAIGN_ID, activities, budgetItems: [] }),
    ).toThrow('más de 30 actividades');
  });
});
