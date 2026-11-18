import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../ports/password-hasher.port';
import {
  INVALID_RESET_LINK,
  PasswordResetTokenService,
} from '../services/password-reset-token.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resetTokens: PasswordResetTokenService,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  public async execute(dto: {
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const claims = await this.resetTokens.verify(dto.token);
    const user = await this.prisma.users.findUnique({
      where: { id: claims.sub },
    });
    if (
      !user ||
      user.status !== 'active' ||
      !this.resetTokens.matchesPassword(claims, user.password_hash)
    ) {
      throw new BadRequestException(INVALID_RESET_LINK);
    }
    if (
      dto.newPassword.length < 8 ||
      Buffer.byteLength(dto.newPassword, 'utf8') > 72
    ) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres y un máximo de 72 bytes.',
      );
    }
    if (
      await this.passwordHasher.compare(dto.newPassword, user.password_hash)
    ) {
      throw new BadRequestException(
        'Elige una contraseña distinta a la anterior.',
      );
    }
    const passwordHash = await this.passwordHasher.hash(dto.newPassword);
    await this.prisma.$transaction(async (tx) => {
      // Compare-and-set makes the link single-use, including concurrent requests.
      const changed = await tx.users.updateMany({
        where: {
          id: user.id,
          password_hash: user.password_hash,
          status: 'active',
        },
        data: { password_hash: passwordHash, updated_at: new Date() },
      });
      if (changed.count !== 1)
        throw new BadRequestException(INVALID_RESET_LINK);
      await tx.user_must_change_password.deleteMany({
        where: { user_id: user.id },
      });
    });
    return {
      success: true,
      message:
        'Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.',
    };
  }
}
