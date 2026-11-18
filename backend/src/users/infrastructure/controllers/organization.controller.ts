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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateOrganizationDto, JoinOrganizationDto, UpdateMemberRoleDto, UpdateOrganizationDto, OrganizationResponseDto } from '../../application/dto/organization.dto';
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization.use-case';
import { GetMyOrganizationsUseCase } from '../../application/use-cases/get-my-organizations.use-case';
import { GetOrganizationByIdUseCase } from '../../application/use-cases/get-organization-by-id.use-case';
import { JoinOrganizationByCodeUseCase } from '../../application/use-cases/join-organization-by-code.use-case';
import { UpdateOrganizationMemberUseCase } from '../../application/use-cases/update-organization-member.use-case';
import { UpdateOrganizationUseCase } from '../../application/use-cases/update-organization.use-case';
import { DeleteOrganizationUseCase } from '../../application/use-cases/delete-organization.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('organizations')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getMyOrganizationsUseCase: GetMyOrganizationsUseCase,
    private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
    private readonly joinOrganizationByCodeUseCase: JoinOrganizationByCodeUseCase,
    private readonly updateOrganizationMemberUseCase: UpdateOrganizationMemberUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
  ) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  public async getMyOrganizations(@CurrentUser('id') userId: string): Promise<OrganizationResponseDto[]> {
    return this.getMyOrganizationsUseCase.execute(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  public async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.createOrganizationUseCase.execute(userId, dto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async joinByCode(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.joinOrganizationByCodeUseCase.execute(userId, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async getById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<OrganizationResponseDto> {
    return this.getOrganizationByIdUseCase.execute(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  public async updateOrganization(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.updateOrganizationUseCase.execute(userId, id, dto);
  }

  @Patch(':id/members/:targetUserId')
  @UseGuards(JwtAuthGuard)
  public async updateMemberRole(
    @Param('id') id: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<OrganizationResponseDto> {
    return this.updateOrganizationMemberUseCase.updateRole(currentUserId, id, targetUserId, dto);
  }

  @Delete(':id/members/:targetUserId')
  @UseGuards(JwtAuthGuard)
  public async removeMember(
    @Param('id') id: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<OrganizationResponseDto> {
    return this.updateOrganizationMemberUseCase.removeMember(currentUserId, id, targetUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  public async deleteOrganization(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<void> {
    return this.deleteOrganizationUseCase.execute(currentUserId, id);
  }
}
