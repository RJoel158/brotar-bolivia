-- Ejecutar como propietario de campaign_updates (greenbit_joe).
-- Repetible, sin cambios de datos ni permisos a PUBLIC.
BEGIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_updates
  TO greenbit_edu, greenbit_andres, greenbit_alex;
COMMIT;
