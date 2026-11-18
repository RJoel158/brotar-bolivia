-- ============================================================================
-- Recompensas de campanas - Paso 1 de 3: tabla campaign_rewards
--
-- Ejecuta: DB Master, con el rol propietario de public.campaigns (hoy: greenbit).
-- Comando sugerido (se detiene en el primer error y no deja cambios a medias):
--   psql "<conexion DB Master>" -v ON_ERROR_STOP=1 -f 01_create_campaign_rewards.sql
--
-- Alcance: crea UNA tabla nueva y concede permisos sobre ella. No modifica
-- tablas existentes. Si una comprobacion falla, la transaccion se aborta y no
-- se crea nada: leer el mensaje y revisar antes de reintentar.
--
-- Diferencias respecto de brotar_schema.dbml (a confirmar por el DB Master):
--   - updated_at: el DBML no la incluye; el backend la expone en el contrato.
--   - estimated_delivery_on NOT NULL: la fecha completa es obligatoria por regla.
--   - CHECK de montos y cupos: protegen el ultimo cupo aunque falle la app.
-- El titulo queda VARCHAR(200) como en el DBML; la app limita a 120.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.campaign_rewards') IS NOT NULL THEN
    RAISE EXCEPTION 'Ya existe public.campaign_rewards. No se recrea ni se altera: comparar su estructura con este script y con schema.prisma antes de continuar.';
  END IF;

  IF to_regclass('public.campaigns') IS NULL THEN
    RAISE EXCEPTION 'No existe public.campaigns: este script no corresponde a esta base de datos.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.campaigns'::regclass
      AND attname = 'id'
      AND NOT attisdropped
      AND atttypid = 'uuid'::regtype
  ) THEN
    RAISE EXCEPTION 'public.campaigns.id no es uuid: la clave foranea de campaign_rewards no seria compatible.';
  END IF;
END $$;

CREATE TABLE public.campaign_rewards (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           UUID           NOT NULL
    REFERENCES public.campaigns (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  title                 VARCHAR(200)   NOT NULL,
  description           TEXT           NOT NULL,
  min_amount            NUMERIC(12, 2) NOT NULL,
  currency              VARCHAR(6)     NOT NULL DEFAULT 'BOB',
  quantity_total        INTEGER,
  quantity_claimed      INTEGER        NOT NULL DEFAULT 0,
  estimated_delivery_on DATE           NOT NULL,
  image_url             TEXT,
  is_active             BOOLEAN        NOT NULL DEFAULT true,
  display_order         SMALLINT       NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT chk_campaign_rewards_min_amount
    CHECK (min_amount > 0),
  CONSTRAINT chk_campaign_rewards_quantity_total
    CHECK (quantity_total IS NULL OR quantity_total > 0),
  CONSTRAINT chk_campaign_rewards_quantity_claimed
    CHECK (quantity_claimed >= 0 AND (quantity_total IS NULL OR quantity_claimed <= quantity_total))
);

CREATE INDEX idx_campaign_rewards_campaign_id ON public.campaign_rewards (campaign_id);

COMMENT ON COLUMN public.campaign_rewards.quantity_total IS 'Cupo total; NULL = ilimitado.';
COMMENT ON COLUMN public.campaign_rewards.quantity_claimed IS 'Aportes confirmados que adjudicaron la recompensa. Solo lo incrementa la confirmacion del pago.';

-- ----------------------------------------------------------------------------
-- Permisos. Los concede el propietario de la tabla (quien ejecuta este script).
-- Nunca a PUBLIC. Ajustar la lista si cambian los roles del equipo; si un rol
-- no existe, el GRANT falla y la transaccion completa se revierte.
--   - Roles de aplicacion: leen y escriben recompensas desde el backend.
--   - REFERENCES para el propietario de contributions: lo necesita el paso 2
--     para crear la clave foranea contributions.reward_id.
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_rewards
  TO greenbit_edu, greenbit_andres, greenbit_joe, greenbit_alex;
GRANT REFERENCES ON public.campaign_rewards TO greenbit_alex;

COMMIT;

-- ----------------------------------------------------------------------------
-- Reversion manual (solo si todavia no hay recompensas ni aportes que las usen
-- y el paso 2 no se aplico):
--   DROP TABLE public.campaign_rewards;
-- ----------------------------------------------------------------------------
