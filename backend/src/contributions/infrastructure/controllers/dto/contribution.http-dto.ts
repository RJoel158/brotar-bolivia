import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_SUPPORTER_MESSAGE_LENGTH } from '../../../domain/contribution-validation.rules';

/**
 * Los identificadores sembrados por el equipo (f0000000-0000-...) tienen forma
 * de UUID pero no cumplen la version del RFC, asi que @IsUUID los rechaza.
 * Validamos la forma, igual que hace el resto de los controladores.
 */
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateContributionHttpDto {
  @Matches(UUID_LIKE, { message: 'campaignId no tiene formato de identificador valido' })
  campaignId!: string;

  /** Decimal places are checked in the domain: `maxDecimalPlaces` throws on values like 1e-7. */
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto del aporte debe ser un numero' })
  amount!: number;

  @IsIn(['donation', 'reward', 'presale'])
  contributionType!: 'donation' | 'reward' | 'presale';

  @IsOptional()
  @Matches(UUID_LIKE, { message: 'rewardId no tiene formato de identificador valido' })
  rewardId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_SUPPORTER_MESSAGE_LENGTH)
  supporterMessage?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class PaymentCardHttpDto {
  @IsString()
  @MaxLength(25)
  number!: string;

  @IsString()
  @MaxLength(80)
  holder!: string;

  @IsString()
  @MaxLength(5)
  expiry!: string;

  @IsString()
  @MaxLength(4)
  cvv!: string;
}

export class PayContributionHttpDto {
  @IsIn(['card', 'qr', 'transfer'])
  method!: 'card' | 'qr' | 'transfer';

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentCardHttpDto)
  card?: PaymentCardHttpDto;
}

export class CreateSponsorDisputeHttpDto {
  @IsIn(['payment_not_recognized', 'reward_not_received', 'project_not_executed', 'refund_request', 'other'], {
    message: 'Tipo de problema no valido',
  })
  disputeType!:
    | 'payment_not_recognized'
    | 'reward_not_received'
    | 'project_not_executed'
    | 'refund_request'
    | 'other';

  /** El minimo de caracteres se valida en el dominio, con un mensaje en espanol. */
  @IsString()
  @MaxLength(1000)
  description!: string;
}

export class ListMyContributionsHttpDto {
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'expired', 'failed', 'refunded', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'expired' | 'failed' | 'refunded' | 'cancelled';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
