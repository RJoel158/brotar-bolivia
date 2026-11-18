-- ============================================================================
-- Favoritos / proyectos seguidos - Paso 1 de 2: tabla campaign_bookmarks
--
-- Ejecuta: DB Master, con el rol propietario de public.campaigns (hoy: greenbit).
--   psql "<conexion DB Master>" -v ON_ERROR_STOP=1 -f 01_create_campaign_bookmarks.sql
--
-- Alcance: crea el enum bookmark_kind y la tabla campaign_bookmarks.
-- No modifica tablas existentes. Si ya existe, aborta sin cambios.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.campaign_bookmarks') IS NOT NULL THEN
    RAISE EXCEPTION 'Ya existe public.campaign_bookmarks. No se recrea ni se altera.';
  END IF;

  IF to_regclass('public.campaigns') IS NULL OR to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Faltan public.campaigns o public.users.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookmark_kind') THEN
    CREATE TYPE public.bookmark_kind AS ENUM ('FAVORITE', 'FOLLOW');
  END IF;
END $$;

CREATE TABLE public.campaign_bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL
    REFERENCES public.users (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  campaign_id  UUID NOT NULL
    REFERENCES public.campaigns (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  kind         public.bookmark_kind NOT NULL DEFAULT 'FAVORITE',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_campaign_bookmarks_user_campaign_kind UNIQUE (user_id, campaign_id, kind)
);

CREATE INDEX idx_campaign_bookmarks_user_id ON public.campaign_bookmarks (user_id);
CREATE INDEX idx_campaign_bookmarks_campaign_id ON public.campaign_bookmarks (campaign_id);

COMMIT;
