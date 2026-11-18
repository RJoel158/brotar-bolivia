import { isUUID } from 'class-validator';
import { getJwtSecret } from '../config/jwt.config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserDtoMapper } from '../../application/mappers/user-dto.mapper';
import type { OwnerUserResponseDto } from '../../application/dto/user-response.dto';
import { TokenPayload } from '../../application/ports/token-service.port';
import { USER_REPOSITORY_PORT } from '../../application/ports/user.repository.port';
import type { UserRepositoryPort } from '../../application/ports/user.repository.port';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  kycStatus: string;
  getOwnerProfile: () => OwnerUserResponseDto;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: TokenPayload): Promise<AuthenticatedUser> {
    if (!payload || typeof payload.sub !== 'string' || !isUUID(payload.sub)) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive()) {
      throw new UnauthorizedException('La cuenta no está disponible.');
    }
    return {
      // Reuse only this request's verified snapshot; no cross-request cache.
      getOwnerProfile: () => UserDtoMapper.toOwnerResponseDto(user),
      id: user.getId(),
      email: user.getEmail(),
      role: user.getRole().getValue(),
      kycStatus: user.getKycStatus().getValue(),
    };
  }
}
