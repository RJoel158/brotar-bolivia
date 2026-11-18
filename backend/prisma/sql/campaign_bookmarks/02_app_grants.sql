-- ============================================================================
-- Favoritos - Paso 2 de 2: permisos de aplicacion
--
-- Ejecuta: propietario de public.campaign_bookmarks (mismo rol del paso 1).
-- Ajusta la lista de roles segun tu AlwaysData.
-- ============================================================================

BEGIN;

GRANT SELECT, INSERT, DELETE ON public.campaign_bookmarks
  TO greenbit, greenbit_edu, greenbit_andres, greenbit_joe, greenbit_alex;

COMMIT;
