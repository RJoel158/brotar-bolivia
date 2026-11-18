import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios from 'axios';
import { mapRewardPersistenceError } from '../src/features/creator/campaign-creation/mapCampaignCreateError.ts';
import { describeRewardSlots } from '../src/features/creator/campaign-creation/planningValidation.ts';

function httpError(status: number, message?: string | string[]): unknown {
  return new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    statusText: String(status),
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
    data: message === undefined ? {} : { message },
  });
}

describe('describeRewardSlots', () => {
  it('describes unlimited rewards', () => {
    assert.equal(
      describeRewardSlots({ availableQuantity: null, quantityClaimed: 4, isActive: true }),
      'Activa · Ilimitada',
    );
  });

  it('describes remaining slots from total minus claimed', () => {
    assert.equal(
      describeRewardSlots({ availableQuantity: 10, quantityClaimed: 3, isActive: true }),
      'Activa · Disponibles 7 de 10',
    );
  });

  it('describes a sold-out reward without calling it available', () => {
    assert.equal(
      describeRewardSlots({ availableQuantity: 2, quantityClaimed: 2, isActive: true }),
      'Activa · Agotada (2 de 2 adjudicados)',
    );
  });

  it('does not present a deactivated reward as sold out when slots remain', () => {
    assert.equal(
      describeRewardSlots({ availableQuantity: 8, quantityClaimed: 1, isActive: false }),
      'Inactiva · Disponibles 7 de 8',
    );
  });

  it('keeps sold out visible when the reward is also inactive', () => {
    assert.equal(
      describeRewardSlots({ availableQuantity: 2, quantityClaimed: 2, isActive: false }),
      'Inactiva · Agotada (2 de 2 adjudicados)',
    );
  });
});

describe('mapRewardPersistenceError', () => {
  it('keeps the backend conflict reason on 409', () => {
    const message = mapRewardPersistenceError(
      httpError(409, 'La recompensa tiene aportes asociados: no se puede editar ni eliminar.'),
    );
    assert.match(message, /aportes asociados/);
    assert.doesNotMatch(message, /agotad/i);
  });

  it('does not describe a 409 without detail as a missing slot', () => {
    const message = mapRewardPersistenceError(httpError(409));
    assert.match(message, /conflicto/i);
    assert.doesNotMatch(message, /agotad|cupos/i);
  });

  it('describes 503 as unavailability, not as sold out', () => {
    const message = mapRewardPersistenceError(httpError(503));
    assert.match(message, /no está disponible/i);
    assert.match(message, /no significa que la recompensa se haya agotado/i);
  });
});
