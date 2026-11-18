import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/persistence/prisma.service';
import { User } from '../../domain/entities/user.entity';
import {
  PaginatedUsersResult,
  UserFilterCriteria,
  UserRepositoryPort,
} from '../../application/ports/user.repository.port';
import {
  PrismaUserMapper,
  type PrismaUserModel,
  type PrismaUserRole,
  type PrismaKycStatus,
} from '../adapters/prisma-user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async save(user: User): Promise<User> {
    const data = PrismaUserMapper.toPersistence(user);

    const record = await this.prisma.users.create({
      data,
    });

    await this.syncMustChangeFlag(user);
    return this.toDomainWithFlag(record);
  }

  public async findById(id: string): Promise<User | null> {
    const record = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return this.toDomainWithFlag(record);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!record) {
      return null;
    }

    return this.toDomainWithFlag(record);
  }

  public async findAll(criteria?: UserFilterCriteria): Promise<PaginatedUsersResult> {
    const page = Math.max(1, criteria?.page || 1);
    const limit = Math.min(100, Math.max(1, criteria?.limit || 10));
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (criteria?.status && criteria.status !== 'all') {
      where.status = criteria.status.toLowerCase().trim();
    } else if (!criteria?.status) {
      where.status = 'active';
    }

    if (criteria?.role) {
      where.role = criteria.role.toLowerCase().trim() as PrismaUserRole;
    }
    if (criteria?.kycStatus) {
      where.kyc_status = criteria.kycStatus.toLowerCase().trim() as PrismaKycStatus;
    }
    if (criteria?.search) {
      const term = criteria.search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { full_name: { contains: term, mode: 'insensitive' } },
        { document_id: { contains: term, mode: 'insensitive' } },
        { organization_name: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const flags = await this.prisma.user_must_change_password.findMany({
      where: { user_id: { in: records.map((r) => r.id) } },
      select: { user_id: true },
    });
    const flagSet = new Set(flags.map((f) => f.user_id));

    return {
      users: records.map((record: PrismaUserModel) =>
        PrismaUserMapper.toDomain({
          ...record,
          must_change_password: flagSet.has(record.id),
        }),
      ),
      total,
    };
  }

  public async update(user: User): Promise<User> {
    const data = PrismaUserMapper.toPersistence(user);
    const { id: _id, ...updateData } = data;

    const record = await this.prisma.users.update({
      where: { id: user.getId() },
      data: updateData,
    });

    await this.syncMustChangeFlag(user);
    return this.toDomainWithFlag(record);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.user_must_change_password.deleteMany({ where: { user_id: id } });
    await this.prisma.users.delete({
      where: { id },
    });
  }

  private async toDomainWithFlag(record: PrismaUserModel): Promise<User> {
    const flag = await this.prisma.user_must_change_password.findUnique({
      where: { user_id: record.id },
    });
    return PrismaUserMapper.toDomain({
      ...record,
      must_change_password: Boolean(flag),
    });
  }

  private async syncMustChangeFlag(user: User): Promise<void> {
    // Solo upsert. Nunca borrar aquí: un update de KYC/perfil con entidad
    // sin el flag en memoria borraba el obligatorio por accidente.
    if (!user.getMustChangePassword()) {
      return;
    }

    await this.prisma.user_must_change_password.upsert({
      where: { user_id: user.getId() },
      create: { user_id: user.getId() },
      update: {},
    });
  }
}
