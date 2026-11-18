export interface ActivityFormValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface BudgetFormValues {
  category: string;
  concept: string;
  amount: string;
}

/** Must match `BUDGET_CATEGORIES` in the backend plan validation rules. */
export const BUDGET_CATEGORY_OPTIONS = [
  'Materiales',
  'Mano de obra',
  'Equipamiento',
  'Logística',
  'Servicios',
  'Capacitación',
  'Difusión',
  'Otros',
] as const;

/** Limits must match `CampaignPlanValidationRules` in the backend. */
export const MAX_ACTIVITIES = 30;
export const MAX_BUDGET_ITEMS = 50;
export const MIN_ACTIVITY_NAME_LENGTH = 3;
export const MAX_ACTIVITY_NAME_LENGTH = 200;
export const MAX_ACTIVITY_DESCRIPTION_LENGTH = 1000;
export const MIN_BUDGET_CONCEPT_LENGTH = 3;
export const MAX_BUDGET_CONCEPT_LENGTH = 300;
export const MAX_BUDGET_AMOUNT = 5_000_000;
export const MAX_PLAN_YEARS_AHEAD = 5;
/** Upper bound of `campaign_rewards.quantity_total` (PostgreSQL INTEGER). */
export const MAX_REWARD_QUANTITY = 2_147_483_647;

export type RewardQuantityMode = 'limited' | 'unlimited';

export interface RewardFormValues {
  title: string;
  description: string;
  minimumContribution: string;
  quantityMode: RewardQuantityMode;
  availableQuantity: string;
  estimatedDelivery: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export const EMPTY_ACTIVITY_FORM: ActivityFormValues = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
};

export const EMPTY_BUDGET_FORM: BudgetFormValues = {
  category: '',
  concept: '',
  amount: '',
};

export const EMPTY_REWARD_FORM: RewardFormValues = {
  title: '',
  description: '',
  minimumContribution: '',
  quantityMode: 'limited',
  availableQuantity: '',
  estimatedDelivery: '',
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parsePositiveNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Today's date in the user's local time zone as YYYY-MM-DD. Built from local
 * date parts on purpose: `toISOString()` is UTC and shifts the day near midnight.
 */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const LA_PAZ_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/La_Paz',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's date on the America/La_Paz calendar, the one the API uses for rewards. */
export function todayLaPazIsoDate(): string {
  return LA_PAZ_DATE_FORMATTER.format(new Date());
}

function hasAtMostTwoDecimals(raw: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(raw.trim());
}

function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Latest date accepted in the plan, as YYYY-MM-DD. */
export function maxPlanIsoDate(): string {
  const today = todayIsoDate();
  return `${Number(today.slice(0, 4)) + MAX_PLAN_YEARS_AHEAD}${today.slice(4)}`;
}

export const LETTER_PATTERN = /\p{L}/u;

function validateText(
  value: string,
  { label, min, max }: { label: string; min: number; max: number },
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `Indica ${label}.`;
  if (trimmed.length < min) return `Debe tener al menos ${min} caracteres.`;
  if (trimmed.length > max) return `No puede exceder ${max} caracteres.`;
  if (!LETTER_PATTERN.test(trimmed)) return 'Debe contener texto, no solo números o símbolos.';
  return undefined;
}

function validatePlanDate(value: string, label: string): string | undefined {
  if (!value) return `Indica la fecha de ${label}.`;
  if (!isValidIsoDate(value)) return 'Indica una fecha válida.';
  if (value < todayIsoDate()) return `La fecha de ${label} no puede ser anterior a hoy.`;
  if (value > maxPlanIsoDate()) {
    return `La fecha de ${label} no puede superar ${MAX_PLAN_YEARS_AHEAD} años desde hoy.`;
  }
  return undefined;
}

export function validateActivity(values: ActivityFormValues): FormErrors<ActivityFormValues> {
  const errors: FormErrors<ActivityFormValues> = {
    name: validateText(values.name, {
      label: 'el nombre de la actividad o fase',
      min: MIN_ACTIVITY_NAME_LENGTH,
      max: MAX_ACTIVITY_NAME_LENGTH,
    }),
    startDate: validatePlanDate(values.startDate, 'inicio'),
    endDate: validatePlanDate(values.endDate, 'fin'),
  };
  if (values.description.trim().length > MAX_ACTIVITY_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede exceder ${MAX_ACTIVITY_DESCRIPTION_LENGTH} caracteres.`;
  }
  if (!errors.startDate && !errors.endDate && values.endDate < values.startDate) {
    errors.endDate = 'La fecha de fin no puede ser anterior al inicio.';
  }
  return errors;
}

export function validateBudgetItem(values: BudgetFormValues): FormErrors<BudgetFormValues> {
  const errors: FormErrors<BudgetFormValues> = {
    concept: validateText(values.concept, {
      label: 'el concepto del gasto',
      min: MIN_BUDGET_CONCEPT_LENGTH,
      max: MAX_BUDGET_CONCEPT_LENGTH,
    }),
  };
  if (!(BUDGET_CATEGORY_OPTIONS as readonly string[]).includes(values.category)) {
    errors.category = 'Elige la categoría del gasto.';
  }
  const amount = parsePositiveNumber(values.amount);
  if (amount === null) {
    errors.amount = 'El monto debe ser mayor a 0.';
  } else if (amount > MAX_BUDGET_AMOUNT) {
    errors.amount = `El monto no puede superar ${formatBob(MAX_BUDGET_AMOUNT)}.`;
  } else if (Math.round(amount * 100) !== amount * 100) {
    errors.amount = 'El monto admite como máximo 2 decimales.';
  }
  return errors;
}

/** Blocks characters that `<input type="number">` accepts but are not valid amounts. */
export function blockNonDecimalKeys(event: { key: string; preventDefault: () => void }): void {
  if (['e', 'E', '+', '-'].includes(event.key)) {
    event.preventDefault();
  }
}

/** Like `blockNonDecimalKeys`, also blocking decimal separators for whole quantities. */
export function blockNonIntegerKeys(event: { key: string; preventDefault: () => void }): void {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
    event.preventDefault();
  }
}

/**
 * `savedDelivery` is the date already stored when editing: keeping it unchanged
 * is allowed even if it is now in the past; a new date must not be.
 */
export function validateReward(
  values: RewardFormValues,
  savedDelivery: string | null = null,
): FormErrors<RewardFormValues> {
  const errors: FormErrors<RewardFormValues> = {};
  if (!values.title.trim()) {
    errors.title = 'Indica el título de la recompensa.';
  } else if (values.title.trim().length > 120) {
    errors.title = 'El título no puede exceder 120 caracteres.';
  }
  if (!values.description.trim()) {
    errors.description = 'Describe qué recibirá el patrocinador.';
  } else if (values.description.trim().length > 500) {
    errors.description = 'La descripción no puede exceder 500 caracteres.';
  }
  if (parsePositiveNumber(values.minimumContribution) === null) {
    errors.minimumContribution = 'El aporte mínimo debe ser mayor a 0.';
  } else if (!hasAtMostTwoDecimals(values.minimumContribution)) {
    errors.minimumContribution = 'El aporte mínimo admite como máximo dos decimales.';
  }
  if (values.quantityMode === 'limited') {
    const raw = values.availableQuantity.trim();
    const quantity = /^\d+$/.test(raw) ? Number(raw) : null;
    if (quantity === null || quantity < 1) {
      errors.availableQuantity = 'Los cupos deben ser un número entero mayor a 0.';
    } else if (quantity > MAX_REWARD_QUANTITY) {
      errors.availableQuantity = `Los cupos no pueden superar ${MAX_REWARD_QUANTITY.toLocaleString('es-BO')}.`;
    }
  }
  if (!values.estimatedDelivery) {
    errors.estimatedDelivery = 'Indica la fecha estimada de entrega.';
  } else if (!isValidIsoDate(values.estimatedDelivery)) {
    errors.estimatedDelivery = 'Indica una fecha válida.';
  } else if (
    values.estimatedDelivery !== savedDelivery &&
    values.estimatedDelivery < todayLaPazIsoDate()
  ) {
    errors.estimatedDelivery = 'La fecha de entrega no puede ser anterior a hoy.';
  }
  return errors;
}

export function hasErrors<T>(errors: FormErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

/** UUID v4: reward ids are sent to the API so a retried create is not duplicated. */
export function createLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatIsoDate(value: string): string {
  return value ? DATE_FORMATTER.format(new Date(`${value}T00:00:00Z`)) : '—';
}

export function formatRewardQuantity(quantity: number | null): string {
  if (quantity === null) return 'Ilimitado';
  return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
}

/** Availability and slot state stay separate. Inactive is not the same as sold out. */
export function describeRewardSlots(reward: {
  availableQuantity: number | null;
  quantityClaimed?: number;
  isActive?: boolean;
}): string {
  const offer = reward.isActive === false ? 'Inactiva' : 'Activa';
  if (reward.availableQuantity === null) {
    return `${offer} · Ilimitada`;
  }
  const claimed = reward.quantityClaimed ?? 0;
  const remaining = Math.max(reward.availableQuantity - claimed, 0);
  if (remaining === 0) {
    return `${offer} · Agotada (${claimed} de ${reward.availableQuantity} adjudicados)`;
  }
  return `${offer} · Disponibles ${remaining} de ${reward.availableQuantity}`;
}

export function formatBob(amount: number): string {
  return `Bs. ${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(amount)}`;
}
