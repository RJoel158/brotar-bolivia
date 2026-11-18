import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { RegisterUserHttpDto } from './dto/register-user.http-dto';
import { LoginUserHttpDto } from './dto/login-user.http-dto';
import { ForgotPasswordHttpDto } from './dto/forgot-password.http-dto';
import { AuthResponseDto } from '../../application/dto/auth-response.dto';
import { ForgotPasswordResponseDto } from '../../application/dto/forgot-password.dto';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordHttpDto } from './dto/reset-password.http-dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  public async register(@Body() dto: RegisterUserHttpDto): Promise<AuthResponseDto> {
    return this.registerUserUseCase.execute(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() dto: LoginUserHttpDto): Promise<AuthResponseDto> {
    return this.loginUserUseCase.execute(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(
    @Body() dto: ForgotPasswordHttpDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(@Body() dto: ResetPasswordHttpDto): Promise<ForgotPasswordResponseDto> {
    return this.resetPasswordUseCase.execute(dto);
  }
}
