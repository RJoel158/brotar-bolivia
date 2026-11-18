import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BUDGET_CATEGORIES,
  CampaignPlanValidationRules,
} from '../../../domain/rules/campaign-plan-validation.rules';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class PlanActivityHttpDto {
  /** Ids that do not belong to the campaign are treated as new activities. */
  @IsOptional()
  @IsString({ message: 'El id de la actividad no es válido.' })
  @MaxLength(64, { message: 'El id de la actividad no es válido.' })
  id?: string;

  @Transform(trimString)
  @IsString({ message: 'El nombre de la actividad debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la actividad es obligatorio.' })
  @MaxLength(CampaignPlanValidationRules.MAX_ACTIVITY_NAME_LENGTH, {
    message: `El nombre de la actividad no puede exceder ${CampaignPlanValidationRules.MAX_ACTIVITY_NAME_LENGTH} caracteres.`,
  })
  name: string;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'La descripción de la actividad debe ser texto.' })
  @MaxLength(CampaignPlanValidationRules.MAX_ACTIVITY_DESCRIPTION_LENGTH, {
    message: `La descripción de la actividad no puede exceder ${CampaignPlanValidationRules.MAX_ACTIVITY_DESCRIPTION_LENGTH} caracteres.`,
  })
  description?: string;

  @Matches(ISO_DATE_PATTERN, { message: 'La fecha de inicio debe tener el formato YYYY-MM-DD.' })
  startDate: string;

  @Matches(ISO_DATE_PATTERN, { message: 'La fecha de fin debe tener el formato YYYY-MM-DD.' })
  endDate: string;
}

export class PlanBudgetItemHttpDto {
  /** Ids that do not belong to the campaign are treated as new budget items. */
  @IsOptional()
  @IsString({ message: 'El id del gasto no es válido.' })
  @MaxLength(64, { message: 'El id del gasto no es válido.' })
  id?: string;

  @IsIn(BUDGET_CATEGORIES, {
    message: `La categoría del gasto debe ser una de: ${BUDGET_CATEGORIES.join(', ')}.`,
  })
  category: string;

  @Transform(trimString)
  @IsString({ message: 'El concepto del gasto debe ser texto.' })
  @IsNotEmpty({ message: 'El concepto del gasto es obligatorio.' })
  @MaxLength(CampaignPlanValidationRules.MAX_BUDGET_DESCRIPTION_LENGTH, {
    message: `El concepto del gasto no puede exceder ${CampaignPlanValidationRules.MAX_BUDGET_DESCRIPTION_LENGTH} caracteres.`,
  })
  description: string;

  /** Decimal places are checked in the domain. */
  @IsNumber({}, { message: 'El monto del gasto debe ser un número.' })
  @IsPositive({ message: 'El monto del gasto debe ser mayor a 0.' })
  amount: number;
}

export class SaveCampaignPlanHttpDto {
  @IsArray({ message: 'Las actividades deben enviarse como una lista.' })
  @ArrayMaxSize(CampaignPlanValidationRules.MAX_ACTIVITIES, {
    message: `El plan no puede tener más de ${CampaignPlanValidationRules.MAX_ACTIVITIES} actividades.`,
  })
  @ValidateNested({ each: true })
  @Type(() => PlanActivityHttpDto)
  activities: PlanActivityHttpDto[];

  @IsArray({ message: 'Los gastos deben enviarse como una lista.' })
  @ArrayMaxSize(CampaignPlanValidationRules.MAX_BUDGET_ITEMS, {
    message: `El presupuesto no puede tener más de ${CampaignPlanValidationRules.MAX_BUDGET_ITEMS} gastos.`,
  })
  @ValidateNested({ each: true })
  @Type(() => PlanBudgetItemHttpDto)
  budgetItems: PlanBudgetItemHttpDto[];
}
