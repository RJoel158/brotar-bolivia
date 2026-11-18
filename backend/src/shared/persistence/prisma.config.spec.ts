import { configureDatabaseUrl } from './prisma.config';

describe('Prisma connection budget', () => {
  it('sets a bounded per-process pool without dropping connection options', () => {
    const url = new URL(configureDatabaseUrl('postgresql://example.test/db?schema=custom&sslmode=require'));
    expect(url.searchParams.get('connection_limit')).toBe('10');
    expect(url.searchParams.get('pool_timeout')).toBe('5');
    expect(url.searchParams.get('connect_timeout')).toBe('5');
    expect(url.searchParams.get('schema')).toBe('custom');
    expect(url.searchParams.get('sslmode')).toBe('require');
    expect(url.searchParams.get('application_name')).toMatch(/^brotar-api-/);
  });
  it('preserves an explicit deployment budget and application tag', () => {
    const url = new URL(configureDatabaseUrl('postgresql://example.test/db?connection_limit=3&pool_timeout=7&connect_timeout=9&application_name=qa'));
    expect(url.searchParams.get('connection_limit')).toBe('3');
    expect(url.searchParams.get('pool_timeout')).toBe('7');
    expect(url.searchParams.get('connect_timeout')).toBe('9');
    expect(url.searchParams.get('application_name')).toBe('qa');
  });
  it('preserves explicit per-session SQL settings', () => {
    const raw = new URL('postgresql://example.test/db');
    raw.searchParams.set('options', '-c statement_timeout=30000 -c lock_timeout=1000');
    const configured = new URL(configureDatabaseUrl(raw.toString()));
    expect(configured.searchParams.get('options')).toBe(raw.searchParams.get('options'));
  });
  it.each(['0', '-1', 'NaN', 'Infinity', '1.5'])('rejects an unbounded or invalid timeout %s', (value) => {
    expect(() => configureDatabaseUrl(`postgresql://example.test/db?pool_timeout=${value}`)).toThrow('positive integer');
  });
});
