# Estabilidad BD y autenticación

## Contrato de envío a revisión

`POST /campaigns/:id/submit-review`, con Bearer token y sin body. Conserva el DTO de campaña y respuesta 200. Devuelve 404 si no existe, 403 si no pertenece al usuario o si la cuenta no está activa/con KYC `verified`, y 409 si el estado o las recompensas impiden enviarla. El KYC se consulta en BD en cada envío; no se acepta el estado antiguo del JWT. Los borradores siguen permitidos sin KYC aprobado.

La estrategia JWT obtiene rol, KYC y estado actual de la cuenta; cuentas ausentes/inactivas reciben 401. Login no emite tokens a cuentas inactivas.

## SQL por propietario

- `01_updates_grants.sql`: ejecutar con el propietario de updates (`greenbit_joe`). Aplicado el 2026-10-22 y verificados los cuatro privilegios para cada destinatario.
- `02_finance_grants.sql`: ejecutar con el propietario de finanzas (`greenbit_alex`). PENDIENTE: la conexión disponible no pertenece ni puede asumir ese rol. No se puede resolver con una migración ejecutada como `greenbit_joe`.

Ambos scripts son repetibles, transaccionales y no cambian filas ni conceden privilegios a PUBLIC. Para psql: `psql "<conexion del propietario>" -v ON_ERROR_STOP=1 -f <script>`. No guardar la conexión en el repositorio.

Rewards, plan, presupuesto y columnas de revisión ya existen en la BD consultada; no se deben recrear. Rewards ya permite SELECT/INSERT/UPDATE/DELETE a los cuatro roles del equipo. No se aplicaron migraciones destructivas ni seeds.

## Comprobación

Desde backend: `pnpm db:check`. Ejecuta una lectura de todos los campos escalares por modelo, sin imprimir filas ni secretos; termina con código 1 si algún modelo falla. No verifica escrituras ni reemplaza QA funcional. Actualmente pasan 11 modelos y fallan contributions, payment_reconciliations, disbursements, disputes y dispute_messages por permisos.

`pnpm db:generate` regenera Prisma cuando cambia el esquema; hacerlo con los procesos Node detenidos en Windows para evitar bloqueo de la DLL. `pnpm build` solo compila. La instalación local advierte CLI 6.4.1 vs cliente 6.19.3; no se cambiaron versiones ni lockfile en esta tarea.

Pendiente para cerrar el criterio de flujo feliz sin 503: aplicar el script financiero con su propietario, repetir db:check y probar flujos completos de aportes/finanzas. El catálogo y /users/me autenticado respondieron 200 en una instancia temporal local; /users/me sin token respondió 401. No se crearon usuarios, campañas ni aportes en la BD compartida durante ese smoke test.


## Pool de API: revision posterior

PrismaModule global registra un PrismaService compartido: 19 consumidores verificados y test de regresion del grafo. No crear clientes por controlador/repositorio ni repetir su registro en providers de features.

El motor elegia hasta 27 conexiones por proceso; el rol remoto tiene limite 50. PrismaService ahora establece por defecto connection_limit=10, pool_timeout=5 y connect_timeout=5 segundos y etiqueta por PID. Los valores explicitos validos de URL prevalecen. No se modifico .env, esquema ni ajustes globales del servidor. Los scripts de PrismaClient independientes tienen su propio pool y deben cerrarlo; las herramientas Nest de QA usan el PrismaService de su contexto.

Cada replica tiene su pool. Cuatro procesos de 10 pueden usar 40 conexiones; hay que reservar capacidad para otros procesos que compartan el rol. Es un ejemplo, no una recomendacion de desplegar cuatro replicas sin conocer el consumo total. max_connections=500 del servidor no es presupuesto exclusivo.

Los timeouts de pool/conexion NO acortan SQL. La sesion remota mantiene statement_timeout=3600000 ms y lock_timeout=0; ajustar eso requiere cambios por rol/sesion y pruebas de rollback, sin afectar otras tareas. No se modificaron en esta revision.

Auditorias: pnpm exec node scripts/audit-pool.cjs <reporte.json> y pnpm exec node scripts/audit-permissions.cjs <reporte.json>. Son lecturas, sin guardar URLs ni filas personales.


## Actualizacion posterior: permisos y limites resueltos

Esta actualizacion sustituye los pendientes historicos anteriores: el propietario aplico GRANT financiero y la auditoria normal verifico SELECT/INSERT/UPDATE en los 16 modelos; db:check paso 16/16. Tambien se comprobaron los cinco permisos financieros para el rol principal greenbit. No se requieren mas cambios de permisos de Alex para esos modelos.

La API ahora configura por sesion statement_timeout=15000 ms, lock_timeout=3000 ms e idle_in_transaction_session_timeout=15000 ms, salvo options explicito en URL. No modifica el servidor ni ALTER ROLE. Los tests aislados verifican cancelacion, rollback, bloqueo y recuperacion, ademas de timeouts de pool. Revisar estos valores con transacciones de negocio representativas antes del despliegue.

El nuevo repositorio de catalogo reutiliza PrismaService: hay 20 consumidores, sin registrar otro pool. Reportes detallados y limitaciones estan en la boveda compartida, Reportes QA.
