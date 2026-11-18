import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  IsOptional,
  ValidateIf,
} from 'class-validator';

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateCampaignRewardHttpDto {
  /** Optional client UUID so a retried create does not duplicate the reward. */
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'El identificador de la recompensa no es válido.' })
  id?: string;

  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El título de la recompensa es obligatorio.' })
  @MaxLength(120, { message: 'El título no puede exceder 120 caracteres.' })
  title: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción de la recompensa es obligatoria.' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres.' })
  description: string;

  /** Decimal places are checked in the domain: `maxDecimalPlaces` throws on values like 1e-7. */
  @IsNumber({}, { message: 'El aporte mínimo debe ser un número.' })
  @IsPositive({ message: 'El aporte mínimo debe ser mayor a 0.' })
  minimumContribution: number;

  /** Required key: send `null` for unlimited availability. */
  @ValidateIf((_, value) => value !== null)
  @IsInt({ message: 'El cupo total debe ser un número entero o null (ilimitado).' })
  @Min(1, { message: 'El cupo total debe ser mayor a 0.' })
  quantityTotal: number | null;

  @IsString({ message: 'La fecha estimada de entrega debe ser una cadena de texto.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha estimada de entrega debe tener el formato YYYY-MM-DD.',
  })
  estimatedDeliveryOn: string;
}
