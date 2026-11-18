-- Tabla auxiliar: el rol de app no es owner de public.users, así que no puede
-- ALTER TABLE users. Esta tabla sí se puede crear con greenbit_andres.
-- Ejecutar con el usuario de la app.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_must_change_password (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
