-- ============================================================================
-- Recompensas de campanas - Paso 3 de 3: permisos de aplicacion sobre aportes
--
-- Ejecuta: el rol propietario de public.contributions (hoy: greenbit_alex),
-- solo si el equipo acuerda que cada integrante corra el backend con su propio
-- rol. Hoy contributions no concede permisos a nadie mas que su propietario,
-- asi que el flujo de aportes y la seleccion de recompensas fallan con
-- "permission denied" para los demas roles.
--   psql "<conexion propietario contributions>" -v ON_ERROR_STOP=1 -f 03_contributions_app_grants.sql
--
-- Que necesita el backend:
--   - contributions: SELECT, INSERT, UPDATE (crear, pagar, cancelar, listar).
--     No necesita DELETE.
--   - campaigns: UPDATE de current_amount (los roles ya lo tienen).
--   - campaign_rewards: lo concede el paso 1.
-- Nunca conceder a PUBLIC. Ajustar la lista de roles antes de ejecutar.
-- ============================================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE ON public.contributions
  TO greenbit_edu, greenbit_andres, greenbit_joe;

COMMIT;
