export type CampaignTypeValue = 'donation' | 'reward' | 'presale';

export type FundingModelValue = 'flexible' | 'all_or_nothing';

export type CampaignCategoryValue =
  | 'social'
  | 'ambiental'
  | 'productivo'
  | 'educacion'
  | 'salud'
  | 'cultura'
  | 'otro';

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CampaignCreationDraft {
  campaignType: CampaignTypeValue | null;
  title: string;
  category: CampaignCategoryValue | null;
  location: string;
  shortSummary: string;
  coverImage: File | null;
  problem: string;
  solution: string;
  beneficiaries: string;
  expectedImpact: string;
  impactIndicators: string;
  fundingModel: FundingModelValue | null;
  goalAmount: number | null;
}

export interface PlanActivity {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  concept: string;
  amount: number;
}

export interface CampaignReward {
  id: string;
  title: string;
  description: string;
  minimumContribution: number;
  /**
   * Cupo total (`quantityTotal`). `null` = ilimitado.
   * No es la disponibilidad restante.
   */
  availableQuantity: number | null;
  /** Cupos adjudicados por aportes confirmados. Solo lectura; no se envía al guardar. */
  quantityClaimed?: number;
  /** `false` = no admite aportes nuevos, aunque queden cupos. Solo lectura. */
  isActive?: boolean;
  /** Calendar date in YYYY-MM-DD format. */
  estimatedDelivery: string;
}

/**
 * Data for steps 4 and 6. Activities and budget items are saved with
 * `PUT /campaigns/:id/plan`; rewards are synced with `/campaigns/:id/rewards`.
 */
export interface CampaignPlanningDraft {
  activities: PlanActivity[];
  budgetItems: BudgetItem[];
  rewards: CampaignReward[];
}

export const CAMPAIGN_TYPE_OPTIONS: ReadonlyArray<{
  value: CampaignTypeValue;
  title: string;
  description: string;
}> = [
  {
    value: 'donation',
    title: 'Donación',
    description: 'Aportes de apoyo directo, sin retorno material.',
  },
  {
    value: 'reward',
    title: 'Recompensa',
    description: 'Aportes a cambio de retribuciones o experiencias.',
  },
  {
    value: 'presale',
    title: 'Preventa',
    description: 'Compra anticipada para financiar la producción inicial.',
  },
];

export const CAMPAIGN_CATEGORY_OPTIONS: ReadonlyArray<{
  value: CampaignCategoryValue;
  label: string;
}> = [
  { value: 'social', label: 'Social' },
  { value: 'ambiental', label: 'Medio ambiente' },
  { value: 'productivo', label: 'Productivo' },
  { value: 'educacion', label: 'Educación' },
  { value: 'salud', label: 'Salud' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'otro', label: 'Otro' },
];

export const WIZARD_NAV_ITEMS: ReadonlyArray<{
  step: WizardStep;
  id: string;
  label: string;
}> = [
  { step: 2, id: 'information', label: 'Información' },
  { step: 3, id: 'story', label: 'Historia e impacto' },
  { step: 4, id: 'plan', label: 'Plan y presupuesto' },
  { step: 5, id: 'funding', label: 'Financiamiento' },
  { step: 6, id: 'rewards', label: 'Recompensas' },
  { step: 7, id: 'verification', label: 'Verificación' },
  { step: 8, id: 'review', label: 'Revisión' },
];

export const FUNDING_MODEL_OPTIONS: ReadonlyArray<{
  value: FundingModelValue;
  title: string;
  description: string;
}> = [
  {
    value: 'flexible',
    title: 'Flexible',
    description: 'Recibes lo recaudado aunque no se alcance la meta.',
  },
  {
    value: 'all_or_nothing',
    title: 'Todo o nada',
    description: 'Solo recibes los fondos si se alcanza la meta.',
  },
];

export const SHORT_SUMMARY_MAX_LENGTH = 160;
export const MIN_SHORT_SUMMARY_LENGTH = 20;
export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 150;
export const MIN_GOAL_AMOUNT = 10;
export const MAX_GOAL_AMOUNT = 5_000_000;
export const COVER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_IMAGE_ACCEPT = 'image/jpeg,image/png';
export const TOTAL_WIZARD_STEPS = 8;
