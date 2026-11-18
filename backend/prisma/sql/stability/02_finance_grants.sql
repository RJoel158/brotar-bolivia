-- Ejecutar como propietario de estas tablas (greenbit_alex).
-- Repetible, solo privilegios requeridos por el backend, sin DELETE ni PUBLIC.
BEGIN;
GRANT SELECT, INSERT, UPDATE ON public.contributions, public.disbursements,
  public.payment_reconciliations, public.disputes, public.dispute_messages
  TO greenbit_joe, greenbit_edu, greenbit_andres;
COMMIT;
