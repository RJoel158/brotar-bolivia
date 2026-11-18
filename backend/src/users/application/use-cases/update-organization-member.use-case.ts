import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { UpdateMemberRoleDto, OrganizationResponseDto } from '../dto/organization.dto';
import { GetOrganizationByIdUseCase } from './get-organization-by-id.use-case';

@Injectable()
export class UpdateOrganizationMemberUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
  ) {}

  public async updateRole(
    currentUserId: string,
    orgId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<OrganizationResponseDto> {
    // 1. Verify caller has owner or admin role
    const callerMembership = await this.prisma.organization_members.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: orgId,
          user_id: currentUserId,
        },
      },
    });

    if (!callerMembership || (callerMembership.role_in_org !== 'owner' && callerMembership.role_in_org !== 'admin')) {
      throw new ForbiddenException('Solo los administradores o fundadores pueden cambiar roles en la organización');
    }

    const targetMembership = await this.prisma.organization_members.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: orgId,
          user_id: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('El miembro no pertenece a esta organización');
    }

    if (targetMembership.role_in_org === 'owner') {
      throw new BadRequestException('No se puede modificar el rol del fundador');
    }

    // 2. Update role
    await this.prisma.organization_members.updateMany({
      where: {
        organization_id: orgId,
        user_id: targetUserId,
      },
      data: {
        role_in_org: dto.role,
      },
    });

    return this.getOrganizationByIdUseCase.execute(orgId, currentUserId);
  }

  public async removeMember(
    currentUserId: string,
    orgId: string,
    targetUserId: string,
  ): Promise<OrganizationResponseDto> {
    const callerMembership = await this.prisma.organization_members.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: orgId,
          user_id: currentUserId,
        },
      },
    });

    if (!callerMembership) {
      throw new ForbiddenException('No formas parte de esta organización');
    }

    const targetMembership = await this.prisma.organization_members.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: orgId,
          user_id: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('El miembro no pertenece a esta organización o ya fue removido');
    }

    const isSelf = currentUserId === targetUserId;
    const isOwnerOrAdmin = callerMembership.role_in_org === 'owner' || callerMembership.role_in_org === 'admin';

    if (!isSelf && !isOwnerOrAdmin) {
      throw new ForbiddenException('No tienes permisos para remover a este miembro');
    }

    // If caller is admin, they cannot remove the owner
    if (!isSelf && callerMembership.role_in_org === 'admin' && targetMembership.role_in_org === 'owner') {
      throw new ForbiddenException('Los administradores no pueden remover al fundador del equipo');
    }

    // If owner leaves, make sure they aren't the sole owner
    if (isSelf && callerMembership.role_in_org === 'owner') {
      const allOwners = await this.prisma.organization_members.count({
        where: {
          organization_id: orgId,
          role_in_org: 'owner',
        },
      });

      if (allOwners <= 1) {
        throw new BadRequestException('Como único fundador, debes transferir el rol de propietario antes de salir de la organización');
      }
    }

    await this.prisma.organization_members.deleteMany({
      where: {
        organization_id: orgId,
        user_id: targetUserId,
      },
    });

    return this.getOrganizationByIdUseCase.execute(orgId, isSelf ? undefined : currentUserId);
  }
}
