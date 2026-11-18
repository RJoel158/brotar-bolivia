import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserValidationRules } from '../../../domain/rules/user-validation.rules';

export class CreateUserHttpDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? UserValidationRules.normalizeFullName(value) : value,
  )
  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  @MinLength(UserValidationRules.MIN_NAME_LENGTH, {
    message: `El nombre completo debe tener al menos ${UserValidationRules.MIN_NAME_LENGTH} caracteres.`,
  })
  @MaxLength(UserValidationRules.MAX_NAME_LENGTH, {
    message: `El nombre completo no puede exceder ${UserValidationRules.MAX_NAME_LENGTH} caracteres.`,
  })
  @Matches(UserValidationRules.FULL_NAME_PATTERN, {
    message: UserValidationRules.FULL_NAME_FORMAT_MESSAGE,
  })
  fullName: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'creator', 'sponsor'], { message: 'El rol debe ser "admin", "creator" o "sponsor".' })
  role?: 'admin' | 'creator' | 'sponsor';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'verified', 'rejected', 'requires_documentation'])
  kycStatus?: 'pending' | 'verified' | 'rejected' | 'requires_documentation';
}
