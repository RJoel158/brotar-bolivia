-- OPCIONAL / NO USAR con greenbit_andres:
-- este ALTER exige ser owner de public.users (falla con "must be owner").
-- En su lugar usar: 02_user_must_change_password_table.sql

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

COMMIT;
