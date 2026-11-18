import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import { PrismaService } from './prisma.service';

describe('Application Prisma dependency scope', () => {
  it('shares one provider across all database consumers', async () => {
    process.env.JWT_SECRET ||= 'test-only-key-for-dependency-graph';
    const { AppModule } = await import('../../app.module');
    const shared = {};
    const app = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(shared).compile();
    try {
      let registrations = 0;
      let consumers = 0;
      for (const module of app.get(ModulesContainer).values()) {
        for (const [token, provider] of module.providers) {
          if (token === PrismaService) {
            registrations++;
            expect(provider.instance).toBe(shared);
          }
          const instance: unknown = provider.instance;
          if (instance && typeof instance === 'object' && 'prisma' in instance) {
            consumers++;
            expect(instance.prisma).toBe(shared);
          }
        }
      }
      expect(registrations).toBe(1);
      expect(consumers).toBeGreaterThanOrEqual(19);
    } finally {
      await app.close();
    }
  });
});
