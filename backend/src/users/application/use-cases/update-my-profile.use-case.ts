import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { OwnerUserResponseDto } from '../dto/user-response.dto';
import { PASSWORD_HASHER_PORT, type PasswordHasherPort } from '../ports/password-hasher.port';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { UserValidationRules } from '../../domain/rules/user-validation.rules';

export interface UpdateMyProfileDto {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  public async execute(userId: string, dto: UpdateMyProfileDto): Promise<OwnerUserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updateData: Record<string, any> = {};

    if (dto.fullName !== undefined) {
      try {
        UserValidationRules.validateFullName(dto.fullName);
      } catch (error) {
        throw new BadRequestException((error as Error).message);
      }
      updateData.full_name = UserValidationRules.normalizeFullName(dto.fullName);
    }

    if (dto.phone !== undefined) {
      updateData.phone = dto.phone ? dto.phone.trim() : null;
    }

    if (dto.avatarUrl !== undefined) {
      updateData.avatar_url = dto.avatarUrl ? dto.avatarUrl.trim() : null;
    }

    // Password change
    if (dto.newPassword) {
      const forceFlag = await this.prisma.user_must_change_password.findUnique({
        where: { user_id: userId },
      });
      const forcingChange = Boolean(forceFlag);

      // Cambio forzado tras temporal: no exige contraseña actual.
      // Perfil normal: sí exige la actual.
      if (!forcingChange) {
        if (!dto.currentPassword) {
          throw new BadRequestException('Debes ingresar tu contraseña actual para cambiarla');
        }

        const isMatch = await this.passwordHasher.compare(dto.currentPassword, user.password_hash);
        if (!isMatch) {
          throw new BadRequestException('La contraseña actual es incorrecta');
        }
      }

      if (dto.newPassword.length < 8) {
        throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
      }

      if (dto.currentPassword && dto.newPassword === dto.currentPassword) {
        throw new BadRequestException('La nueva contraseña debe ser distinta a la temporal');
      }

      updateData.password_hash = await this.passwordHasher.hash(dto.newPassword);
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.users.update({
        where: { id: userId },
        data: updateData,
      });
    }

    if (dto.newPassword) {
      await this.prisma.user_must_change_password.deleteMany({
        where: { user_id: userId },
      });
    }

    return this.getUserByIdUseCase.executeForOwner(userId);
  }
}
