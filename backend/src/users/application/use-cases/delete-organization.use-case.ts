import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';

@Injectable()
export class DeleteOrganizationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  public async execute(userId: string, orgId: string): Promise<void> {
    const org = await this.prisma.organizations.findUnique({
      where: { id: orgId },
      include: {
        campaigns: {
          select: { id: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('La organización no existe');
    }

    const membership = await this.prisma.organization_members.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: orgId,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role_in_org !== 'owner') {
      throw new ForbiddenException('Solo el fundador o propietario puede disolver la organización');
    }

    if (org.campaigns.length > 0) {
      throw new BadRequestException(
        'No se puede disolver una organización con campañas vinculadas. Debes transferir o finalizar las campañas primero.',
      );
    }

    // Soft delete (borrado lógico): mark organization as dissolved in metadata
    let addressPayload: Record<string, unknown> = {};
    if (org.address && org.address.trim().startsWith('{')) {
      try {
        addressPayload = JSON.parse(org.address);
      } catch {
        addressPayload = { text: org.address };
      }
    } else if (org.address) {
      addressPayload = { text: org.address };
    }

    addressPayload.isDissolved = true;
    addressPayload.dissolvedAt = new Date().toISOString();
    addressPayload.dissolvedByUserId = userId;

    await this.prisma.organizations.update({
      where: { id: orgId },
      data: {
        address: JSON.stringify(addressPayload),
      },
    });

    // Remove active memberships so it no longer appears in members' dashboards
    await this.prisma.organization_members.deleteMany({
      where: { organization_id: orgId },
    });
  }
}
