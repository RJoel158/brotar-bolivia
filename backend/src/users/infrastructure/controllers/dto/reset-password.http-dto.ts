import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordHttpDto {
  @IsString()
  @MinLength(1, { message: 'El enlace de recuperación es requerido' })
  @MaxLength(2048)
  token!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña es demasiado larga' })
  newPassword!: string;
}
