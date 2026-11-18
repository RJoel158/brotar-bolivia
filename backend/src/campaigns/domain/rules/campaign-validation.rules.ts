import { CAMPAIGN_CATEGORIES } from '../value-objects/campaign-category.vo';
import { CAMPAIGN_TYPES } from '../value-objects/campaign-type.vo';
import { FUNDING_MODELS } from '../value-objects/funding-model.vo';

export class CampaignValidationRules {
  public static readonly MIN_TITLE_LENGTH = 5;
  public static readonly MAX_TITLE_LENGTH = 150;
  public static readonly MIN_SHORT_SUMMARY_LENGTH = 20;
  public static readonly MIN_GOAL_AMOUNT = 10;
  public static readonly MAX_GOAL_AMOUNT = 5000000;
  public static readonly ALLOWED_CATEGORIES = CAMPAIGN_CATEGORIES;
  public static readonly ALLOWED_CAMPAIGN_TYPES = CAMPAIGN_TYPES;
  public static readonly ALLOWED_FUNDING_MODELS = FUNDING_MODELS;

  public static validateTitle(title: string): void {
    if (!title || title.trim().length < this.MIN_TITLE_LENGTH) {
      throw new Error(`El título debe tener al menos ${this.MIN_TITLE_LENGTH} caracteres.`);
    }
    if (title.trim().length > this.MAX_TITLE_LENGTH) {
      throw new Error(`El título no puede exceder ${this.MAX_TITLE_LENGTH} caracteres.`);
    }
  }

  public static validateShortSummary(shortSummary: string | null | undefined): void {
    if (shortSummary == null || shortSummary === '') {
      return;
    }
    if (shortSummary.trim().length < this.MIN_SHORT_SUMMARY_LENGTH) {
      throw new Error(
        `El resumen debe tener al menos ${this.MIN_SHORT_SUMMARY_LENGTH} caracteres.`,
      );
    }
  }

  public static validateGoalAmount(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount) || amount < this.MIN_GOAL_AMOUNT) {
      throw new Error(`La meta de recaudación debe ser de al menos ${this.MIN_GOAL_AMOUNT} BOB.`);
    }
    if (amount > this.MAX_GOAL_AMOUNT) {
      throw new Error(`La meta de recaudación no puede exceder ${this.MAX_GOAL_AMOUNT} BOB.`);
    }
  }

  public static validateCategory(category: string): void {
    const normalized = category.toLowerCase().trim();
    if (!this.ALLOWED_CATEGORIES.includes(normalized as (typeof CAMPAIGN_CATEGORIES)[number])) {
      throw new Error(
        `Categoría inválida: "${category}". Permitidas: ${this.ALLOWED_CATEGORIES.join(', ')}.`,
      );
    }
  }

  public static validateCampaignType(campaignType: string): void {
    const normalized = campaignType.toLowerCase().trim();
    if (!this.ALLOWED_CAMPAIGN_TYPES.includes(normalized as (typeof CAMPAIGN_TYPES)[number])) {
      throw new Error(
        `Tipo de campaña inválido: "${campaignType}". Permitidos: ${this.ALLOWED_CAMPAIGN_TYPES.join(', ')}.`,
      );
    }
  }

  public static validateFundingModel(fundingModel: string): void {
    const normalized = fundingModel.toLowerCase().trim();
    if (!this.ALLOWED_FUNDING_MODELS.includes(normalized as (typeof FUNDING_MODELS)[number])) {
      throw new Error(
        `Modelo de financiamiento inválido: "${fundingModel}". Permitidos: ${this.ALLOWED_FUNDING_MODELS.join(', ')}.`,
      );
    }
  }

  public static validateEndDate(endDate: Date | null | undefined, now: Date = new Date()): void {
    if (endDate == null) {
      return;
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('La fecha de cierre debe ser una fecha válida.');
    }
    if (endDate.getTime() <= now.getTime()) {
      throw new Error('La fecha de cierre de campaña debe ser una fecha futura.');
    }
  }

  public static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    const suffix = crypto.randomUUID().slice(0, 8);
    return base ? `${base}-${suffix}` : suffix;
  }
}
