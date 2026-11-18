const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const BUDGET_CATEGORIES = [
  'Materiales',
  'Mano de obra',
  'Equipamiento',
  'Logística',
  'Servicios',
  'Capacitación',
  'Difusión',
  'Otros',
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export class CampaignPlanValidationRules {
  public static readonly MAX_ACTIVITIES = 30;
  public static readonly MAX_BUDGET_ITEMS = 50;
  public static readonly MAX_ACTIVITY_NAME_LENGTH = 200;
  public static readonly MAX_ACTIVITY_DESCRIPTION_LENGTH = 1000;
  public static readonly MAX_BUDGET_DESCRIPTION_LENGTH = 300;
  public static readonly MAX_BUDGET_AMOUNT = 5_000_000;

  public static validateActivityCount(count: number): void {
    if (count > this.MAX_ACTIVITIES) {
      throw new Error(`El plan no puede tener más de ${this.MAX_ACTIVITIES} actividades.`);
    }
  }

  public static validateBudgetItemCount(count: number): void {
    if (count > this.MAX_BUDGET_ITEMS) {
      throw new Error(`El presupuesto no puede tener más de ${this.MAX_BUDGET_ITEMS} gastos.`);
    }
  }

  public static validateActivityName(name: string, position: number): void {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) {
      throw new Error(`La actividad ${position} debe tener un nombre.`);
    }
    if (trimmed.length > this.MAX_ACTIVITY_NAME_LENGTH) {
      throw new Error(
        `El nombre de la actividad ${position} no puede exceder ${this.MAX_ACTIVITY_NAME_LENGTH} caracteres.`,
      );
    }
  }

  public static validateActivityDescription(description: string | null, position: number): void {
    if (description && description.trim().length > this.MAX_ACTIVITY_DESCRIPTION_LENGTH) {
      throw new Error(
        `La descripción de la actividad ${position} no puede exceder ${this.MAX_ACTIVITY_DESCRIPTION_LENGTH} caracteres.`,
      );
    }
  }

  public static validateActivityDates(startDate: string, endDate: string, position: number): void {
    if (!this.isValidIsoDate(startDate)) {
      throw new Error(`La fecha de inicio de la actividad ${position} no es válida (YYYY-MM-DD).`);
    }
    if (!this.isValidIsoDate(endDate)) {
      throw new Error(`La fecha de fin de la actividad ${position} no es válida (YYYY-MM-DD).`);
    }
    if (endDate < startDate) {
      throw new Error(
        `La fecha de fin de la actividad ${position} no puede ser anterior a su inicio.`,
      );
    }
  }

  public static validateBudgetCategory(category: string, position: number): void {
    if (!BUDGET_CATEGORIES.includes(category as BudgetCategory)) {
      throw new Error(
        `La categoría del gasto ${position} debe ser una de: ${BUDGET_CATEGORIES.join(', ')}.`,
      );
    }
  }

  public static validateBudgetDescription(description: string, position: number): void {
    const trimmed = typeof description === 'string' ? description.trim() : '';
    if (!trimmed) {
      throw new Error(`El gasto ${position} debe tener un concepto.`);
    }
    if (trimmed.length > this.MAX_BUDGET_DESCRIPTION_LENGTH) {
      throw new Error(
        `El concepto del gasto ${position} no puede exceder ${this.MAX_BUDGET_DESCRIPTION_LENGTH} caracteres.`,
      );
    }
  }

  public static validateBudgetAmount(amount: number, position: number): void {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new Error(`El monto del gasto ${position} debe ser mayor a 0.`);
    }
    if (amount > this.MAX_BUDGET_AMOUNT) {
      throw new Error(`El monto del gasto ${position} no puede superar ${this.MAX_BUDGET_AMOUNT}.`);
    }
    if (Math.round(amount * 100) !== amount * 100) {
      throw new Error(`El monto del gasto ${position} admite como máximo 2 decimales.`);
    }
  }

  private static isValidIsoDate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const match = ISO_DATE_PATTERN.exec(value);
    if (!match) {
      return false;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }
}
