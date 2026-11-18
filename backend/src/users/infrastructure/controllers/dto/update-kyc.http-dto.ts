import { IsIn, IsNotEmpty, IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateKycHttpDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'El estado KYC es obligatorio.' })
  @IsIn(['pending', 'verified', 'rejected', 'requires_documentation'], {
    message: 'Estado KYC inválido. Valores permitidos: pending, verified, rejected, requires_documentation.',
  })
  kycStatus: 'pending' | 'verified' | 'rejected' | 'requires_documentation';

  /** Internal reviewer notes, never shown to the user. */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto.' })
  @MaxLength(1000, { message: 'Las observaciones no pueden exceder 1000 caracteres.' })
  notes?: string;

  /** Shown to the user: rejection reason or the documentation being requested. */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El motivo de rechazo debe ser texto.' })
  @MaxLength(1000, { message: 'El motivo de rechazo no puede exceder 1000 caracteres.' })
  rejectionReason?: string;
}

export class FilterUsersHttpDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  role?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  kycStatus?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  status?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
