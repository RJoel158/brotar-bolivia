import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';
import { UserValidationRules } from '../../domain/rules/user-validation.rules';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import { PASSWORD_HASHER_PORT } from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { TOKEN_SERVICE_PORT } from '../ports/token-service.port';
import type { TokenServicePort } from '../ports/token-service.port';
import type { RegisterUserDto } from '../dto/register-user.dto';
import type { AuthResponseDto } from '../dto/auth-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
  ) {}

  public async execute(dto: RegisterUserDto): Promise<AuthResponseDto> {
    UserValidationRules.validateRawPassword(dto.password);
    try {
      UserValidationRules.validateFullName(dto.fullName);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(`El correo "${dto.email}" ya está registrado en la plataforma.`);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const roleVo = dto.role ? UserRole.fromString(dto.role) : UserRole.SPONSOR;

    const user = User.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      role: roleVo,
      kycStatus: KycStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.tokenService.generateTokens(savedUser);

    return {
      user: UserDtoMapper.toOwnerResponseDto(savedUser),
      accessToken: tokens.accessToken,
    };
  }
}
