import type { AuthenticatedUser } from '../adapters/jwt.strategy';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { UpdateKycStatusUseCase } from '../../application/use-cases/update-kyc-status.use-case';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UpdateUserStatusUseCase } from '../../application/use-cases/update-user-status.use-case';
import { SubmitKycUseCase } from '../../application/use-cases/submit-kyc.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { UpdateKycHttpDto, FilterUsersHttpDto } from './dto/update-kyc.http-dto';
import { CreateUserHttpDto } from './dto/create-user.http-dto';
import { UpdateUserStatusHttpDto } from './dto/update-user-status.http-dto';
import { SubmitKycHttpDto } from './dto/submit-kyc.http-dto';
import type {
  OwnerUserResponseDto,
  UserResponseDto,
} from '../../application/dto/user-response.dto';
import { PaginatedUsersResponseDto } from '../../application/dto/update-kyc.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UserController {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateKycStatusUseCase: UpdateKycStatusUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly submitKycUseCase: SubmitKycUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  public async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<OwnerUserResponseDto> {
    return user.getOwnerProfile();
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  public async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ): Promise<OwnerUserResponseDto> {
    return this.updateMyProfileUseCase.execute(userId, dto);
  }

  @Post('me/kyc')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async submitMyKyc(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitKycHttpDto,
  ): Promise<OwnerUserResponseDto> {
    return this.submitKycUseCase.execute(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async findAll(@Query() query: FilterUsersHttpDto): Promise<PaginatedUsersResponseDto> {
    return this.getUsersUseCase.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async create(@Body() dto: CreateUserHttpDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async findById(
    @Param('id') id: string,
    @CurrentUser() viewer: { id: string; role: string },
  ): Promise<UserResponseDto | OwnerUserResponseDto> {
    return this.getUserByIdUseCase.execute(id, { id: viewer.id, role: viewer.role });
  }

  @Patch(':id/kyc-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async updateKyc(
    @Param('id') id: string,
    @Body() dto: UpdateKycHttpDto,
  ): Promise<UserResponseDto> {
    return this.updateKycStatusUseCase.execute(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusHttpDto,
  ): Promise<UserResponseDto> {
    return this.updateUserStatusUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  public async deactivate(@Param('id') id: string): Promise<UserResponseDto> {
    return this.updateUserStatusUseCase.execute(id, { status: 'inactive' });
  }
}
