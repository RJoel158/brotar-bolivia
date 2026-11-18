import { PrismaClient } from '@prisma/client';

/**
 * Datos de demo para el modulo de finanzas del panel de administracion.
 *
 * Solo escribe en las tablas nuevas del modulo (contributions,
 * payment_reconciliations, disbursements, disputes, dispute_messages).
 * No toca usuarios ni campanas: los reutiliza tal como estan.
 *
 * Es idempotente: si ya hay aportes cargados, no vuelve a sembrar.
 *
 * Ejecutar con:  pnpm exec ts-node prisma/seed-finance.ts
 */

const prisma = new PrismaClient();

const COMMISSION_RATE = 5;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function split(amount: number, rate = COMMISSION_RATE) {
  const commission = Math.round(amount * rate) / 100;
  return { commission, net: Math.round((amount - commission) * 100) / 100 };
}

async function main(): Promise<void> {
  const existing = await prisma.contributions.count();
  if (existing > 0) {
    console.log(`Ya existen ${existing} aportes. No se siembra nada.`);
    return;
  }

  const campaigns = await prisma.campaign.findMany({
    where: { status: { in: ['published', 'completed'] } },
    select: { id: true, title: true, currency: true, owner_user_id: true },
    orderBy: { created_at: 'asc' },
  });

  const sponsors = await prisma.users.findMany({
    where: { role: 'sponsor', status: 'active' },
    select: { id: true, full_name: true },
    take: 8,
  });

  if (campaigns.length === 0 || sponsors.length === 0) {
    console.log('Faltan campanas publicadas o patrocinadores. Nada que sembrar.');
    return;
  }

  // --------------------------------------------------------------- Aportes
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'expired', 'failed'] as const;
  const amounts = [350, 150, 500, 200, 1200, 800, 450, 600, 250, 900, 1500, 700];

  const contributionIds: string[] = [];

  for (let index = 0; index < 18; index += 1) {
    const campaign = campaigns[index % campaigns.length];
    const sponsor = sponsors[index % sponsors.length];
    const status = statuses[index % statuses.length];
    const amount = amounts[index % amounts.length];
    const { commission, net } = split(amount);
    const paidAt = status === 'confirmed' ? daysAgo(index * 3) : null;

    const contribution = await prisma.contributions.create({
      data: {
        campaign_id: campaign.id,
        sponsor_user_id: sponsor.id,
        amount,
        commission_rate: COMMISSION_RATE,
        commission_amount: commission,
        net_amount: net,
        currency: campaign.currency ?? 'BOB',
        status,
        payment_method: index % 2 === 0 ? 'tarjeta' : 'transferencia',
        gateway_reference: `GW-${(88800 + index).toString()}`,
        paid_at: paidAt,
        created_at: daysAgo(index * 3),
      },
    });

    contributionIds.push(contribution.id);
  }

  // -------------------------------------------------------- Discrepancias
  await prisma.payment_reconciliations.createMany({
    data: [
      {
        contribution_id: contributionIds[0],
        gateway_reference: 'GW-88800',
        discrepancy_type: 'amount_mismatch',
        internal_amount: 350,
        gateway_amount: 370,
        status: 'pending',
        detected_at: daysAgo(1),
      },
      {
        contribution_id: contributionIds[3],
        gateway_reference: 'GW-88803',
        discrepancy_type: 'missing_in_gateway',
        internal_amount: 200,
        gateway_amount: null,
        status: 'pending',
        detected_at: daysAgo(1),
      },
      {
        contribution_id: null,
        gateway_reference: 'GW-99120',
        discrepancy_type: 'missing_internally',
        internal_amount: null,
        gateway_amount: 500,
        status: 'pending',
        detected_at: daysAgo(2),
      },
      {
        contribution_id: contributionIds[6],
        gateway_reference: 'GW-88806',
        discrepancy_type: 'duplicated',
        internal_amount: 450,
        gateway_amount: 900,
        status: 'pending',
        detected_at: daysAgo(3),
      },
    ],
  });

  // ---------------------------------------------------------- Desembolsos
  const disbursementPlan = [
    { amount: 125000, status: 'pending' as const, bank: 'BNB - Banco Nacional de Bolivia', account: '1000-2938-4444', verified: true },
    { amount: 80000, status: 'pending' as const, bank: null, account: null, verified: false },
    { amount: 15500, status: 'pending' as const, bank: 'Banco Bisa S.A.', account: '4029-1122-8833', verified: true },
    { amount: 42000, status: 'approved' as const, bank: 'Banco Union', account: '3311-0099-7766', verified: true },
    { amount: 68000, status: 'completed' as const, bank: 'Banco Mercantil Santa Cruz', account: '5500-7788-2211', verified: true },
    { amount: 9000, status: 'rejected' as const, bank: 'Banco Fassil', account: '7788-3344-1100', verified: false },
  ];

  for (let index = 0; index < disbursementPlan.length; index += 1) {
    const plan = disbursementPlan[index];
    const campaign = campaigns[index % campaigns.length];
    const { commission, net } = split(plan.amount);

    await prisma.disbursements.create({
      data: {
        campaign_id: campaign.id,
        requested_by_user_id: campaign.owner_user_id,
        gross_amount: plan.amount,
        commission_rate: COMMISSION_RATE,
        commission_amount: commission,
        net_amount: net,
        currency: campaign.currency ?? 'BOB',
        status: plan.status,
        bank_name: plan.bank,
        bank_account: plan.account,
        account_verified: plan.verified,
        processed_at: plan.status === 'completed' ? daysAgo(4) : null,
        failure_reason: plan.status === 'rejected' ? 'Cuenta bancaria no verificada' : null,
        created_at: daysAgo(index * 2 + 1),
      },
    });
  }

  // -------------------------------------------------------------- Disputas
  const disputePlan = [
    {
      code: 'DSP-9921-A',
      type: 'payment_not_recognized' as const,
      status: 'open' as const,
      priority: 'high' as const,
      description:
        'El patrocinador reporta un pago de Bs. 200,00 no reconocido en la plataforma. El cargo aparece debitado en su cuenta pero el estado en Brotar figura como "Reembolsado" sin solicitud previa.',
      firstMessage:
        'Hice un pago de Bs. 200,00 el 25/08 y no aparece como confirmado. El dinero salio de mi cuenta.',
      days: 3,
    },
    {
      code: 'DSP-9918-B',
      type: 'metrics_discrepancy' as const,
      status: 'in_review' as const,
      priority: 'medium' as const,
      description: 'Impacto de CO2 reportado no coincide con el informe entregado por el creador.',
      firstMessage: 'Las metricas publicadas no cuadran con el ultimo informe trimestral.',
      days: 5,
    },
    {
      code: 'DSP-9890-C',
      type: 'project_not_executed' as const,
      status: 'open' as const,
      priority: 'high' as const,
      description: 'Falta de actualizaciones post-fondeo; el proyecto no muestra avances.',
      firstMessage: 'Aporte hace dos meses y el proyecto no publica ninguna actualizacion.',
      days: 7,
    },
    {
      code: 'DSP-9855-D',
      type: 'reward_not_received' as const,
      status: 'resolved' as const,
      priority: 'low' as const,
      description: 'La recompensa comprometida no llego en el plazo indicado.',
      firstMessage: 'No recibi la recompensa prometida en la fecha acordada.',
      days: 20,
    },
  ];

  for (let index = 0; index < disputePlan.length; index += 1) {
    const plan = disputePlan[index];
    const campaign = campaigns[index % campaigns.length];
    const sponsor = sponsors[index % sponsors.length];

    const dispute = await prisma.disputes.create({
      data: {
        code: plan.code,
        campaign_id: campaign.id,
        reporter_user_id: sponsor.id,
        contribution_id: contributionIds[index],
        dispute_type: plan.type,
        description: plan.description,
        status: plan.status,
        priority: plan.priority,
        opened_at: daysAgo(plan.days),
        resolved_at: plan.status === 'resolved' ? daysAgo(plan.days - 1) : null,
        resolution: plan.status === 'resolved' ? 'Recompensa reenviada y confirmada por el patrocinador.' : null,
      },
    });

    await prisma.dispute_messages.create({
      data: {
        dispute_id: dispute.id,
        is_system: true,
        body: `Caso ${plan.code} abierto automaticamente por reporte del patrocinador.`,
        created_at: daysAgo(plan.days),
      },
    });

    await prisma.dispute_messages.create({
      data: {
        dispute_id: dispute.id,
        author_user_id: sponsor.id,
        body: plan.firstMessage,
        created_at: daysAgo(plan.days),
      },
    });
  }

  const totals = {
    aportes: await prisma.contributions.count(),
    discrepancias: await prisma.payment_reconciliations.count(),
    desembolsos: await prisma.disbursements.count(),
    disputas: await prisma.disputes.count(),
  };

  console.log('Datos de finanzas sembrados:', totals);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
