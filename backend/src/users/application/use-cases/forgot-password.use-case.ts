import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
} from '../dto/forgot-password.dto';
import { NotificationService } from '../../../notifications/application/notification.service';
import { PasswordRecoveryNotification } from '../../../notifications/domain/password-recovery.notification';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import { PasswordResetTokenService } from '../services/password-reset-token.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resetTokens: PasswordResetTokenService,
    private readonly notificationService: NotificationService,
  ) {}

  public async execute(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    // Check before lookup so configuration errors do not reveal accounts.
    try {
      await this.notificationService.assertAvailable('EMAIL');
    } catch {
      throw new ServiceUnavailableException(
        'El servicio de correo no está disponible. Intenta nuevamente más tarde.',
      );
    }
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (user?.status === 'active') {
      const token = await this.resetTokens.issue(user.id, user.password_hash);
      const resetUrl = new URL(
        '/recuperar-password',
        process.env.FRONTEND_URL || 'http://localhost:5173',
      );
      // Fragments are not sent to the web server or in Referer headers.
      resetUrl.hash = new URLSearchParams({ token }).toString();
      try {
        await this.notificationService.dispatch(
          new PasswordRecoveryNotification(
            { id: user.id, name: user.full_name, email: user.email },
            { userName: user.full_name, resetUrl: resetUrl.toString() },
          ),
          { requireDelivery: true },
        );
      } catch {
        throw new ServiceUnavailableException(
          'No pudimos enviar el correo de recuperación. Intenta nuevamente más tarde.',
        );
      }
    }
    return {
      success: true,
      message:
        'Si el correo está registrado y la cuenta está activa, recibirás un enlace para crear una nueva contraseña. El enlace vence en 30 minutos.',
    };
  }
}
