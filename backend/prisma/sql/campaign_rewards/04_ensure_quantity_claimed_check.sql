-- ============================================================================
-- Recompensas - asegura chk_campaign_rewards_quantity_claimed
--
-- 01_create_campaign_rewards.sql define el CHECK solo al crear la tabla y
-- aborta si campaign_rewards ya existe. Este script no recrea la tabla ni
-- toca filas: agrega la restriccion si falta.
--
-- No ejecutado contra la base compartida desde el repositorio. Confirmar el
-- destino antes de correrlo. Si la tabla ya tiene filas con
-- quantity_claimed > quantity_total, el ALTER falla y no deja la restriccion
-- a medias.
--
--   psql "<conexion del propietario>" -v ON_ERROR_STOP=1 -f 04_ensure_quantity_claimed_check.sql
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.campaign_rewards') IS NULL THEN
    RAISE EXCEPTION 'No existe public.campaign_rewards. Aplicar antes 01_create_campaign_rewards.sql.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_campaign_rewards_quantity_claimed'
      AND conrelid = 'public.campaign_rewards'::regclass
  ) THEN
    ALTER TABLE public.campaign_rewards
      ADD CONSTRAINT chk_campaign_rewards_quantity_claimed
      CHECK (
        quantity_claimed >= 0
        AND (quantity_total IS NULL OR quantity_claimed <= quantity_total)
      );
  END IF;
END $$;

COMMIT;
