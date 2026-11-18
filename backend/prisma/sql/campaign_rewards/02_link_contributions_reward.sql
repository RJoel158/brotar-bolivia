-- ============================================================================
-- Recompensas de campanas - Paso 2 de 3: relacion contributions.reward_id
--
-- Ejecuta: el rol propietario de public.contributions (hoy: greenbit_alex),
-- despues del paso 1. Solo el propietario puede agregar una restriccion a la
-- tabla, y el paso 1 le concede REFERENCES sobre campaign_rewards.
--   psql "<conexion propietario contributions>" -v ON_ERROR_STOP=1 -f 02_link_contributions_reward.sql
--
-- Alcance: agrega la clave foranea de reward_id e inicializa quantity_claimed.
-- No borra, reasigna ni corrige datos: ante cualquier inconsistencia aborta la
-- transaccion y lo informa. Las consultas de diagnostico estan al final.
--
-- ON DELETE NO ACTION: impide borrar una recompensa con aportes y no borra
-- aportes en cascada. A diferencia de RESTRICT, se verifica al final de la
-- sentencia, asi que el borrado en cascada ya existente desde campaigns
-- (campaigns -> contributions y campaigns -> campaign_rewards) sigue funcionando.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.campaign_rewards') IS NULL THEN
    RAISE EXCEPTION 'Falta public.campaign_rewards: ejecutar antes 01_create_campaign_rewards.sql.';
  END IF;
END $$;

-- Evita aportes o recompensas nuevos mientras se comprueba y se agrega la FK.
LOCK TABLE public.contributions IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.campaign_rewards IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
  v_count BIGINT;
  v_reward_attnum SMALLINT;
BEGIN
  SELECT attnum INTO v_reward_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.contributions'::regclass
    AND attname = 'reward_id'
    AND NOT attisdropped
    AND atttypid = 'uuid'::regtype;
  IF v_reward_attnum IS NULL THEN
    RAISE EXCEPTION 'public.contributions.reward_id no existe o no es uuid.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.contributions'::regclass
      AND contype = 'f'
      AND v_reward_attnum = ANY (conkey)
  ) THEN
    RAISE EXCEPTION 'contributions.reward_id ya tiene una clave foranea: revisarla en lugar de duplicarla.';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.contributions c
  WHERE c.reward_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.campaign_rewards r WHERE r.id = c.reward_id);
  IF v_count > 0 THEN
    RAISE EXCEPTION '% aporte(s) tienen reward_id sin recompensa (huerfanos). Ver diagnostico 1.', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.contributions c
  JOIN public.campaign_rewards r ON r.id = c.reward_id
  WHERE r.campaign_id <> c.campaign_id;
  IF v_count > 0 THEN
    RAISE EXCEPTION '% aporte(s) apuntan a una recompensa de otra campana. Ver diagnostico 2.', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.contributions
  WHERE reward_id IS NOT NULL AND contribution_type <> 'reward';
  IF v_count > 0 THEN
    RAISE EXCEPTION '% aporte(s) que no son de tipo reward tienen reward_id. Ver diagnostico 3.', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.contributions c
  JOIN public.campaign_rewards r ON r.id = c.reward_id
  WHERE c.currency <> r.currency;
  IF v_count > 0 THEN
    RAISE EXCEPTION '% aporte(s) tienen una moneda distinta de su recompensa. Ver diagnostico 4.', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.campaign_rewards r
  WHERE r.quantity_total IS NOT NULL
    AND r.quantity_total < (
      SELECT count(*) FROM public.contributions c
      WHERE c.reward_id = r.id AND c.status = 'confirmed'
    );
  IF v_count > 0 THEN
    RAISE EXCEPTION '% recompensa(s) tienen mas aportes confirmados que cupos. Ver diagnostico 5.', v_count;
  END IF;
END $$;

ALTER TABLE public.contributions
  ADD CONSTRAINT fk_contributions_reward_id
  FOREIGN KEY (reward_id) REFERENCES public.campaign_rewards (id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- quantity_claimed se calcula desde los aportes confirmados existentes, sin
-- asumir cero. Los pendientes no ocupan cupo.
UPDATE public.campaign_rewards r
SET quantity_claimed = s.confirmed,
    updated_at = now()
FROM (
  SELECT reward_id, count(*)::INTEGER AS confirmed
  FROM public.contributions
  WHERE status = 'confirmed' AND reward_id IS NOT NULL
  GROUP BY reward_id
) s
WHERE r.id = s.reward_id
  AND r.quantity_claimed <> s.confirmed;

DO $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.campaign_rewards r
  WHERE r.quantity_claimed <> (
    SELECT count(*) FROM public.contributions c
    WHERE c.reward_id = r.id AND c.status = 'confirmed'
  );
  IF v_count > 0 THEN
    RAISE EXCEPTION '% recompensa(s) con quantity_claimed distinto de sus aportes confirmados. Ver diagnostico 6.', v_count;
  END IF;
END $$;

COMMIT;

-- ----------------------------------------------------------------------------
-- Diagnostico (solo lectura). Ejecutar por separado si el script aborta.
-- 1) Huerfanos:
--   SELECT c.id, c.campaign_id, c.reward_id, c.status FROM public.contributions c
--   WHERE c.reward_id IS NOT NULL
--     AND NOT EXISTS (SELECT 1 FROM public.campaign_rewards r WHERE r.id = c.reward_id);
-- 2) Recompensa de otra campana:
--   SELECT c.id, c.campaign_id, r.campaign_id AS reward_campaign_id FROM public.contributions c
--   JOIN public.campaign_rewards r ON r.id = c.reward_id WHERE r.campaign_id <> c.campaign_id;
-- 3) reward_id en aportes que no son de recompensa:
--   SELECT id, contribution_type, reward_id FROM public.contributions
--   WHERE reward_id IS NOT NULL AND contribution_type <> 'reward';
-- 4) Moneda distinta:
--   SELECT c.id, c.currency, r.currency FROM public.contributions c
--   JOIN public.campaign_rewards r ON r.id = c.reward_id WHERE c.currency <> r.currency;
-- 5) y 6) Cupos frente a confirmados:
--   SELECT r.id, r.quantity_total, r.quantity_claimed,
--          (SELECT count(*) FROM public.contributions c
--           WHERE c.reward_id = r.id AND c.status = 'confirmed') AS confirmados
--   FROM public.campaign_rewards r;
--
-- Reversion manual (no toca datos):
--   ALTER TABLE public.contributions DROP CONSTRAINT fk_contributions_reward_id;
-- ----------------------------------------------------------------------------
