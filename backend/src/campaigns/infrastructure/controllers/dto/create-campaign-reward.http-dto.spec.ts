import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCampaignRewardHttpDto } from './create-campaign-reward.http-dto';

describe('CreateCampaignRewardHttpDto', () => {
  const validPayload = {
    title: 'Kit de semillas',
    description: 'Semillas nativas para iniciar un huerto en casa.',
    minimumContribution: 19.99,
    quantityTotal: null,
    estimatedDeliveryOn: '2099-12-31',
  };

  const errorsFor = async (payload: object) =>
    validate(plainToInstance(CreateCampaignRewardHttpDto, payload));

  it.each([0.01, 0.29, 19.99])('accepts %p as minimum contribution', async (amount) => {
    expect(await errorsFor({ ...validPayload, minimumContribution: amount })).toHaveLength(0);
  });

  it('does not throw on amounts serialized in exponent notation (decimals are checked in the domain)', async () => {
    await expect(errorsFor({ ...validPayload, minimumContribution: 1e-7 })).resolves.toBeDefined();
  });

  it('accepts null quantityTotal but requires the key', async () => {
    expect(await errorsFor(validPayload)).toHaveLength(0);
    const { quantityTotal: _omitted, ...withoutQuantity } = validPayload;
    const errors = await errorsFor(withoutQuantity);
    expect(errors.map((error) => error.property)).toContain('quantityTotal');
  });

  it('rejects month-only delivery dates', async () => {
    const errors = await errorsFor({ ...validPayload, estimatedDeliveryOn: '2099-12' });
    expect(errors.map((error) => error.property)).toContain('estimatedDeliveryOn');
  });
});
