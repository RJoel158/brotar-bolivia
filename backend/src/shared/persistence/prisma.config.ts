/** Bounded defaults per API process; explicit deployment settings take precedence. */
export function configureDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) throw new Error('DATABASE_URL must be configured.');
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error('DATABASE_URL is invalid.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use PostgreSQL.');
  }
  for (const [key, fallback] of Object.entries({ connection_limit: '10', pool_timeout: '5', connect_timeout: '5' })) {
    const value = url.searchParams.get(key) ?? fallback;
    if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
      throw new Error(`DATABASE_URL parameter ${key} must be a positive integer.`);
    }
    url.searchParams.set(key, value);
  }
  // Session settings affect this API pool only; never ALTER ROLE or the shared server.
  if (!url.searchParams.has('options')) {
    url.searchParams.set('options', '-c statement_timeout=15000 -c lock_timeout=3000 -c idle_in_transaction_session_timeout=15000');
  }
  if (!url.searchParams.has('application_name')) {
    url.searchParams.set('application_name', `brotar-api-${process.pid}`);
  }
  return url.toString();
}
