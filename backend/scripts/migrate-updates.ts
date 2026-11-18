import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  await prisma.$connect();
  console.log('Connected!');

  console.log('Creating visibility_scope type if not exists...');
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE visibility_scope AS ENUM ('public', 'supporters_only');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('Creating campaign_updates table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS campaign_updates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      title VARCHAR(200) NOT NULL,
      body TEXT NOT NULL,
      image_url TEXT,
      visibility visibility_scope NOT NULL DEFAULT 'public',
      published_at TIMESTAMPTZ(6),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  `);

  console.log('Creating indexes on campaign_updates...');
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id ON campaign_updates(campaign_id);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_campaign_updates_created_at ON campaign_updates(created_at);
  `);

  console.log('Table campaign_updates created and indexed successfully!');
}

main()
  .catch((e) => {
    console.error('Error migrating updates table:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
