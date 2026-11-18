import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domain/entities/user.entity';
import {
  AuthTokens,
  TokenPayload,
  TokenServicePort,
} from '../../application/ports/token-service.port';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  public async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole().getValue(),
      kycStatus: user.getKycStatus().getValue(),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
    };
  }

  public async verifyToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token);
  }
}
