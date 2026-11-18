import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCampaignHttpDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres.' })
  @MaxLength(150, { message: 'El título no puede exceder 150 caracteres.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La categoría debe ser una cadena de texto.' })
  @IsIn(['social', 'ambiental', 'productivo', 'educacion', 'salud', 'cultura', 'otro'], {
    message: 'Categoría no permitida.',
  })
  category?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de campaña debe ser una cadena de texto.' })
  @IsIn(['donation', 'reward', 'presale'], {
    message: 'Tipo de campaña no permitido.',
  })
  campaignType?: string;

  @IsOptional()
  @IsString({ message: 'El modelo de financiamiento debe ser una cadena de texto.' })
  @IsIn(['flexible', 'all_or_nothing'], {
    message: 'Modelo de financiamiento no permitido.',
  })
  fundingModel?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La meta de recaudación debe ser un número.' })
  @Min(10, { message: 'La meta mínima de recaudación es de 10 BOB.' })
  goalAmount?: number;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de organización debe ser un UUID válido.' })
  organizationId?: string;

  @IsOptional()
  @IsString({ message: 'El resumen debe ser una cadena de texto.' })
  @MinLength(20, { message: 'El resumen debe tener al menos 20 caracteres.' })
  shortSummary?: string;

  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto.' })
  coverImageUrl?: string;

  @IsOptional()
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  location?: string;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser una cadena de texto.' })
  currency?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha ISO-8601 válida.' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de cierre debe ser una fecha ISO-8601 válida.' })
  endDate?: string;

  @IsOptional()
  @IsString()
  problem?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsString()
  beneficiaries?: string;

  @IsOptional()
  @IsString()
  expectedImpact?: string;

  @IsOptional()
  @IsString()
  impactIndicators?: string;
}
