import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { OrganizationResponseDto } from '../dto/organization.dto';
import { parseOrgAddressAndSocial } from '../utils/organization-social.util';

@Injectable()
export class GetOrganizationByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(orgId: string, currentUserId?: string): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organizations.findUnique({
      where: { id: orgId },
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

    if (!org) {
      throw new NotFoundException('Organización no encontrada');
    }

    if (org.address && org.address.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(org.address);
        if (parsed.isDissolved) {
          throw new NotFoundException('Esta organización ha sido disuelta');
        }
      } catch (e) {
        if (e instanceof NotFoundException) throw e;
      }
    }

    const myMembership = currentUserId
      ? org.organization_members.find((m) => m.user_id === currentUserId)
      : undefined;

    const inviteCode = `BROTAR-${org.id.substring(0, 6).toUpperCase()}`;

    const members = org.organization_members.map((m) => ({
      userId: m.users.id,
      fullName: m.users.full_name,
      email: m.users.email,
      avatarUrl: m.users.avatar_url,
      roleInOrg: m.role_in_org,
      joinedAt: m.created_at.toISOString(),
    }));

    const { address: cleanAddress, socialLinks } = parseOrgAddressAndSocial(org.address);

    return {
      id: org.id,
      legalName: org.legal_name,
      taxId: org.tax_id,
      address: cleanAddress,
      socialLinks,
      inviteCode,
      inviteLink: `/organizaciones/unirse?codigo=${inviteCode}`,
      createdAt: org.created_at.toISOString(),
      myRole: myMembership?.role_in_org,
      membersCount: members.length,
      members,
      campaignsCount: org.campaigns.length,
    };
  }
}
