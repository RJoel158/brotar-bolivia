import { hasAtMostTwoDecimals } from '../../../shared/utils/decimal.util';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class CampaignRewardValidationRules {
  public static readonly MAX_TITLE_LENGTH = 120;
  public static readonly MAX_DESCRIPTION_LENGTH = 500;
  public static readonly DELIVERY_TIME_ZONE = 'America/La_Paz';

  public static validateTitle(title: string): void {
    const trimmed = typeof title === 'string' ? title.trim() : '';
    if (!trimmed) {
      throw new Error('El título de la recompensa es obligatorio.');
    }
    if (trimmed.length > this.MAX_TITLE_LENGTH) {
      throw new Error(`El título no puede exceder ${this.MAX_TITLE_LENGTH} caracteres.`);
    }
  }

  public static validateDescription(description: string): void {
    const trimmed = typeof description === 'string' ? description.trim() : '';
    if (!trimmed) {
      throw new Error('La descripción de la recompensa es obligatoria.');
    }
    if (trimmed.length > this.MAX_DESCRIPTION_LENGTH) {
      throw new Error(
        `La descripción no puede exceder ${this.MAX_DESCRIPTION_LENGTH} caracteres.`,
      );
    }
  }

  public static validateMinimumContribution(amount: number): void {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('El aporte mínimo debe ser mayor a 0.');
    }
    if (!hasAtMostTwoDecimals(amount)) {
      throw new Error('El aporte mínimo admite como máximo 2 decimales.');
    }
  }

  /** `null` means unlimited availability. */
  public static validateQuantityTotal(quantity: number | null): void {
    if (quantity === null) {
      return;
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('El cupo total debe ser un número entero mayor a 0 o ilimitado.');
    }
  }

  public static validateDeliveryDate(value: string, now: Date = new Date()): void {
    if (!this.isValidIsoDate(value)) {
      throw new Error('La fecha estimada de entrega debe ser una fecha válida (YYYY-MM-DD).');
    }
    if (value < this.todayIsoDate(now)) {
      throw new Error('La fecha estimada de entrega no puede ser anterior a hoy.');
    }
  }

  /** Calendar date of `now` in America/La_Paz, as YYYY-MM-DD. */
  public static todayIsoDate(now: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.DELIVERY_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  public static isValidIsoDate(value: string): boolean {
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
