/** Signing and validation must share an explicitly configured secret. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET must be configured before starting the API.');
  }
  return secret;
}
