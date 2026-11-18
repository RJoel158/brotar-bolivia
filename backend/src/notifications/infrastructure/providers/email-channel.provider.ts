import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Notification } from '../../domain/notification.base';
import type { NotificationChannelType } from '../../domain/notification.types';
import type { NotificationChannelProvider } from '../../application/ports/notification-channel.provider';
import { EmailTemplateRenderer } from '../templates/email-template.renderer';

@Injectable()
export class EmailChannelProvider implements NotificationChannelProvider {
  public readonly channel: NotificationChannelType = 'EMAIL';
  private readonly logger = new Logger(EmailChannelProvider.name);
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor(private readonly templateRenderer: EmailTemplateRenderer) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    // Gmail app passwords are often pasted with spaces; both forms are accepted.
    const pass = process.env.SMTP_PASS?.replace(/\s+/g, '') ?? process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      this.isConfigured = true;
      this.logger.log(`SMTP Transporter configurado exitosamente en ${host}:${port} como ${user}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'Credenciales SMTP no detectadas en variables de entorno (SMTP_HOST/SMTP_USER/SMTP_PASS). Se usará el emulador en consola para desarrollo.',
      );
    }
  }

  public assertAvailable(): void {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('El servicio SMTP no está configurado.');
    }
  }

  public async send(notification: Notification): Promise<void> {
    const { email, name } = notification.recipient;
    if (!email) {
      throw new Error('El destinatario no tiene correo electrónico.');
    }

    const subject = notification.getSubject();
    const { html, text } = this.templateRenderer.render(notification);

    const userEmail = process.env.SMTP_USER || 'notificaciones@brotar.bo';
    const rawFrom = (process.env.SMTP_FROM || '').trim();
    let fromAddress: string;
    if (rawFrom.includes('@')) {
      fromAddress = rawFrom;
    } else if (rawFrom.length > 0) {
      fromAddress = `"${rawFrom.replace(/"/g, '')}" <${userEmail}>`;
    } else {
      fromAddress = `"Brotar Bolivia" <${userEmail}>`;
    }

    if (this.isConfigured && this.transporter) {
      try {
        const result = await this.transporter.sendMail({
          from: fromAddress,
          to: `"${name}" <${email}>`,
          subject,
          text,
          html,
        });
        if (!result.accepted?.length) throw new Error('El servidor SMTP no aceptó el destinatario.');
        this.logger.log(`Correo enviado exitosamente vía SMTP a ${email} [Asunto: "${subject}"]`);
      } catch (error) {
        this.logger.error(`Error al enviar correo vía SMTP a ${email}:`, error);
        throw error;
      }
    } else {
      // Recovery links grant account access and must never be printed to logs.
      if (notification.getTemplateKey() === 'PASSWORD_RECOVERY') this.assertAvailable();
      // Development mock logger
      this.logger.log(`==================== [SIMULADOR DE EMAIL BROTAR] ====================`);
      this.logger.log(`De: ${fromAddress}`);
      this.logger.log(`Para: "${name}" <${email}>`);
      this.logger.log(`Asunto: ${subject}`);
      this.logger.log(`Canal: EMAIL | Plantilla: ${notification.getTemplateKey()}`);
      this.logger.log(`-------------------- CONTENIDO DE TEXTO --------------------`);
      this.logger.log(text);
      this.logger.log(`====================================================================`);
    }
  }
}
