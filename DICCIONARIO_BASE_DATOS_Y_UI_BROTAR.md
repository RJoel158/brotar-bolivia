# DICCIONARIO EXHAUSTIVO DE BASE DE DATOS Y MAPEO DE INTERFAZ DE USUARIO
## Plataforma de Crowdfunding con Impacto Sostenible - Brotar

---

### METADATOS DEL DOCUMENTO
- **Sistema:** Brotar - Crowdfunding Verde
- **Nivel del Documento:** Especificacion Tecnica Exhaustiva y Diccionario de Datos Campo por Campo
- **Motor de Base de Datos:** PostgreSQL 16+ / Prisma ORM
- **Version:** 2.0 (Revision Integral)
- **Modulos Cubiertos:** Experiencia Visitante (1A y 1B), Experiencia Creador (1C y 2), Experiencia Patrocinador y Administracion (Equipo 3)

---

## 1. INTRODUCCION Y GUIA DE LECTURA

El presente documento detalla la totalidad de entidades, tablas, atributos y maquinas de estados que componen el modelo de persistencia relacional de **Brotar**. Para cada tabla se describe su objetivo en la logica de negocio, su interaccion con las pantallas del sistema y el proposito exacto de cada columna individual.

---

## 2. MODULO 1: IDENTIDAD, USUARIOS Y CUMPLIMIENTO (KYC / KYB)

### 2.1 Tabla: `users`
- **Descripcion General:** Entidad central que gestiona la autenticacion, seguridad criptografica, roles de acceso (RBAC) y el expediente de verificacion de identidad (KYC para personas naturales y representantes).
- **Mapeo en Interfaz (UI):** Pantalla 07 (Inicio de Sesion), Pantalla 08 (Registro de Usuarios), Paso 7 del Asistente del Creador (Verificacion KYC), Pantalla 09 de Administracion (Verificacion y Compliance).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico global e inmutable del usuario en el sistema. |
| `email` | VARCHAR(255) (Unique, Not Null) | Sin valor por defecto | Correo electronico verificado. Se utiliza como identificador de login y destino de notificaciones transaccionales. |
| `password_hash` | TEXT (Not Null) | Sin valor por defecto | Hash de la contrasena procesado con el algoritmo Bcrypt y 10 rondas de salt. Nunca almacena texto plano. |
| `full_name` | VARCHAR(160) (Not Null) | Sin valor por defecto | Nombre y apellidos completos del usuario o nombre del representante. Se presenta en perfiles y certificados de aporte. |
| `phone` | VARCHAR(30) (Nullable) | `NULL` | Telefono de contacto con prefijo internacional, sanitizado mediante expresiones regulares. |
| `role` | ENUM `user_role` (Not Null) | `'sponsor'` | Rol de acceso del usuario: `admin` (acceso a paneles de gestion), `creator` (creacion de proyectos) o `sponsor` (aportante). |
| `status` | VARCHAR(40) (Not Null) | `'active'` | Estado operativo de la cuenta: `active` (operativa), `suspended` (bloqueada por auditoria) o `closed` (cerrada). |
| `avatar_url` | TEXT (Nullable) | `NULL` | URL de la imagen de perfil del usuario alojada en el almacenamiento de medios. |
| `document_id` | VARCHAR(40) (Nullable) | `NULL` | Numero oficial de documento de identidad (Cedula de Identidad, NIT o Pasaporte). |
| `document_type` | VARCHAR(20) (Nullable) | `'CI'` | Tipo de documento presentado: `CI` (Cedula boliviana), `NIT` (Tributario), `PASSPORT` (Pasaporte) o `FOREIGN` (Extranjero). |
| `organization_name` | VARCHAR(160) (Nullable) | `NULL` | Nombre de la entidad, empresa u ONG cuando el usuario opera en representacion institucional. |
| `kyc_status` | ENUM `kyc_status` (Not Null) | `'pending'` | Estado del expediente KYC: `pending` (en revision), `verified` (aprobado), `rejected` (rechazado) o `requires_documentation` (documento ilegible). |
| `kyc_submitted_at` | TIMESTAMPTZ (Nullable) | `NULL` | Marca de tiempo exacta en la que el usuario envio sus documentos para auditoria. |
| `kyc_reviewed_at` | TIMESTAMPTZ (Nullable) | `NULL` | Marca de tiempo en la que el oficial de compliance emitio el veredicto de aprobacion o rechazo. |
| `kyc_rejection_reason` | TEXT (Nullable) | `NULL` | Motivo formal de rechazo visible para el usuario (ej. "La fecha de vencimiento del carnet esta caducada"). |
| `kyc_notes` | TEXT (Nullable) | `NULL` | Bitacora y notas confidenciales del auditor interno sobre el caso de verificacion. |
| `document_front_url` | TEXT (Nullable) | `NULL` | URL de la imagen frontal del documento de identidad, procesada y sanitizada via HTML5 Canvas y Magic Bytes. |
| `document_back_url` | TEXT (Nullable) | `NULL` | URL del reverso del documento de identidad con validacion binaria contra archivos maliciosos. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora de creacion del registro. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora de la ultima actualizacion del registro. |

---

### 2.2 Tabla: `organizations`
- **Descripcion General:** Almacena los datos legales y tributarios de personas juridicas e instituciones patrocinadoras o ejecutoras de proyectos.
- **Mapeo en UI:** Pantalla 08 (Registro de Creador Organizacional), Paso 7 del Asistente (Verificacion KYB), Vista Publica de Campana.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico de la persona juridica. |
| `legal_name` | VARCHAR(200) (Not Null) | Sin valor por defecto | Razon social legalmente constituida (ej. "Fundacion Bosques Nativos SRL"). |
| `tax_id` | VARCHAR(60) (Unique, Not Null) | Sin valor por defecto | Numero de Identificacion Tributaria (NIT o equivalente nacional). |
| `address` | TEXT (Nullable) | `NULL` | Direccion fiscal o legal de la sede principal de la organizacion. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de registro en el sistema. |

---

### 2.3 Tabla: `organization_members`
- **Descripcion General:** Tabla asociativa que modela la relacion N:M entre usuarios y organizaciones, controlando la membresia y el nivel de gobierno.
- **Mapeo en UI:** Panel de Administracion Organizacional y autorizacion de creacion de campanas.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `organization_id` | UUID (FK -> `organizations.id`) | Sin valor por defecto | Llave foranea que referencia a la organizacion asociada. |
| `user_id` | UUID (FK -> `users.id`) | Sin valor por defecto | Llave foranea que referencia al usuario miembro. |
| `role_in_org` | VARCHAR(60) (Not Null) | Sin valor por defecto | Cargo de gobernanza: `OWNER` (dueno), `LEGAL_REPRESENTATIVE` (representante), `ADMIN` (administrador) o `MEMBER` (colaborador). |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de incorporacion del miembro al equipo. |

---

### 2.4 Tabla: `password_reset_tokens`
- **Descripcion General:** Registro transitorio de tokens de seguridad para recuperacion de acceso.
- **Mapeo en UI:** Pantalla 09 de Visitante (Recuperar Contrasena).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador del registro del token. |
| `user_id` | UUID (FK -> `users.id`, Not Null) | Sin valor por defecto | Usuario que solicito la recuperacion de credenciales. |
| `token_hash` | VARCHAR(255) (Unique, Not Null) | Sin valor por defecto | Hash criptografico del enlace enviado por correo electronico. |
| `expires_at` | TIMESTAMPTZ (Not Null) | Sin valor por defecto | Fecha y hora exacta de vencimiento del token (vigencia de 1 a 2 horas). |
| `used_at` | TIMESTAMPTZ (Nullable) | `NULL` | Marca de tiempo en la que el token fue consumido; previene ataques de reutilizacion. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora de solicitud del restablecimiento. |

---

## 3. MODULO 2: CAMPANAS Y ASISTENTE DEL CREADOR (8 PASOS)

### 3.1 Tabla: `campaigns`
- **Descripcion General:** Entidad fundamental que almacena la configuracion estructural, narrativa, economica y operativa de cada proyecto de crowdfunding.
- **Mapeo en UI:** Pantalla 01 de Creador (Panel), Pantalla 02 (Mis Proyectos), Asistente de 8 Pasos (Crear Campana), Pantalla 04 (Explorador Publico), Pantalla 06 (Detalle de Campana).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico del proyecto. |
| `owner_user_id` | UUID (FK -> `users.id`, Not Null) | Sin valor por defecto | Usuario creador titular y responsable legal del proyecto. |
| `organization_id` | UUID (FK -> `organizations.id`, Nullable) | `NULL` | Organizacion titular cuando el proyecto pertenece a una persona juridica. |
| `campaign_type` | ENUM `campaign_type` (Not Null) | `'donation'` | Modelo de campana: `donation` (donacion pura), `reward` (con recompensas) o `presale` (preventa comercial de productos verdes). |
| `funding_model` | ENUM `funding_model` (Not Null) | `'flexible'` | Regla de fondos: `flexible` (se liquidan los fondos alcanzados) o `all_or_nothing` (solo se liquida si alcanza el 100% de la meta). |
| `title` | VARCHAR(200) (Not Null) | Sin valor por defecto | Titulo publico y descriptivo del proyecto. |
| `slug` | VARCHAR(200) (Unique, Not Null) | Sin valor por defecto | Identificador alfanumerico amigable para URLs publicas (ej. `reforestacion-valle-alto-2026`). |
| `category` | ENUM `campaign_category` (Not Null) | Sin valor por defecto | Categoria tematica: `social`, `ambiental`, `productivo`, `educacion`, `salud`, `cultura` u `otro`. |
| `location` | VARCHAR(160) (Nullable) | `NULL` | Ubicacion geografica del impacto (ej. "Tiquipaya, Cochabamba, Bolivia"). |
| `short_summary` | VARCHAR(500) (Nullable) | `NULL` | Resumen ejecutivo visible en tarjetas de exploracion y motores de busqueda. |
| `cover_image_url` | TEXT (Nullable) | `NULL` | URL de la imagen de portada principal optimizada para alta velocidad de carga. |
| `video_url` | TEXT (Nullable) | `NULL` | Enlace a video promocional (YouTube o Vimeo) insertado en el encabezado. |
| `problem` | TEXT (Nullable) | `NULL` | Descripcion narrativa del problema socio-ambiental detectado (Paso 3 del wizard). |
| `solution` | TEXT (Nullable) | `NULL` | Descripcion narrativa de la solucion propuesta y ejecucion planificada. |
| `beneficiaries` | TEXT (Nullable) | `NULL` | Detalle cuantitativo y cualitativo de la poblacion o ecosistemas beneficiados. |
| `expected_impact` | TEXT (Nullable) | `NULL` | Metas de impacto esperadas a corto y largo plazo. |
| `goal_amount` | DECIMAL(12,2) (Not Null) | Sin valor por defecto | Meta economica a recaudar en la moneda de la plataforma. |
| `current_amount` | DECIMAL(12,2) (Not Null) | `0.00` | Monto monetario recaudado acumulado de pagos confirmados. |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Codigo ISO de la moneda de recaudacion (BOB = Bolivianos). |
| `min_contribution` | DECIMAL(12,2) (Nullable) | `NULL` | Monto minimo aceptado para realizar un aporte a la campana. |
| `duration_days` | INTEGER (Nullable) | `NULL` | Plazo total de duracion de la campana en dias calendario. |
| `start_date` | DATE (Nullable) | `NULL` | Fecha de inicio oficial de la recaudacion. |
| `end_date` | DATE (Nullable) | `NULL` | Fecha de cierre y finalizacion de recaudacion. |
| `status` | ENUM `campaign_status` (Not Null) | `'draft'` | Estado del ciclo de vida: `draft`, `pending_review`, `approved`, `changes_requested`, `rejected`, `published`, `completed`, `cancelled`. |
| `builder_step` | SMALLINT (Not Null) | `1` | Ultimo paso completado por el creador en el asistente (1 al 8); permite retomar borradores. |
| `published_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora en la que la campana fue abierta al publico. |
| `cancellation_reason` | TEXT (Nullable) | `NULL` | Justificacion documentada en caso de que la campana sea cancelada o suspendida. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de creacion del borrador. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de la ultima modificacion en datos o estado. |

---

### 3.2 Tabla: `campaign_media`
- **Descripcion General:** Galeria multimedia complementaria para fotos y videos del proyecto.
- **Mapeo en UI:** Paso 3 del Asistente y carrusel de la Pantalla 06 (Detalle Publico).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico del recurso multimedia. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto al que pertenece el archivo multimedia. |
| `url` | TEXT (Not Null) | Sin valor por defecto | Direccion de acceso al archivo multimedia. |
| `media_type` | VARCHAR(20) (Not Null) | `'image'` | Tipo de contenido: `'image'` o `'video'`. |
| `position` | INTEGER (Not Null) | `0` | Numero de orden para ordenar visualmente la galeria en el frontend. |

---

### 3.3 Tabla: `campaign_budgets`
- **Descripcion General:** Partidas y rubros del presupuesto operativo para garantizar transparencia y control de cuadratura.
- **Mapeo en UI:** Paso 4 del Asistente (Plan y Presupuesto), Auditoria del Revisor y Rendicion de Cuentas.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador del rubro presupuestario. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto al que se asigna el gasto. |
| `category` | VARCHAR(80) (Not Null) | Sin valor por defecto | Categoria contable: `'Materiales'`, `'Produccion'`, `'Personal'`, `'Logistica'`, `'Equipamiento'`, etc. |
| `description` | VARCHAR(300) (Not Null) | Sin valor por defecto | Concepto detallado del gasto (ej. "Compra de 1,000 plantines de pino nativo"). |
| `quantity` | DECIMAL(12,2) (Not Null) | `1.00` | Cantidad de unidades requeridas. |
| `unit_price` | DECIMAL(12,2) (Nullable) | `NULL` | Costo estimado por unidad. |
| `planned_amount` | DECIMAL(12,2) (Not Null) | Sin valor por defecto | Importe total presupuestado para la partida (`quantity * unit_price`). La suma total debe cuadrar con la meta. |
| `display_order` | SMALLINT (Not Null) | `0` | Orden de presentacion en las tablas de presupuesto. |
| `notes` | TEXT (Nullable) | `NULL` | Notas explicativas, justificaciones de costos o cotizaciones de respaldo. |

---

### 3.4 Tabla: `campaign_activities`
- **Descripcion General:** Cronograma de trabajo operativo e hitos comprometidos por el creador.
- **Mapeo en UI:** Paso 4 del Asistente (Cronograma) y pestana de avance en Pantalla 06 (Detalle Publico).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador de la actividad. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto asociado. |
| `name` | VARCHAR(200) (Not Null) | Sin valor por defecto | Titulo de la actividad (ej. "Preparacion de terreno y cercado perimetral"). |
| `description` | TEXT (Nullable) | `NULL` | Explicacion detallada de las acciones tecnicas a ejecutar. |
| `responsible_name` | VARCHAR(160) (Nullable) | `NULL` | Nombre de la persona o equipo responsable de la ejecucion. |
| `planned_start_on` | DATE (Nullable) | `NULL` | Fecha planificada de inicio. |
| `planned_end_on` | DATE (Nullable) | `NULL` | Fecha planificada de finalizacion. |
| `status` | ENUM `progress_status` (Not Null) | `'planned'` | Estado operativo: `planned` (planificado), `in_progress` (en ejecucion), `completed` (completado), `delayed` (demorado) o `cancelled` (cancelado). |
| `progress_percent` | SMALLINT (Not Null) | `0` | Porcentaje de avance de la actividad (entero de 0 a 100). |
| `display_order` | SMALLINT (Not Null) | `0` | Orden cronologico de la actividad en la linea de tiempo. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de creacion de la actividad. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de actualizacion del avance. |

---

### 3.5 Tabla: `campaign_risks`
- **Descripcion General:** Matriz de analisis y mitigacion de riesgos del proyecto.
- **Mapeo en UI:** Paso 4 del Asistente y pestana de confianza en Detalle Publico.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico del riesgo registrado. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto asociado. |
| `title` | VARCHAR(200) (Not Null) | Sin valor por defecto | Descripcion sintetica de la amenaza (ej. "Sequia prolongada en epoca de siembra"). |
| `description` | TEXT (Nullable) | `NULL` | Contexto del riesgo y factores de vulnerabilidad. |
| `likelihood` | VARCHAR(40) (Nullable) | `NULL` | Nivel de probabilidad: `'Baja'`, `'Media'`, `'Alta'`. |
| `impact` | VARCHAR(40) (Nullable) | `NULL` | Magnitud del impacto estimado: `'Bajo'`, `'Medio'`, `'Critico'`. |
| `mitigation` | TEXT (Not Null) | Sin valor por defecto | Plan de accion preventivo y correctivo para mitigar el riesgo. |
| `display_order` | SMALLINT (Not Null) | `0` | Orden de aparicion en la lista. |

---

### 3.6 Tabla: `campaign_rewards`
- **Descripcion General:** Niveles de recompensa, beneficios o preventas ofrecidos a los patrocinadores segun su volumen de aporte.
- **Mapeo en UI:** Paso 6 del Asistente (Recompensas), Pantalla 03 de Patrocinador (Seleccionar Aporte) y Checkout.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico del nivel de recompensa. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto al que pertenece el incentivo. |
| `title` | VARCHAR(200) (Not Null) | Sin valor por defecto | Titulo del paquete (ej. "Pack Semillas Nativas + Certificado Digital"). |
| `description` | TEXT (Not Null) | Sin valor por defecto | Descripcion pormenorizada de todos los articulos o beneficios que incluye. |
| `min_amount` | DECIMAL(12,2) (Not Null) | Sin valor por defecto | Importe minimo que el patrocinador debe aportar para acceder a esta recompensa. |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Moneda del beneficio. |
| `quantity_total` | INTEGER (Nullable) | `NULL` | Cupo total. `NULL` = ilimitado. No es el saldo restante. |
| `quantity_claimed` | INTEGER (Not Null) | `0` | Cupos adjudicados por aportes confirmados. Llegar al total no cambia `is_active`. |
| `estimated_delivery_on`| DATE (Nullable) | `NULL` | Fecha estimada en la que el creador realizara la entrega o despacho del incentivo. |
| `image_url` | TEXT (Nullable) | `NULL` | Imagen representativa del producto o beneficio. |
| `is_active` | BOOLEAN (Not Null) | `true` | Habilita la oferta para aportes nuevos. Agotarse no lo pone en `false`. El creador lo cambia con `PATCH /campaigns/:campaignId/rewards/:rewardId/active`, sin alterar `quantity_claimed`. |
| `display_order` | SMALLINT (Not Null) | `0` | Posicion jerarquica en la lista de recompensas. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de creacion del nivel. |

---

### 3.7 Tabla: `campaign_impacts`
- **Descripcion General:** Metricas cuantitativas e indicadores clave de desempeno ambiental y social (KPIs Verdes).
- **Mapeo en UI:** Paso 3 del Asistente y vista principal de impacto en Detalle Publico.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador del indicador de impacto. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto asociado. |
| `name` | VARCHAR(200) (Not Null) | Sin valor por defecto | Nombre de la metrica (ej. "Hectareas de bosque protegidas"). |
| `unit` | VARCHAR(60) (Nullable) | `NULL` | Unidad fisica de medicion (ej. "hectareas", "toneladas CO2", "arboles"). |
| `baseline_value` | DECIMAL(14,2) (Nullable) | `NULL` | Medicion inicial de partida antes de iniciar el proyecto. |
| `target_value` | DECIMAL(14,2) (Nullable) | `NULL` | Meta de impacto que se espera alcanzar con los fondos recaudados. |
| `achieved_value` | DECIMAL(14,2) (Nullable) | `NULL` | Valor real verificado y reportado durante la ejecucion de la campana. |
| `display_order` | SMALLINT (Not Null) | `0` | Orden de visualizacion en el panel de metricas. |

---

## 4. MODULO 3: AUDITORIA Y REVISION DE CAMPANAS (ROL REVIEWER)

### 4.1 Tabla: `campaign_reviews`
- **Descripcion General:** Rondas de evaluacion formal realizadas por el personal de auditoria interna de Brotar.
- **Mapeo en UI:** Pantalla 08 de Administracion (Revision de Campanas) y notificaciones al creador.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador de la ronda de revision. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto evaluado. |
| `round` | SMALLINT (Not Null) | `1` | Numero correlativo de la ronda de evaluacion (1, 2, 3...). |
| `reviewer_user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Auditor interno de Brotar asignado a la evaluacion. |
| `decision` | ENUM `review_decision` (Not Null) | `'pending'` | Dictamen de la ronda: `pending` (en evaluacion), `approved` (aprobada), `changes_requested` (con cambios solicitados) o `rejected` (rechazada definitivamente). |
| `summary` | TEXT (Nullable) | `NULL` | Resumen ejecutivo del dictamen y conclusiones generales del auditor. |
| `internal_notes` | TEXT (Nullable) | `NULL` | Bitacora privada no visible para el creador (para uso exclusivo del comite de Brotar). |
| `assigned_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora en la que la campana fue turnada al revisor. |
| `decided_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora en la que se emitio el veredicto oficial. |

---

### 4.2 Tabla: `campaign_review_observations`
- **Descripcion General:** Observaciones puntuales asociadas a secciones especificas del asistente de creacion.
- **Mapeo en UI:** Pantalla 08 de Administracion y Paso 8 del Asistente (Lista interactiva de correcciones).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador de la observacion puntual. |
| `review_id` | UUID (FK -> `campaign_reviews.id`, Not Null) | Sin valor por defecto | Ronda de revision a la que pertenece la observacion. |
| `section` | VARCHAR(80) (Not Null) | Sin valor por defecto | Seccion del wizard observada: `'general_info'`, `'story'`, `'budget'`, `'activities'`, `'rewards'`, `'kyc'`. |
| `field_path` | VARCHAR(160) (Nullable) | `NULL` | Campo especifico señalado (ej. `budget_items[2].planned_amount`). |
| `severity` | ENUM `observation_severity` (Not Null) | `'INFO'` | Nivel de criticidad: `INFO` (sugerencia de estilo), `MINOR` (ajuste menor no bloqueante), `BLOCKER` (error critico que impide la aprobacion). |
| `status` | ENUM `observation_status` (Not Null) | `'OPEN'` | Estado de resolucion: `OPEN` (pendiente), `ADDRESSED` (atendida por el creador), `ACCEPTED` (aprobada por el revisor), `DISMISSED` (desestimada). |
| `message` | TEXT (Not Null) | Sin valor por defecto | Indicacion detallada con las correcciones exactas que debe realizar el creador. |
| `resolution_note` | TEXT (Nullable) | `NULL` | Respuesta o aclaracion emitida por el creador al corregir la observacion. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora de emision de la observacion. |
| `resolved_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora en la que el revisor valido la subsanacion. |

---

## 5. MODULO 4: FINANZAS, APORTES, PAGOS Y DESEMBOLSOS

### 5.1 Tabla: `contributions`
- **Descripcion General:** Registro central de transacciones financieras correspondientes a los aportes de patrocinadores.
- **Mapeo en UI:** Pantallas 03, 04 y 05 de Patrocinador (Seleccion, Checkout, Pago), Pantalla 02 (Mis Aportes), Pantalla 10 de Administracion (Finanzas).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico de la transaccion en base de datos. |
| `reference_code` | VARCHAR(30) (Unique, Not Null) | Sin valor por defecto | Codigo publico y legible de recibo oficial (ej. `BRT-C-0004521`). |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto que recibe el financiamiento. |
| `sponsor_user_id` | UUID (FK -> `users.id`, Not Null) | Sin valor por defecto | Usuario patrocinador que efectua el aporte. |
| `reward_id` | UUID (FK -> `campaign_rewards.id`, Nullable) | `NULL` | Nivel de recompensa seleccionado por el patrocinador (opcional). |
| `amount` | DECIMAL(12,2) (Not Null) | Sin valor por defecto | Importe monetario bruto aportado por el patrocinador. |
| `commission_rate` | DECIMAL(5,2) (Not Null) | `5.00` | Porcentaje de comision de servicio de Brotar aplicado al aporte (5.00%). |
| `commission_amount`| DECIMAL(12,2) (Not Null) | `0.00` | Importe en dinero retenido por la plataforma (`amount * (commission_rate / 100)`). |
| `net_amount` | DECIMAL(12,2) (Not Null) | `0.00` | Importe neto destinado directamente a la ejecucion del proyecto (`amount - commission_amount`). |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Moneda del aporte. |
| `status` | ENUM `contribution_status` (Not Null) | `'pending'` | Estado transaccional: `pending` (iniciado), `confirmed` (pagado con exito), `expired` (vencido), `failed` (rechazado por pasarela), `refunded` (devuelto). |
| `is_anonymous` | BOOLEAN (Not Null) | `false` | Indica si el patrocinador decidio ocultar su identidad en el muro publico de aportantes. |
| `supporter_message` | TEXT (Nullable) | `NULL` | Mensaje de aliento o dedicatoria redactado por el patrocinador durante el checkout. |
| `supporter_message_visibility` | ENUM `visibility_scope` (Not Null) | `'PUBLIC'` | Visibilidad del mensaje: `PUBLIC` (visible para todos) o `SUPPORTERS_ONLY` (visible solo para miembros). |
| `payment_method` | VARCHAR(60) (Nullable) | `NULL` | Medio de pago utilizado: `'QR Simple'`, `'Tarjeta de Debito/Credito'`, `'Transferencia ACH'`. |
| `gateway_reference`| VARCHAR(200) (Unique, Nullable) | `NULL` | Identificador de transaccion o ID de autorizacion devuelto por la pasarela de pagos. |
| `paid_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora exacta de confirmacion del cobro. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora de generacion del intento de aporte. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de actualizacion del estado de pago. |

---

### 5.2 Tabla: `reward_fulfillments`
- **Descripcion General:** Control logico y operativo del despacho y entrega de recompensas a patrocinadores.
- **Mapeo en UI:** Pantalla 06 de Patrocinador (Seguimiento del Proyecto) y panel de entregas del creador.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador del seguimiento de entrega. |
| `contribution_id` | UUID (FK -> `contributions.id`, Unique, Not Null) | Sin valor por defecto | Aporte confirmado que otorgo el derecho a la recompensa (relacion 1:1). |
| `status` | ENUM `reward_fulfillment_status` (Not Null) | `'pending'` | Estado logistico: `pending` (pendiente de preparacion), `in_progress` (en despacho), `fulfilled` (entregado), `cancelled` (cancelado). |
| `fulfilled_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha en la que el patrocinador confirmo la recepcion de su incentivo. |
| `notes` | TEXT (Nullable) | `NULL` | Guia de transporte, codigo de rastreo o notas de entrega fisica. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de creacion del registro. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de la ultima actualizacion logistica. |

---

### 5.3 Tabla: `refunds`
- **Descripcion General:** Registro contable formal y trazabilidad de reembolsos emitidos a patrocinadores.
- **Mapeo en UI:** Pantalla 10 de Administracion (Finanzas - Devoluciones).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador de la operacion de devolucion. |
| `contribution_id` | UUID (FK -> `contributions.id`, Not Null) | Sin valor por defecto | Aporte original que se esta reembolsando. |
| `amount` | DECIMAL(12,2) (Not Null) | Sin valor por defecto | Importe monetario exacto devuelto al patrocinador. |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Moneda del reembolso. |
| `reason_code` | VARCHAR(80) (Nullable) | `NULL` | Codigo normativo de anulacion: `'CAMPAIGN_CANCELLED'`, `'ALL_OR_NOTHING_FAILED'`, `'DISPUTE_RESOLVED'`, `'FRAUD_PREVENTION'`. |
| `reason_detail` | TEXT (Nullable) | `NULL` | Justificacion detallada de la devolucion. |
| `status` | ENUM `refund_status` (Not Null) | `'requested'` | Estado de la devolucion: `requested` (solicitada), `processing` (en proceso bancario), `refunded` (completada con exito), `failed` (fallida). |
| `requested_by_user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Usuario o patrocinador que abrio la solicitud de devolucion. |
| `approved_by_user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Oficial de finanzas que autorizo el desembolso de retorno. |
| `processed_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora en la que la pasarela ejecuto el reembolso hacia la cuenta origen. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de registro de la solicitud. |

---

### 5.4 Tabla: `payout_accounts`
- **Descripcion General:** Cuentas bancarias verificadas de creadores individuales o instituciones para la recepcion de fondos recaudados.
- **Mapeo en UI:** Paso 7 del Asistente (Cuenta Destino), Pantalla 09 de Admin (Compliance) y Pantalla 10 (Desembolsos).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico de la cuenta bancaria. |
| `user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Creador titular de la cuenta (para personas naturales). |
| `organization_id` | UUID (FK -> `organizations.id`, Nullable) | `NULL` | Organizacion titular (para personas juridicas). |
| `account_holder_name` | VARCHAR(200) (Not Null) | Sin valor por defecto | Nombre completo o razon social del titular registrado en la entidad bancaria. |
| `bank_name` | VARCHAR(160) (Not Null) | Sin valor por defecto | Entidad financiera (ej. "Banco Union", "Banco Nacional de Bolivia", "Banco BCP"). |
| `account_type` | VARCHAR(40) (Not Null) | Sin valor por defecto | Modalidad de cuenta: `'Caja de Ahorro'`, `'Cuenta Corriente'`. |
| `account_number` | VARCHAR(80) (Not Null) | Sin valor por defecto | Numero de cuenta bancaria nacional. |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Moneda de la cuenta. |
| `status` | ENUM `payout_account_status` (Not Null) | `'pending'` | Estado de validacion: `pending` (en revision), `verified` (aprobada por compliance), `rejected` (datos no coincidentes). |
| `is_default` | BOOLEAN (Not Null) | `false` | Indica si es la cuenta preferencial para desembolsos automaticos. |
| `verified_by_user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Auditor que cotejo la titularidad de la cuenta contra el carnet/NIT. |
| `verified_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha de aprobacion de la cuenta bancaria. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de registro de la cuenta. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de ultima modificacion. |

---

### 5.5 Tabla: `disbursements`
- **Descripcion General:** Liquidaciones y transferencias bancarias de fondos netos hacia los creadores de campanas exitosas.
- **Mapeo en UI:** Pantalla 10 de Administracion (Finanzas - Desembolsos).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador de la liquidacion. |
| `disbursement_number` | VARCHAR(30) (Unique, Not Null) | Sin valor por defecto | Codigo formal de transferencia bancaria (ej. `BRT-P-000084`). |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Campana que genera los fondos a transferir. |
| `payout_account_id` | UUID (FK -> `payout_accounts.id`, Not Null) | Sin valor por defecto | Cuenta bancaria de destino validada donde se deposita el dinero. |
| `requested_by_user_id` | UUID (FK -> `users.id`, Not Null) | Sin valor por defecto | Creador titular que solicita la liberacion de los fondos. |
| `gross_amount` | DECIMAL(12,2) (Not Null) | Sin valor por defecto | Total bruto recaudado por la campana objeto de liquidacion. |
| `commission_rate` | DECIMAL(5,2) (Not Null) | `5.00` | Porcentaje de deduccion por servicio de plataforma Brotar (5.00%). |
| `commission_amount` | DECIMAL(12,2) (Not Null) | `0.00` | Monto monetario deducido por Brotar en concepto de comision. |
| `net_amount` | DECIMAL(12,2) (Not Null) | `0.00` | Importe neto efectivo transferido a la cuenta del creador (`gross_amount - commission_amount`). |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Moneda de liquidacion. |
| `status` | ENUM `disbursement_status` (Not Null) | `'pending'` | Estado del desembolso: `pending` (en espera de firma), `approved` (autorizado por tesoreria), `processing` (en transito ACH), `completed` (depositado con exito), `failed` (rechazo bancario). |
| `reviewed_by_user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Oficial de finanzas que aprobo la transferencia. |
| `reviewed_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha de autorizacion contable. |
| `processed_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora en la que se confirmo la acreditacion interbancaria. |
| `failure_reason` | TEXT (Nullable) | `NULL` | Detalle del error bancario en caso de rechazo de transferencia. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de emision de la orden de desembolso. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de actualizacion del estado contable. |

---

### 5.6 Tabla: `payment_reconciliations`
- **Descripcion General:** Modulo de conciliacion y cuadratura entre los registros de base de datos y los extractos de la pasarela de pagos.
- **Mapeo en UI:** Pantalla 10 de Administracion (Conciliacion de Operaciones).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador del registro de conciliacion. |
| `contribution_id` | UUID (FK -> `contributions.id`, Nullable) | `NULL` | Transaccion interna vinculada a la discrepancia (si existe). |
| `gateway_reference` | VARCHAR(200) (Not Null) | Sin valor por defecto | Identificador reportado en el extracto de la pasarela. |
| `discrepancy_type` | ENUM `discrepancy_type` (Not Null) | Sin valor por defecto | Tipologia del error: `amount_mismatch` (diferencia de monto), `missing_in_gateway` (no existe en pasarela), `missing_internally` (pago en pasarela no registrado en Brotar), `duplicated` (cobro duplicado). |
| `internal_amount` | DECIMAL(12,2) (Nullable) | `NULL` | Importe registrado en el sistema Brotar. |
| `gateway_amount` | DECIMAL(12,2) (Nullable) | `NULL` | Importe efectivamente cobrado segun el proveedor de pagos. |
| `currency` | VARCHAR(6) (Not Null) | `'BOB'` | Moneda de la transaccion. |
| `status` | ENUM `reconciliation_status` (Not Null) | `'pending'` | Estado del caso: `pending` (pendiente de analisis), `resolved` (cuadrado y corregido), `ignored` (desestimado justificadamente). |
| `resolved_by_user_id` | UUID (FK -> `users.id`, Nullable) | `NULL` | Auditor de finanzas que realizo el ajuste contable. |
| `resolution_note` | TEXT (Nullable) | `NULL` | Explicacion tecnica del asiento de ajuste o correccion realizada. |
| `detected_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora en la que el sistema o auditor detecto la discrepancia. |
| `resolved_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha en la que se dio por resuelto el ajuste. |

---

## 6. MODULO 5: RENDICION DE CUENTAS, AVANCES Y EVIDENCIAS

### 6.1 Tabla: `campaign_updates`
- **Descripcion General:** Bitacora publica o para patrocinadores con noticias y comunicados de avance emitidos por el creador.
- **Mapeo en UI:** Pantalla 06 de Patrocinador (Seguimiento del Proyecto - Pestana Novedades).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador de la actualizacion. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto al que corresponde la publicacion. |
| `author_user_id` | UUID (FK -> `users.id`, Not Null) | Sin valor por defecto | Creador o miembro que redacto la publicacion. |
| `title` | VARCHAR(200) (Not Null) | Sin valor por defecto | Titulo del comunicado (ej. "Llegada de plantines a la comunidad"). |
| `body` | TEXT (Not Null) | Sin valor por defecto | Cuerpo del texto con detalles del avance operativo. |
| `visibility` | ENUM `visibility_scope` (Not Null) | `'PUBLIC'` | Nivel de acceso: `PUBLIC` (abierto a todo el mundo) o `SUPPORTERS_ONLY` (exclusivo para quienes aportaron fondos). |
| `published_at` | TIMESTAMPTZ (Nullable) | `NULL` | Fecha y hora de publicacion en el muro del proyecto. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de creacion del borrador del comunicado. |
| `updated_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de ultima edicion. |

---

### 6.2 Tabla: `evidences`
- **Descripcion General:** Repositorio de evidencias fotograficas y audiovisuales de impacto directo.
- **Mapeo en UI:** Pantalla 06 de Patrocinador y seccion de transparencia de campana.

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador unico de la evidencia. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto auditado. |
| `title` | VARCHAR(200) (Not Null) | Sin valor por defecto | Descripcion del respaldo (ej. "Acta comunitaria de entrega de bombas solares"). |
| `description` | TEXT (Nullable) | `NULL` | Detalle contextual sobre la evidencia. |
| `external_url` | TEXT (Nullable) | `NULL` | Enlace a la fotografia, video de dron o documento en PDF. |
| `recorded_on` | DATE (Nullable) | `NULL` | Fecha en la que se registro el hecho en campo. |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha de subida a la plataforma. |

---

### 6.3 Tablas: `accountability_reports` y `accountability_expenses`
- **Descripcion General:** Modulo formal de rendicion de cuentas post-campana para contrastar dinero gastado contra el presupuesto original.
- **Mapeo en UI:** Panel de Creador (Rendicion) y seccion de Transparencia para patrocinadores.

| Tabla | Campo | Tipo y Restricciones | Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `accountability_reports` | `id` | UUID (Primary Key) | Identificador unico del informe de rendicion. |
| `accountability_reports` | `campaign_id` | UUID (FK -> `campaigns.id`) | Proyecto objeto de rendicion de cuentas. |
| `accountability_reports` | `period_label`| VARCHAR(80) | Etiqueta del periodo (ej. "Informe Bimestral 1 - Siembra"). |
| `accountability_reports` | `funds_received` | DECIMAL(12,2) | Fondos totales desembolsados recibidos en la cuenta bancaria. |
| `accountability_reports` | `funds_spent` | DECIMAL(12,2) | Total de gastos justificados con comprobantes. |
| `accountability_reports` | `balance` | DECIMAL(12,2) | Saldo monetario remanente disponible (`funds_received - funds_spent`). |
| `accountability_reports` | `narrative` | TEXT | Explicacion de resultados logrados durante el periodo reportado. |
| `accountability_expenses`| `id` | UUID (Primary Key) | Identificador unico de la partida de gasto ejecutada. |
| `accountability_expenses`| `report_id` | UUID (FK -> `reports.id`) | Informe al que pertenece el gasto. |
| `accountability_expenses`| `budget_item_id` | UUID (FK -> `budgets.id`, Nullable) | Partida del presupuesto inicial que se esta ejecutando (trazabilidad vs presupuesto). |
| `accountability_expenses`| `description` | VARCHAR(300) | Concepto facturado del gasto. |
| `accountability_expenses`| `spent_amount`| DECIMAL(12,2) | Importe exacto pagado segun la factura. |
| `accountability_expenses`| `spent_on` | DATE | Fecha de emision del recibo o factura oficial. |
| `accountability_expenses`| `supplier` | VARCHAR(200) | Proveedor o empresa a la que se compro el bien o servicio. |
| `accountability_expenses`| `receipt_number` | VARCHAR(80) | Numero oficial de factura o autorizacion tributaria. |
| `accountability_expenses`| `receipt_image_url` | TEXT | Fotografia o PDF del comprobante de respaldo auditado. |

---

## 7. MODULO 6: SOPORTE, DISPUTAS Y PROYECTOS FAVORITOS

### 7.1 Tablas: `disputes` y `dispute_messages`
- **Descripcion General:** Gestion integral de controversias, incidencias y reclamos entre patrocinadores, creadores y la plataforma Brotar.
- **Mapeo en UI:** Pantalla 06 de Patrocinador ("Reportar un problema") y Pantalla 11 de Administracion (Disputas y Soporte).

| Tabla | Campo | Tipo y Restricciones | Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `disputes` | `id` | UUID (Primary Key) | Identificador unico del caso o ticket. |
| `disputes` | `code` | VARCHAR(30) (Unique) | Codigo publico de seguimiento (ej. `BRT-D-000219`). |
| `disputes` | `campaign_id` | UUID (FK -> `campaigns.id`) | Proyecto sobre el cual se levanta el reclamo. |
| `disputes` | `reporter_user_id` | UUID (FK -> `users.id`) | Patrocinador o creador que apertura la queja formal. |
| `disputes` | `contribution_id` | UUID (FK -> `contributions.id`, Nullable) | Transaccion monetaria especifica en litigio (si aplica). |
| `disputes` | `dispute_type` | ENUM `dispute_type` | Categoria del problema: `payment_not_recognized`, `reward_not_received`, `metrics_discrepancy`, `project_not_executed`, `refund_request`, `other`. |
| `disputes` | `description` | TEXT | Explicacion formal de los hechos y pretension del usuario. |
| `disputes` | `status` | ENUM `dispute_status` | Estado del caso: `open` (abierto), `in_review` (en investigacion), `resolved` (resuelto), `rejected` (desestimado). |
| `disputes` | `priority` | ENUM `dispute_priority` | Nivel de urgencia en la bandeja de administracion: `low`, `medium`, `high`. |
| `disputes` | `assigned_to_user_id` | UUID (FK -> `users.id`, Nullable) | Agente de soporte de Brotar asignado a mediar el conflicto. |
| `disputes` | `resolution` | TEXT | Dictamen final y medidas adoptadas (ej. "Reembolso procesado tras comprobar no entrega"). |
| `dispute_messages` | `id` | UUID (Primary Key) | Identificador unico del mensaje en el hilo del caso. |
| `dispute_messages` | `dispute_id` | UUID (FK -> `disputes.id`) | Caso al que pertenece el mensaje (hilo interactivo). |
| `dispute_messages` | `author_user_id` | UUID (FK -> `users.id`, Nullable) | Usuario emisor (`NULL` indica mensaje automatico del sistema Brotar). |
| `dispute_messages` | `body` | TEXT | Contenido del mensaje, aclaracion o respuesta. |
| `dispute_messages` | `is_system` | BOOLEAN | Verdadero si el mensaje es una notificacion generada por el sistema. |
| `dispute_messages` | `created_at` | TIMESTAMPTZ | Fecha y hora exacta de envio del mensaje. |

---

### 7.2 Tabla: `campaign_bookmarks`
- **Descripcion General:** Marcadores de proyectos seguidos o favoritos por parte de los patrocinadores.
- **Mapeo en UI:** Pantalla 01 de Patrocinador (Seccion Proyectos Seguidos y alertas de nuevas actualizaciones).

| Campo | Tipo de Dato y Restricciones | Valor por Defecto | Descripcion Funcional y Uso Real en el Sistema |
| :--- | :--- | :--- | :--- |
| `id` | UUID (Primary Key) | `gen_random_uuid()` | Identificador del marcador guardado. |
| `user_id` | UUID (FK -> `users.id`, Not Null) | Sin valor por defecto | Usuario patrocinador que marco la campana. |
| `campaign_id` | UUID (FK -> `campaigns.id`, Not Null) | Sin valor por defecto | Proyecto marcado. |
| `kind` | ENUM `bookmark_kind` (Not Null) | `'FAVORITE'` | Modalidad de interaccion: `'FAVORITE'` (marcado como preferido) o `'FOLLOW'` (suscrito a notificaciones de avances). |
| `created_at` | TIMESTAMPTZ (Not Null) | `now()` | Fecha y hora en la que el usuario guardo el proyecto. |

---

## 8. MATRIZ DE INTEGRIDAD Y REGLAS DE NEGOCIO

1. **Cuadratura Presupuestaria Obligatoria:**
   - La suma de todas las partidas en `campaign_budgets.planned_amount` de una campana debe ser igual o menor a `campaigns.goal_amount`. Si la suma difiere, el sistema emite una alerta y el Revisor puede marcar la observacion con severidad `BLOCKER`.

2. **Control de Inventario e Idempotencia en Recompensas:**
   - Cada vez que un aporte (`contributions`) con `reward_id` cambia su estado a `confirmed`, el campo `campaign_rewards.quantity_claimed` se incrementa de forma atomica en 1 dentro de una transaccion ACID. Si el total no es `NULL` y `quantity_claimed` lo alcanza, no se admite otra adjudicacion, pero `is_active` no cambia. `quantity_total` `NULL` es cupo ilimitado. El `CHECK` `chk_campaign_rewards_quantity_claimed` esta escrito en `backend/prisma/sql/campaign_rewards/01_create_campaign_rewards.sql` para tablas nuevas; `schema.prisma` no lo representa y este diccionario no afirma que ya este aplicado en una base concreta.

3. **Inmunidad de Seguridad en Carga de Archivos (KYC y Media):**
   - Todos los documentos cargados (`document_front_url`, `document_back_url`, `cover_image_url`) son procesados en el navegador a traves de HTML5 Canvas re-encoding (eliminando metadatos EXIF y scripts embebidos) y validados en el servidor mediante inspeccion binaria de Magic Bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `52 49 46 46`), rechazando cualquier payload poliglota o script camuflado.

4. **Regla de Desembolso y Comision de Plataforma:**
   - Brotar retiene exactamente el 5% de comision de servicio (`commission_rate = 5.00`) sobre el monto bruto recaudado. En los desembolsos (`disbursements`), el valor `net_amount` transferido al creador se calcula de forma inmutable mediante la formula: `net_amount = gross_amount - (gross_amount * 0.05)`.
