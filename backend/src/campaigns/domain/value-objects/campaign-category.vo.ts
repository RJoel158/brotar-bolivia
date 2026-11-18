export type CampaignCategoryType =
  | 'social'
  | 'ambiental'
  | 'productivo'
  | 'educacion'
  | 'salud'
  | 'cultura'
  | 'otro';

export const CAMPAIGN_CATEGORIES: readonly CampaignCategoryType[] = [
  'social',
  'ambiental',
  'productivo',
  'educacion',
  'salud',
  'cultura',
  'otro',
] as const;

export class CampaignCategory {
  private constructor(private readonly value: CampaignCategoryType) {}

  public getValue(): CampaignCategoryType {
    return this.value;
  }

  public static fromString(value: string): CampaignCategory {
    const normalized = value.toLowerCase().trim() as CampaignCategoryType;
    if (!CAMPAIGN_CATEGORIES.includes(normalized)) {
      throw new Error(
        `Categoría inválida: "${value}". Permitidas: ${CAMPAIGN_CATEGORIES.join(', ')}.`,
      );
    }
    return new CampaignCategory(normalized);
  }

  public equals(other: CampaignCategory): boolean {
    return this.value === other.value;
  }
}
