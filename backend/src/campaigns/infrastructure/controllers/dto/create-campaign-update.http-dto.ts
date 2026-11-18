import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateCampaignUpdateHttpDto {
  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El título de la actualización es obligatorio.' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres.' })
  @MaxLength(200, { message: 'El título no puede exceder los 200 caracteres.' })
  title: string;

  @IsString({ message: 'El contenido debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El contenido del comunicado es obligatorio.' })
  @MinLength(10, { message: 'El comunicado debe tener al menos 10 caracteres.' })
  body: string;

  @IsOptional()
  @ValidateIf((o) => o.imageUrl !== null && o.imageUrl !== undefined && o.imageUrl !== '')
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto.' })
  imageUrl?: string | null;

  @IsOptional()
  @IsString({ message: 'La visibilidad debe ser una cadena de texto.' })
  @IsIn(['public', 'supporters_only'], {
    message: 'La visibilidad debe ser "public" o "supporters_only".',
  })
  visibility?: 'public' | 'supporters_only';
}
