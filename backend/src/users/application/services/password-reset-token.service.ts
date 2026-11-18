import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'node:crypto';
import { isUUID } from 'class-validator';
import { getJwtSecret } from '../../infrastructure/config/jwt.config';

interface ResetClaims {
  sub: string;
  purpose: string;
  version: string;
}
export const INVALID_RESET_LINK =
  'El enlace es inválido o ha vencido. Solicita uno nuevo.';

@Injectable()
export class PasswordResetTokenService {
  constructor(private readonly jwt: JwtService) {}

  private signingSecret(): string {
    // Reset tokens must never be accepted as regular access tokens.
    return createHmac('sha256', getJwtSecret())
      .update('brotar:password-reset')
      .digest('hex');
  }

  private version(passwordHash: string): string {
    return createHmac('sha256', this.signingSecret())
      .update(passwordHash)
      .digest('hex');
  }

  public issue(userId: string, passwordHash: string): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: userId,
        purpose: 'password-reset',
        version: this.version(passwordHash),
      },
      { secret: this.signingSecret(), expiresIn: '30m', algorithm: 'HS256' },
    );
  }

  public async verify(token: string): Promise<ResetClaims> {
    try {
      const claims = await this.jwt.verifyAsync<ResetClaims>(token, {
        secret: this.signingSecret(),
        algorithms: ['HS256'],
      });
      if (
        !isUUID(claims.sub) ||
        claims.purpose !== 'password-reset' ||
        typeof claims.version !== 'string'
      ) {
        throw new Error('Invalid claims');
      }
      return claims;
    } catch {
      throw new BadRequestException(INVALID_RESET_LINK);
    }
  }

  public matchesPassword(claims: ResetClaims, passwordHash: string): boolean {
    return claims.version === this.version(passwordHash);
  }
}
