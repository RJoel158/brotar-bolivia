export type FundingModelType = 'flexible' | 'all_or_nothing';

export const FUNDING_MODELS: readonly FundingModelType[] = [
  'flexible',
  'all_or_nothing',
] as const;

export class FundingModel {
  private constructor(private readonly value: FundingModelType) {}

  public getValue(): FundingModelType {
    return this.value;
  }

  public static fromString(value: string): FundingModel {
    const normalized = value.toLowerCase().trim() as FundingModelType;
    if (!FUNDING_MODELS.includes(normalized)) {
      throw new Error(
        `Modelo de financiamiento inválido: "${value}". Permitidos: ${FUNDING_MODELS.join(', ')}.`,
      );
    }
    return new FundingModel(normalized);
  }

  public equals(other: FundingModel): boolean {
    return this.value === other.value;
  }
}
