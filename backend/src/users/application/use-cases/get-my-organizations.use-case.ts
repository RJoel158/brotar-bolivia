import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { OrganizationResponseDto } from '../dto/organization.dto';
import { parseOrgAddressAndSocial } from '../utils/organization-social.util';

@Injectable()
export class GetMyOrganizationsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(userId: string): Promise<OrganizationResponseDto[]> {
    // Find all memberships of this user
    const memberships = await this.prisma.organization_members.findMany({
      where: { user_id: userId },
      include: {
        organizations: {
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
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return memberships
      .filter((membership) => {
        const raw = membership.organizations.address;
        if (raw && raw.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.isDissolved) return false;
          } catch {
            // ignore
          }
        }
        return true;
      })
      .map((membership) => {
        const org = membership.organizations;
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
        myRole: membership.role_in_org,
        membersCount: members.length,
        members,
        campaignsCount: org.campaigns.length,
      };
    });
  }
}
