import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/** PATCH semantics: omitted fields are kept; `quantityTotal: null` means unlimited. */
export class UpdateCampaignRewardHttpDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El título de la recompensa no puede quedar vacío.' })
  @MaxLength(120, { message: 'El título no puede exceder 120 caracteres.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción de la recompensa no puede quedar vacía.' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres.' })
  description?: string;

  /** Decimal places are checked in the domain: `maxDecimalPlaces` throws on values like 1e-7. */
  @IsOptional()
  @IsNumber({}, { message: 'El aporte mínimo debe ser un número.' })
  @IsPositive({ message: 'El aporte mínimo debe ser mayor a 0.' })
  minimumContribution?: number;

  @IsOptional()
  @IsInt({ message: 'El cupo total debe ser un número entero o null (ilimitado).' })
  @Min(1, { message: 'El cupo total debe ser mayor a 0.' })
  quantityTotal?: number | null;

  @IsOptional()
  @IsString({ message: 'La fecha estimada de entrega debe ser una cadena de texto.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha estimada de entrega debe tener el formato YYYY-MM-DD.',
  })
  estimatedDeliveryOn?: string;
}
