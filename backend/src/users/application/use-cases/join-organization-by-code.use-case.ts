import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { JoinOrganizationDto, OrganizationResponseDto } from '../dto/organization.dto';

@Injectable()
export class JoinOrganizationByCodeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(userId: string, dto: JoinOrganizationDto): Promise<OrganizationResponseDto> {
    const rawCode = dto.code.trim().toUpperCase();
    const cleanPrefix = rawCode
      .replace(/^BROTAR[-_\s]*/i, '')
      .replace(/^TEAM[-_\s]*/i, '')
      .replace(/[\s-]+/g, '')
      .trim();

    // 1. Search for organization by prefix of ID, exact ID, or taxId
    const allOrgs = await this.prisma.organizations.findMany({
      include: {
        organization_members: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
        campaigns: {
          select: {
            id: true,
          },
        },
      },
    });

    const targetOrg = allOrgs.find((org) => {
      const orgPrefix = org.id.substring(0, 6).toUpperCase();
      const orgCleanId = org.id.replace(/[\s-]+/g, '').toUpperCase();
      const orgTax = org.tax_id.replace(/[\s-]+/g, '').toUpperCase();
      const rawClean = rawCode.replace(/[\s-]+/g, '');

      return (
        orgPrefix === cleanPrefix ||
        orgPrefix.startsWith(cleanPrefix) ||
        cleanPrefix.startsWith(orgPrefix) ||
        orgCleanId === rawClean ||
        orgCleanId.startsWith(rawClean) ||
        orgTax === rawClean ||
        orgTax === cleanPrefix
      );
    });

    if (!targetOrg) {
      throw new NotFoundException('Código de invitación no válido o la organización no existe');
    }

    // 2. Check if already a member
    const existingMembership = targetOrg.organization_members.find((m) => m.user_id === userId);
    let myRole = existingMembership?.role_in_org;

    if (!existingMembership) {
      // Add member
      await this.prisma.organization_members.create({
        data: {
          organization_id: targetOrg.id,
          user_id: userId,
          role_in_org: 'member',
        },
      });
      myRole = 'member';
    }

    // Re-fetch updated members
    const updatedMembers = await this.prisma.organization_members.findMany({
      where: { organization_id: targetOrg.id },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    const inviteCode = `BROTAR-${targetOrg.id.substring(0, 6).toUpperCase()}`;

    const members = updatedMembers.map((m) => ({
      userId: m.users.id,
      fullName: m.users.full_name,
      email: m.users.email,
      avatarUrl: m.users.avatar_url,
      roleInOrg: m.role_in_org,
      joinedAt: m.created_at.toISOString(),
    }));

    const isAlreadyMember = Boolean(existingMembership);

    return {
      id: targetOrg.id,
      legalName: targetOrg.legal_name,
      taxId: targetOrg.tax_id,
      address: targetOrg.address,
      inviteCode,
      inviteLink: `/organizaciones/unirse?codigo=${inviteCode}`,
      createdAt: targetOrg.created_at.toISOString(),
      myRole,
      membersCount: members.length,
      members,
      campaignsCount: targetOrg.campaigns.length,
      alreadyMember: isAlreadyMember,
    };
  }
}
