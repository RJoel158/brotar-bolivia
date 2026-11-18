import { IsNotEmpty, IsOptional, IsString, Matches, IsIn, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitKycHttpDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsNotEmpty({ message: 'El número de documento es obligatorio.' })
  @IsString({ message: 'El número de documento debe ser una cadena de texto.' })
  @Matches(/^[A-Za-z0-9.\-\s]{3,30}$/, {
    message: 'El número de documento debe contener entre 3 y 30 caracteres válidos (letras, números, guiones).',
  })
  documentId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio.' })
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto.' })
  @IsIn(['CI', 'NIT', 'PASSPORT', 'FOREIGN'], {
    message: 'El tipo de documento debe ser uno de los siguientes: CI, NIT, PASSPORT, FOREIGN.',
  })
  documentType: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El nombre de la organización debe ser texto.' })
  @MaxLength(120, { message: 'El nombre de la organización no puede exceder los 120 caracteres.' })
  organizationName?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto.' })
  @Matches(/^\+?[0-9\s\-]{6,20}$/, {
    message: 'El formato del teléfono es inválido (debe contener entre 6 y 20 caracteres numéricos).',
  })
  phone?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'La imagen frontal del documento es obligatoria.' })
  @IsString({ message: 'La URL o imagen del documento frontal debe ser texto.' })
  documentFrontUrl: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((value: SubmitKycHttpDto) => value.documentType === 'CI' || value.documentBackUrl !== undefined)
  @IsNotEmpty({ message: 'El reverso es obligatorio para CI.' })
  @IsString({ message: 'La URL o imagen del documento posterior debe ser texto.' })
  documentBackUrl?: string;
}
