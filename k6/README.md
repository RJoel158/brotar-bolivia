# QA de rendimiento e integridad de Brotar

Los resultados estan en la boveda compartida, `02 Proyectos/Brotar/Reportes QA`, con indice, reportes MD por caso y evidencia JSON/log. No se versionan tokens, secretos ni datos personales. Los nuevos runs usan timestamp unico para preservar resultados anteriores.

## Entornos separados

- Frontend de desarrollo: 5173; API de desarrollo: 3000. Su BD configurada es compartida: no usar esos destinos para carga.
- QA: PostgreSQL sintetico en **127.0.0.1:55432/brotar_qa**, API en **127.0.0.1:3100**, pool de 10 conexiones para la medicion. Los scripts de escrituras rechazan otra BD.
- En Windows se uso PostgreSQL 17.6 portable de @embedded-postgres/windows-x64 en un directorio temporal. Docker Desktop no logro iniciar. No se copio informacion de la BD compartida.

## Preparacion

Usar PostgreSQL local aislado con el nombre/puerto de arriba; configurar DATABASE_URL solo en la sesion del proceso, sin cambiar .env compartido. Configurar JWT_SECRET para firma y validacion. Desde backend:

1. `pnpm db:generate` al cambiar schema, con procesos Node detenidos en Windows para evitar DLL bloqueada.
2. `pnpm exec prisma db push --skip-generate` **solo contra BD de QA vacia**, nunca contra la remota compartida. Confirmar el destino mostrado por Prisma.
3. `pnpm exec node scripts/seed-qa.cjs`: crea 1.001 usuarios y 100 campanas sinteticas; no es un seed idempotente. Usar BD de QA nueva para una comparacion limpia.
4. `pnpm build` y API de QA con PORT=3100. Para instrumentacion opcional: `pnpm exec node scripts/start-qa-server.cjs <recurso-evidencia.json>`; este harness escucha en loopback y rechaza otra BD.
5. Frontend se usa en recorrido manual; la carga k6 es de API y no mide render del navegador.

## Pruebas

- `pnpm exec node scripts/latency-baseline.cjs <evidencia.json>`: 5 lecturas secuenciales por ruta en servidor temporal. No es carga. Usa la BD de la sesion; explicitar el destino antes de ejecutar.
- `pnpm exec node scripts/qa-integrity.cjs <evidencia.json>`: carreras de cupos/pagos reales en PostgreSQL, auth/KYC HTTP y equivalencia del DTO. Requiere API QA activa. Crea y modifica fixtures: ejecutar fuera de las corridas de carga para no alterar usuario/conteos durante una medicion.
- `pnpm exec node scripts/run-qa-load.cjs <directorio-reportes> <k6.exe>`: guarda MD, resumen JSON y log tras cada corrida; el token solo existe en memoria y no se pasa la configuracion de BD o SMTP al generador.
- QA_PROFILE: por defecto 10/100/1000 VUs y recuperacion; capacity agrega escalones de 250/500, tramo de 60 s y recuperacion; ramp sube gradualmente a 500/1000; realistic prueba 1000 con think time 3 s; final repite 500 con rampa para regresion.
- Validar sintaxis k6: `k6 inspect -e BASE_URL=http://127.0.0.1:3100 -e QA_ISOLATED=true -e RAMP=true ../k6/scripts/brotar-read-load.js`.

## Interpretacion

Umbrales de diagnostico propuestos: p95 < 1000 ms, error < 1%, checks > 99%; se detiene carga al fallar latencia/errores despues de 10 s. Un codigo k6 99 indica incumplimiento y debe investigarse, no ocultarse. La mezcla es 50% perfil, 30% detalle, 20% catalogo, un patrocinador firmado y 1 s entre acciones (3 s en realistic). No equivale a 1000 usuarios distintos ni 1000 consultas simultaneas.

Los resultados locales incluyen coste del generador y BD en el mismo equipo. Diferenciar errores TCP de HTTP 500, conteos de operaciones Prisma de sentencias SQL, y tiempos inclusivos de tiempos exclusivos. Una corrida de 60 s no demuestra resistencia durante horas. Falta repetir con infraestructura de staging equivalente, clientes distribuidos, datos representativos y cuentas distintas antes de certificar capacidad productiva.


## Catalogo y protecciones: cierre del 22 de octubre

- `QA_PROFILE=catalog-compare` compara lista completa y catalogo paginado a 500/1000 VUs; `catalog-reverse` repite 1000 empezando por paginado. Mantener fixtures y otras cargas constantes.
- `qa-catalog-security.cjs <json>` comprueba paginacion completa sin omisiones, busqueda literal, filtros, entradas invalidas, login, aportes simulados, limites por IP, CORS y cursor eliminado. Modifica fixtures; ejecutar antes de carga y con contadores de login limpios.
- `qa-timeouts.cjs <json>` verifica ajustes efectivos, cancelacion/rollback, bloqueo y recuperacion tras agotamiento del pool. Solo QA aislada.
- API usa por defecto statement_timeout=15 s, lock_timeout=3 s e idle_in_transaction_session_timeout=15 s por conexion; options explicito prevalece. Pool=10, espera/adquisicion=5 s.
- Login limita 10 intentos/minuto, registro 5, por IP/ruta/proceso. Con replicas se necesita almacen compartido y configurar proxy confiable segun despliegue. No protege por si solo contra DDoS.
- `/campaigns/catalog` devuelve 24 registros por defecto, maximo 48, con cursor; Explorar y CampaignsPage lo utilizan. Home y consumidores antiguos conservan `/campaigns`: su listado completo sigue pendiente de migrar preservando seleccion global.
- Compilacion frontend advierte bundle principal ~779 kB; falta dividir carga. Cargas cortas locales no certifican 1000 usuarios reales ni resistencia prolongada.


## Continuacion: Home acotado

Home usa `/campaigns/home` para destacado global, categorias/conteos y cifras agregadas, mas `/campaigns/catalog` para tarjetas. PostgreSQL calcula agregados; no transfiere todas las campanas a Node/navegador. Se conserva el redondeo/cap de progreso del cliente; empates de destacado usan created_at/id descendentes deterministas. La suma multimoneda conserva el comportamiento historico y no representa conversion monetaria.

`pnpm exec node scripts/qa-home-summary.cjs <reporte.json>` verifica equivalencia global, destacado fuera de primera pagina, conteos, payload publico y recorrido completo; crea y elimina una fixture aislada. Ejecutar fuera de carga. `QA_PROFILE=home` prueba mezcla 50% perfil, 30% detalle y 20% resumen Home a 1000 VUs y recuperacion; no representa la apertura completa de Home (que requiere tambien catalogo y assets).

Ninguna pantalla actual invoca `listPublic`; `/campaigns` permanece compatible para clientes externos, todavia sin limite, y debe retirarse o versionarse antes de exponerlo a trafico abusivo. El resumen es O(n) en PostgreSQL; volver a medir con volumen representativo antes de decidir cache, materializacion o indices. No anadir cache a autorizacion/KYC.
