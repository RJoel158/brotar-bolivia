import { ThrottlerModule } from '@nestjs/throttler';
import { getJwtSecret } from './infrastructure/config/jwt.config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { USER_REPOSITORY_PORT } from './application/ports/user.repository.port';
import { PASSWORD_HASHER_PORT } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE_PORT } from './application/ports/token-service.port';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/adapters/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/adapters/jwt-token.service';
import { JwtStrategy } from './infrastructure/adapters/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './infrastructure/guards/optional-jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { PasswordResetTokenService } from './application/services/password-reset-token.service';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { UpdateKycStatusUseCase } from './application/use-cases/update-kyc-status.use-case';
import { UpdateUserStatusUseCase } from './application/use-cases/update-user-status.use-case';
import { SubmitKycUseCase } from './application/use-cases/submit-kyc.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { GetMyOrganizationsUseCase } from './application/use-cases/get-my-organizations.use-case';
import { GetOrganizationByIdUseCase } from './application/use-cases/get-organization-by-id.use-case';
import { JoinOrganizationByCodeUseCase } from './application/use-cases/join-organization-by-code.use-case';
import { UpdateOrganizationMemberUseCase } from './application/use-cases/update-organization-member.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization.use-case';
import { DeleteOrganizationUseCase } from './application/use-cases/delete-organization.use-case';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UserController } from './infrastructure/controllers/user.controller';
import { OrganizationController } from './infrastructure/controllers/organization.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, UserController, OrganizationController],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useClass: JwtTokenService,
    },
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    RegisterUserUseCase,
    CreateUserUseCase,
    LoginUserUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    PasswordResetTokenService,
    GetUserByIdUseCase,
    GetUsersUseCase,
    UpdateKycStatusUseCase,
    UpdateUserStatusUseCase,
    SubmitKycUseCase,
    UpdateMyProfileUseCase,
    CreateOrganizationUseCase,
    GetMyOrganizationsUseCase,
    GetOrganizationByIdUseCase,
    JoinOrganizationByCodeUseCase,
    UpdateOrganizationMemberUseCase,
    UpdateOrganizationUseCase,
    DeleteOrganizationUseCase,
  ],
  exports: [
    USER_REPOSITORY_PORT,
    PASSWORD_HASHER_PORT,
    TOKEN_SERVICE_PORT,
    GetUserByIdUseCase,
    PassportModule,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
  ],
})
export class UsersModule {}
