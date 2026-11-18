import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { CreateOrganizationDto, OrganizationResponseDto } from '../dto/organization.dto';
import { containsSensitiveWords } from '../utils/sensitive-words.util';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(userId: string, dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    if (containsSensitiveWords(dto.legalName)) {
      throw new BadRequestException('El nombre de la organización contiene lenguaje sensible o no apropiado.');
    }

    // Generate unique tax_id if not provided
    const cleanTaxId = dto.taxId?.trim() || `NIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Check if taxId already exists
    const existing = await this.prisma.organizations.findUnique({
      where: { tax_id: cleanTaxId },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una organización registrada con este identificador fiscal (NIT/RUT)');
    }

    // Create organization and automatically add the creator user as owner
    const organization = await this.prisma.organizations.create({
      data: {
        legal_name: dto.legalName.trim(),
        tax_id: cleanTaxId,
        address: dto.address?.trim() || null,
        organization_members: {
          create: {
            user_id: userId,
            role_in_org: 'owner',
          },
        },
      },
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
      },
    });

    const inviteCode = `BROTAR-${organization.id.substring(0, 6).toUpperCase()}`;

    const members = organization.organization_members.map((m) => ({
      userId: m.users.id,
      fullName: m.users.full_name,
      email: m.users.email,
      avatarUrl: m.users.avatar_url,
      roleInOrg: m.role_in_org,
      joinedAt: m.created_at.toISOString(),
    }));

    return {
      id: organization.id,
      legalName: organization.legal_name,
      taxId: organization.tax_id,
      address: organization.address,
      inviteCode,
      inviteLink: `/organizaciones/unirse?codigo=${inviteCode}`,
      createdAt: organization.created_at.toISOString(),
      myRole: 'owner',
      membersCount: members.length,
      members,
      campaignsCount: 0,
    };
  }
}
