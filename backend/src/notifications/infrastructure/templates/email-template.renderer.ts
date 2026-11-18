import { Injectable } from '@nestjs/common';
import type { Notification } from '../../domain/notification.base';

@Injectable()
export class EmailTemplateRenderer {
  public render(notification: Notification): { html: string; text: string } {
    const key = notification.getTemplateKey();
    const payload = notification.getPayload();
    const recipientName = notification.recipient.name || 'Usuario Brotar';

    switch (key) {
      case 'KYC_APPROVED':
        return this.renderKycApproved(recipientName, payload);
      case 'KYC_REQUIRES_DOCS':
        return this.renderKycRequiresDocs(recipientName, payload);
      case 'KYC_REJECTED':
        return this.renderKycRejected(recipientName, payload);
      case 'PASSWORD_RECOVERY':
        return this.renderPasswordRecovery(recipientName, payload);
      default:
        return this.renderGeneric(recipientName, notification.getSubject(), payload);
    }
  }

  private wrapBaseLayout(title: string, bodyContent: string, ctaButton?: { text: string; url: string }): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header with Brand Green -->
          <tr>
            <td style="background: linear-gradient(135deg, #044e42 0%, #065f46 100%); padding: 32px 30px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 999px; margin-bottom: 12px;">
                <span style="color: #a7f3d0; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Brotar Bolivia • Crowdfunding Verde</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${title}</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              ${bodyContent}

              ${
                ctaButton
                  ? `
              <div style="margin: 32px 0 10px 0; text-align: center;">
                <a href="${ctaButton.url}" target="_blank" style="display: inline-block; background-color: #044e42; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(4, 78, 66, 0.25);">
                  ${ctaButton.text} &rarr;
                </a>
              </div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">
                Este es un mensaje automático del sistema de auditoría de <strong>Brotar Bolivia</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2026 Brotar Bolivia. Impulsando proyectos ambientales y sostenibles.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private renderKycApproved(name: string, payload: Record<string, unknown>): { html: string; text: string } {
    const docId = (payload.documentId as string) || '';
    const dashboardUrl = (payload.dashboardUrl as string) || 'http://localhost:5173';

    const body = `
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${name}</strong>,
      </p>
      <div style="background-color: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🌱</span>
          <strong style="color: #065f46; font-size: 16px;">¡Identidad Validada con Éxito!</strong>
        </div>
        <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0; line-height: 1.5;">
          El equipo de administración de Brotar ha verificado minuciosamente tu documentación ${docId ? `(Cédula / NIT: <strong>${docId}</strong>)` : ''}. Tu cuenta cuenta con verificación completa de identidad.
        </p>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        A partir de este momento puedes acceder a todas las funcionalidades avanzadas: publicar proyectos de impacto ecológico, recibir aportes o patrocinar iniciativas verdes en nuestra plataforma.
      </p>
    `;

    const html = this.wrapBaseLayout(
      '¡Tu Identidad ha sido Verificada!',
      body,
      { text: 'Ir a mi Panel de Control', url: dashboardUrl },
    );

    const text = `Hola ${name},\n\n¡Tu identidad ha sido validada con éxito en Brotar Bolivia!\nTu cuenta cuenta con verificación completa de identidad.\n\nAccede a tu panel en: ${dashboardUrl}\n\n© 2026 Brotar Bolivia.`;

    return { html, text };
  }

  private renderKycRequiresDocs(name: string, payload: Record<string, unknown>): { html: string; text: string } {
    const notes = (payload.notes as string) || 'Por favor sube una imagen nítida de tu documento de identidad.';
    const resubmitUrl = (payload.resubmitUrl as string) || 'http://localhost:5173';

    const body = `
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        Hemos revisado tu expediente de verificación en Brotar, pero requerimos que actualices o complementes tu documentación para poder finalizar la auditoría.
      </p>

      <div style="background-color: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #c2410c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Observaciones del Auditor:</strong>
        <p style="color: #9a3412; font-size: 15px; margin: 8px 0 0 0; line-height: 1.5; font-style: italic;">
          "${notes}"
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0;">
        Por favor ingresa a tu panel y adjunta la información solicitada a la brevedad para habilitar tu cuenta.
      </p>
    `;

    const html = this.wrapBaseLayout(
      'Documentación Adicional Requerida',
      body,
      { text: 'Subir Documentación Solicitada', url: resubmitUrl },
    );

    const text = `Hola ${name},\n\nSe requiere documentación adicional para tu verificación en Brotar.\nObservaciones: "${notes}"\n\nSube los documentos solicitados en: ${resubmitUrl}\n\n© 2026 Brotar Bolivia.`;

    return { html, text };
  }

  private renderKycRejected(name: string, payload: Record<string, unknown>): { html: string; text: string } {
    const reason = (payload.rejectionReason as string) || 'La documentación no cumplió con las políticas de validación.';
    const supportUrl = (payload.supportUrl as string) || 'http://localhost:5173';

    const body = `
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        Te informamos que tu solicitud de verificación de identidad en Brotar no ha podido ser aprobada tras la auditoría legal de documentos.
      </p>

      <div style="background-color: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #be123c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Motivo de Rechazo:</strong>
        <p style="color: #9f1239; font-size: 15px; margin: 8px 0 0 0; line-height: 1.5;">
          "${reason}"
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0;">
        Si consideras que esto es un error o cuentas con la documentación rectificada, puedes reiniciar el proceso o ponerte en contacto con soporte.
      </p>
    `;

    const html = this.wrapBaseLayout(
      'Actualización de tu Solicitud de Verificación',
      body,
      { text: 'Ir a la Plataforma', url: supportUrl },
    );

    const text = `Hola ${name},\n\nTu solicitud de verificación en Brotar ha sido rechazada.\nMotivo: "${reason}"\n\nIngresa a: ${supportUrl}\n\n© 2026 Brotar Bolivia.`;

    return { html, text };
  }

  private renderPasswordRecovery(name: string, payload: Record<string, unknown>): { html: string; text: string } {
    const resetUrl = String(payload.resetUrl || '');
    const safeName = name.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
    const safeUrl = resetUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const body = `
      <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${safeName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Recibimos una solicitud para recuperar tu cuenta en Brotar Bolivia.
        Usa el botón para elegir una nueva contraseña.
      </p>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0; color: #065f46;">
        Este enlace vence en <strong>30 minutos</strong> y solo puede utilizarse una vez.
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
        Si no solicitaste este cambio, ignora este correo. Tu contraseña actual sigue funcionando.
      </p>
    `;
    const html = this.wrapBaseLayout('Recupera tu cuenta', body, { text: 'Crear nueva contraseña', url: safeUrl });
    const text = `Hola ${name},\n\nPara crear una nueva contraseña en Brotar Bolivia, abre este enlace:\n${resetUrl}\n\nVence en 30 minutos y solo puede usarse una vez. Si no solicitaste este cambio, ignora este correo. Tu contraseña actual sigue funcionando.`;
    return { html, text };
  }

  private renderGeneric(name: string, subject: string, payload: Record<string, unknown>): { html: string; text: string } {
    const message = (payload.message as string) || 'Tienes una nueva notificación en Brotar.';
    const body = `
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        ${message}
      </p>
    `;
    const html = this.wrapBaseLayout(subject, body);
    const text = `Hola ${name},\n\n${message}\n\n© 2026 Brotar Bolivia.`;
    return { html, text };
  }
}
