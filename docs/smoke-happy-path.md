# Smoke happy path (tarea 4)

Flujo a validar:

1. Anónimo abre Home / Explorar / Detalle de campaña publicada
2. Creador crea campaña y la envía a revisión
3. Admin aprueba y publica
4. Patrocinador aporta (pago simulado) y guarda favorito
5. Creador publica un avance
6. Anónimo ve el avance en el detalle / feed

## Script

Con el backend en `http://localhost:3000`:

```bash
cd backend
node scripts/qa-happy-path-public-flow.cjs
```

Variables opcionales: `BASE_URL`, `CREATOR_EMAIL`, `CREATOR_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SPONSOR_EMAIL`, `SPONSOR_PASSWORD`.

## Favoritos (BD)

Antes de probar favoritos en la BD compartida, el DB Master debe aplicar:

1. `backend/prisma/sql/campaign_bookmarks/01_create_campaign_bookmarks.sql`
2. `backend/prisma/sql/campaign_bookmarks/02_app_grants.sql`

Luego: `pnpm exec prisma generate`
