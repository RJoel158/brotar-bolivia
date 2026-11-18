import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import { PASSWORD_HASHER_PORT } from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { TOKEN_SERVICE_PORT } from '../ports/token-service.port';
import type { TokenServicePort } from '../ports/token-service.port';
import type { LoginUserDto } from '../dto/login-user.dto';
import type { AuthResponseDto } from '../dto/auth-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
  ) {}

  public async execute(dto: LoginUserDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas. Compruebe su correo y contraseña.');
    }

    const isMatch = await this.passwordHasher.compare(dto.password, user.getPasswordHash());
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas. Compruebe su correo y contraseña.');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('La cuenta no está disponible.');
    }

    const tokens = await this.tokenService.generateTokens(user);

    return {
      user: UserDtoMapper.toOwnerResponseDto(user),
      accessToken: tokens.accessToken,
    };
  }
}
