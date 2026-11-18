import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusHttpDto {
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsIn(['active', 'inactive'], {
    message: 'Estado inválido. Valores permitidos: active, inactive.',
  })
  status: 'active' | 'inactive';
}
