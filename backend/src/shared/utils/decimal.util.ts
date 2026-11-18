const TWO_DECIMALS_PATTERN = /^\d+\.\d{1,2}$/;

/**
 * Checks the decimal representation instead of multiplying by 100, which is
 * imprecise (19.99 * 100 = 1998.9999999999998). Exponent forms such as 1e-7
 * are rejected because they do not match the pattern.
 */
export function hasAtMostTwoDecimals(value: number): boolean {
  return Number.isInteger(value) || TWO_DECIMALS_PATTERN.test(String(value));
}
