/**
 * Smoke del happy path (tarea 4):
 *   crear → enviar a revisión → admin aprueba/publica → aporte → update → lectura pública → favorito
 *
 * Uso:
 *   node scripts/qa-happy-path-public-flow.cjs
 *
 * Prepara en BD (sin romper cuentas reales más de lo necesario):
 *   - marca KYC verified al creador de prueba
 *   - asegura un sponsor activo con Password123!
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.SMOKE_PASSWORD || 'Password123!';
const CREATOR_EMAIL = process.env.CREATOR_EMAIL || 'contacto@ecohumedal.org.bo';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@brotar.bo';
const SPONSOR_EMAIL = process.env.SPONSOR_EMAIL || 'sponsor@brotar.example';

const db = new PrismaClient();
const results = [];
const record = (name, ok, details = {}) => {
  results.push({ name, ok, details });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`, details.status != null ? `(${details.status})` : '');
};

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { status: response.status, data };
}

async function login(email, password) {
  return request('POST', '/auth/login', { body: { email, password } });
}

async function prepareAccounts() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const creator = await db.users.findUnique({ where: { email: CREATOR_EMAIL } });
  if (!creator) throw new Error(`No existe el creador ${CREATOR_EMAIL}`);
  await db.users.update({
    where: { id: creator.id },
    data: {
      status: 'active',
      kyc_status: 'verified',
      password_hash: passwordHash,
      role: 'creator',
    },
  });

  const admin = await db.users.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error(`No existe el admin ${ADMIN_EMAIL}`);
  await db.users.update({
    where: { id: admin.id },
    data: {
      status: 'active',
      role: 'admin',
      password_hash: passwordHash,
    },
  });

  let sponsor = await db.users.findUnique({ where: { email: SPONSOR_EMAIL } });
  if (!sponsor) {
    sponsor = await db.users.create({
      data: {
        email: SPONSOR_EMAIL,
        full_name: 'Sponsor Smoke',
        password_hash: passwordHash,
        role: 'sponsor',
        status: 'active',
        kyc_status: 'verified',
      },
    });
  } else {
    await db.users.update({
      where: { id: sponsor.id },
      data: {
        status: 'active',
        role: 'sponsor',
        password_hash: passwordHash,
        kyc_status: 'verified',
      },
    });
  }

  return { creatorId: creator.id, adminId: admin.id, sponsorId: sponsor.id };
}

(async () => {
  console.log('Preparando cuentas de smoke…');
  await prepareAccounts();
  record('prepare-accounts', true);

  const anonHome = await request('GET', '/campaigns/home');
  record('public-home', anonHome.status === 200, { status: anonHome.status });
  const anonFeed = await request('GET', '/campaigns/feed?limit=5');
  record('public-feed', anonFeed.status === 200, { status: anonFeed.status });
  const anonCatalog = await request('GET', '/campaigns/catalog?limit=5');
  record('public-catalog', anonCatalog.status === 200, { status: anonCatalog.status });

  const creatorLogin = await login(CREATOR_EMAIL, PASSWORD);
  record('login-creator', creatorLogin.status === 200 && Boolean(creatorLogin.data?.accessToken), {
    status: creatorLogin.status,
  });
  const adminLogin = await login(ADMIN_EMAIL, PASSWORD);
  record('login-admin', adminLogin.status === 200 && Boolean(adminLogin.data?.accessToken), {
    status: adminLogin.status,
  });
  const sponsorLogin = await login(SPONSOR_EMAIL, PASSWORD);
  record('login-sponsor', sponsorLogin.status === 200 && Boolean(sponsorLogin.data?.accessToken), {
    status: sponsorLogin.status,
  });

  if (!creatorLogin.data?.accessToken || !adminLogin.data?.accessToken || !sponsorLogin.data?.accessToken) {
    process.exitCode = 1;
    console.log(JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
    return;
  }

  const creatorToken = creatorLogin.data.accessToken;
  const adminToken = adminLogin.data.accessToken;
  const sponsorToken = sponsorLogin.data.accessToken;

  const slug = `smoke-${Date.now()}`;
  const created = await request('POST', '/campaigns', {
    token: creatorToken,
    body: {
      title: `Smoke happy path ${slug}`,
      category: 'ambiental',
      campaignType: 'donation',
      fundingModel: 'flexible',
      goalAmount: 1500,
      shortSummary: 'Campaña temporal de smoke test del happy path público.',
      location: 'Cochabamba',
      problem: 'Problema de prueba para smoke del sprint final.',
      solution: 'Solución de prueba para smoke del sprint final.',
      beneficiaries: 'Comunidad de prueba',
      expectedImpact: 'Impacto de prueba',
    },
  });
  record('create-campaign', created.status === 201 && Boolean(created.data?.id), {
    status: created.status,
  });
  const campaignId = created.data?.id;
  if (!campaignId) {
    process.exitCode = 1;
    console.log(JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
    return;
  }

  const submitted = await request('POST', `/campaigns/${campaignId}/submit-review`, {
    token: creatorToken,
  });
  record('submit-review', submitted.status === 200 || submitted.status === 201, {
    status: submitted.status,
    message: submitted.data?.message,
  });

  const approved = await request('POST', `/campaigns/${campaignId}/approve`, {
    token: adminToken,
    body: { notes: 'Smoke QA approve' },
  });
  record('admin-approve', approved.status === 200, { status: approved.status });

  const published = await request('POST', `/campaigns/${campaignId}/publish`, {
    token: adminToken,
  });
  record('admin-publish', published.status === 200 && published.data?.status === 'published', {
    status: published.status,
    campaignStatus: published.data?.status,
  });

  const publicDetail = await request('GET', `/campaigns/${campaignId}`);
  record(
    'public-detail',
    publicDetail.status === 200 && publicDetail.data?.status === 'published',
    { status: publicDetail.status },
  );

  const contribution = await request('POST', '/contributions', {
    token: sponsorToken,
    body: {
      campaignId,
      amount: 50,
      contributionType: 'donation',
    },
  });
  record('sponsor-contribute', contribution.status === 201 && Boolean(contribution.data?.id), {
    status: contribution.status,
    message: contribution.data?.message,
  });
  if (contribution.data?.id) {
    const paid = await request('POST', `/contributions/${contribution.data.id}/pay`, {
      token: sponsorToken,
      body: { method: 'qr' },
    });
    record('sponsor-pay', paid.status === 200 && paid.data?.approved === true, {
      status: paid.status,
    });
  }

  const bookmarked = await request('POST', `/campaigns/${campaignId}/bookmarks`, {
    token: sponsorToken,
  });
  record('bookmark-add', bookmarked.status === 201, {
    status: bookmarked.status,
    message: bookmarked.data?.message,
  });
  const bookmarkIds = await request('GET', '/campaigns/me/bookmark-ids', {
    token: sponsorToken,
  });
  record(
    'bookmark-list',
    bookmarkIds.status === 200 &&
      Array.isArray(bookmarkIds.data?.campaignIds) &&
      bookmarkIds.data.campaignIds.includes(campaignId),
    { status: bookmarkIds.status },
  );

  const update = await request('POST', `/campaigns/${campaignId}/updates`, {
    token: creatorToken,
    body: {
      title: 'Avance smoke',
      body: 'Actualización pública del happy path.',
      visibility: 'public',
    },
  });
  record('creator-update', update.status === 201 || update.status === 200, {
    status: update.status,
    message: update.data?.message,
  });

  const publicUpdates = await request('GET', `/campaigns/${campaignId}/updates`);
  record(
    'public-updates',
    publicUpdates.status === 200 &&
      Array.isArray(publicUpdates.data) &&
      publicUpdates.data.some((item) => item.title === 'Avance smoke'),
    { status: publicUpdates.status, count: publicUpdates.data?.length },
  );

  const failed = results.some((item) => !item.ok);
  console.log(JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
  if (failed) process.exitCode = 1;
})()
  .catch((error) => {
    console.error('Smoke failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect().catch(() => {});
  });
