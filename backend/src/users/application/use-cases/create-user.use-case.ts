import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';
import { UserValidationRules } from '../../domain/rules/user-validation.rules';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import { PASSWORD_HASHER_PORT } from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { UserResponseDto } from '../dto/user-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  public async execute(dto: CreateUserDto): Promise<UserResponseDto> {
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
    const kycVo = dto.kycStatus ? KycStatus.fromString(dto.kycStatus) : KycStatus.PENDING;

    const user = User.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      role: roleVo,
      kycStatus: kycVo,
      documentId: dto.documentId,
      documentType: dto.documentType || (dto.role === 'creator' ? 'NIT' : 'CI'),
      organizationName: dto.organizationName,
      avatarUrl: dto.avatarUrl,
      // Cuentas creadas por admin usan clave temporal: obligar cambio al primer login.
      mustChangePassword: true,
    });

    const savedUser = await this.userRepository.save(user);
    return UserDtoMapper.toResponseDto(savedUser);
  }
}
