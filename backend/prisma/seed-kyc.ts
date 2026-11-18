import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KYC & KYB users into PostgreSQL AlwaysData...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const kycUsers = [
    {
      email: 'admin@brotar.bo',
      password_hash: passwordHash,
      full_name: 'Ana Delgado',
      phone: '+591 70000000',
      role: 'admin' as const,
      kyc_status: 'verified' as const,
      document_id: 'CI 98765432 LP',
      document_type: 'CI',
      organization_name: 'Brotar Bolivia Administración',
      kyc_submitted_at: new Date('2026-01-01T00:00:00Z'),
      created_at: new Date('2026-01-01T00:00:00Z'),
      document_front_url: null,
      document_back_url: null,
    },
    {
      email: 'ana.flores@brotar.bo',
      password_hash: passwordHash,
      full_name: 'Ana Flores Mamani',
      phone: '+591 71478046',
      role: 'sponsor' as const,
      kyc_status: 'pending' as const,
      document_id: 'CI 14780462 LP',
      document_type: 'CI',
      organization_name: null,
      kyc_submitted_at: new Date('2026-10-12T10:30:00Z'),
      created_at: new Date('2026-10-12T10:30:00Z'),
      document_front_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      document_back_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    },
    {
      email: 'benjamin.limachi@brotar.bo',
      password_hash: passwordHash,
      full_name: 'Benjamin Limachi Flores',
      phone: '+591 71278789',
      role: 'sponsor' as const,
      kyc_status: 'requires_documentation' as const,
      document_id: 'CI 12787892 CB',
      document_type: 'CI',
      organization_name: null,
      kyc_submitted_at: new Date('2026-10-01T14:15:00Z'),
      created_at: new Date('2026-10-01T14:15:00Z'),
      kyc_notes: 'Falta foto del reverso del carnet de identidad.',
      document_front_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      document_back_url: null,
    },
    {
      email: 'samir.restrepo@brotar.bo',
      password_hash: passwordHash,
      full_name: 'Samir Restrepo Valeriano',
      phone: '+591 71278012',
      role: 'sponsor' as const,
      kyc_status: 'pending' as const,
      document_id: 'CI 12780122 LP',
      document_type: 'CI',
      organization_name: null,
      kyc_submitted_at: new Date('2026-10-21T09:00:00Z'),
      created_at: new Date('2026-10-21T09:00:00Z'),
      document_front_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      document_back_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    },
    {
      email: 'romulo.torres@brotar.bo',
      password_hash: passwordHash,
      full_name: 'Romulo Torres',
      phone: '+591 71480462',
      role: 'sponsor' as const,
      kyc_status: 'pending' as const,
      document_id: 'CI 1480462 SC',
      document_type: 'CI',
      organization_name: null,
      kyc_submitted_at: new Date('2026-10-16T16:45:00Z'),
      created_at: new Date('2026-10-16T16:45:00Z'),
      document_front_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      document_back_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    },
    // KYB Organizations / ONGs (role: creator)
    {
      email: 'contacto@ecohumedal.org.bo',
      password_hash: passwordHash,
      full_name: 'Fundación EcoHumedal Bolivia',
      phone: '+591 22445566',
      role: 'creator' as const,
      kyc_status: 'pending' as const,
      document_id: 'NIT 1029384756',
      document_type: 'NIT',
      organization_name: 'EcoHumedal ONG',
      kyc_submitted_at: new Date('2026-10-18T11:00:00Z'),
      created_at: new Date('2026-10-18T11:00:00Z'),
      document_front_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
      document_back_url: null,
    },
    {
      email: 'directiva@bosquesdelsur.bo',
      password_hash: passwordHash,
      full_name: 'Asociación Bosques del Sur',
      phone: '+591 44112233',
      role: 'creator' as const,
      kyc_status: 'verified' as const,
      document_id: 'NIT 3948572019',
      document_type: 'NIT',
      organization_name: 'Bosques del Sur',
      kyc_submitted_at: new Date('2026-10-05T08:30:00Z'),
      created_at: new Date('2026-10-05T08:30:00Z'),
      document_front_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
      document_back_url: null,
    },
    {
      email: 'proyectos@renacersolar.bo',
      password_hash: passwordHash,
      full_name: 'Comunidad Energética Renacer Solar',
      phone: '+591 33221100',
      role: 'creator' as const,
      kyc_status: 'requires_documentation' as const,
      document_id: 'NIT 5849302194',
      document_type: 'NIT',
      organization_name: 'Renacer Solar Colectivo',
      kyc_submitted_at: new Date('2026-10-08T15:20:00Z'),
      created_at: new Date('2026-10-08T15:20:00Z'),
      kyc_notes: 'Poder Notarial no adjuntado o ilegible.',
      document_front_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
      document_back_url: null,
    },
  ];

  for (const u of kycUsers) {
    await prisma.users.upsert({
      where: { email: u.email },
      update: {
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        kyc_status: u.kyc_status,
        document_id: u.document_id,
        document_type: u.document_type,
        organization_name: u.organization_name,
        kyc_submitted_at: u.kyc_submitted_at,
        kyc_notes: u.kyc_notes ?? null,
        document_front_url: u.document_front_url ?? null,
        document_back_url: u.document_back_url ?? null,
      },
      create: u,
    });
  }

  console.log('✅ KYC/KYB users successfully seeded into database!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding KYC data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
