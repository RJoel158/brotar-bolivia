export type CampaignTypeValue = 'donation' | 'reward' | 'presale';

export const CAMPAIGN_TYPES: readonly CampaignTypeValue[] = [
  'donation',
  'reward',
  'presale',
] as const;

export class CampaignType {
  private constructor(private readonly value: CampaignTypeValue) {}

  public getValue(): CampaignTypeValue {
    return this.value;
  }

  public static fromString(value: string): CampaignType {
    const normalized = value.toLowerCase().trim() as CampaignTypeValue;
    if (!CAMPAIGN_TYPES.includes(normalized)) {
      throw new Error(
        `Tipo de campaña inválido: "${value}". Permitidos: ${CAMPAIGN_TYPES.join(', ')}.`,
      );
    }
    return new CampaignType(normalized);
  }

  public equals(other: CampaignType): boolean {
    return this.value === other.value;
  }
}
