import { getJwtSecret } from './jwt.config';
describe('JWT configuration', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  });
  it('fails closed without an explicit signing secret', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');
  });
  it('uses the configured value for both signing and validation', () => {
    process.env.JWT_SECRET = 'test-only-secret';
    expect(getJwtSecret()).toBe('test-only-secret');
  });
});
