import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import type { UpdateOrganizationDto, OrganizationResponseDto } from '../dto/organization.dto';
import { GetOrganizationByIdUseCase } from './get-organization-by-id.use-case';
import { parseOrgAddressAndSocial, serializeOrgAddressAndSocial } from '../utils/organization-social.util';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
  ) {}

  public async execute(
    currentUserId: string,
    orgId: string,
    dto: UpdateOrganizationDto,
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

    if (
      !callerMembership ||
      (callerMembership.role_in_org !== 'owner' && callerMembership.role_in_org !== 'admin')
    ) {
      throw new ForbiddenException(
        'Solo los administradores o fundadores pueden actualizar los datos y redes de la organización',
      );
    }

    const org = await this.prisma.organizations.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organización no encontrada');
    }

    // 2. Parse current address and social links
    const currentParsed = parseOrgAddressAndSocial(org.address);

    const nextAddressText =
      dto.address !== undefined ? dto.address : currentParsed.address;

    const nextSocialLinks =
      dto.socialLinks !== undefined
        ? { ...currentParsed.socialLinks, ...dto.socialLinks }
        : currentParsed.socialLinks;

    // 3. Serialize back safely
    const serializedAddress = serializeOrgAddressAndSocial(
      nextAddressText,
      nextSocialLinks,
    );

    await this.prisma.organizations.update({
      where: { id: orgId },
      data: {
        ...(dto.legalName?.trim() ? { legal_name: dto.legalName.trim() } : {}),
        address: serializedAddress,
      },
    });

    return this.getOrganizationByIdUseCase.execute(orgId, currentUserId);
  }
}
