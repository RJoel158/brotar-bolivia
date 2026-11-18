import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, Optional } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { configureDatabaseUrl } from './prisma.config';

export const PRISMA_CLIENT_OPTIONS = Symbol('PRISMA_CLIENT_OPTIONS');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  [key: string]: any;
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @Optional() @Inject(PRISMA_CLIENT_OPTIONS) options: Prisma.PrismaClientOptions = {},
  ) {
    const { datasources, datasourceUrl, ...rest } = options;
    super({
      ...rest,
      datasources: { db: { url: configureDatabaseUrl(datasourceUrl ?? datasources?.db?.url ?? process.env.DATABASE_URL) } },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected successfully to PostgreSQL database via Prisma');
    } catch (error) {
      this.logger.warn(`Could not connect to PostgreSQL on startup: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }
}
