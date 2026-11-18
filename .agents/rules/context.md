---
trigger: always_on
---

# CONTEXTO DEL SISTEMA: BROTAR – EQUIPO 3 (PATROCINADOR Y ADMINISTRACIÓN)

## 1. MISIÓN Y LÍMITES DE ALCANCE
- **Misión del Equipo 3:** Desarrollar el flujo económico del patrocinador (quien aporta dinero) y las herramientas internas de gestión para el personal de Brotar (quien revisa, verifica, concilia y resuelve)[cite: 2].
- **Total de vistas:** 11 pantallas (6 del Patrocinador y 5 de Administración)[cite: 2].
- **Fuera de alcance (NO codificar):**
  - Landing page, exploración pública de proyectos, búsqueda y detalle público de campaña (Equipos 1A y 1B)[cite: 2].
  - Login y registro (Equipos 1A y 1B; se asume sesión iniciada)[cite: 2].
  - Asistente de creación de campañas del creador (Equipos 1C y 2)[cite: 2].

---

## 2. REGLAS TÉCNICAS Y DE ARQUITECTURA
- **Frontend (Bun + React + TypeScript):**
  - Screaming Architecture (Feature-First)[cite: 1].
  - Código del Patrocinador ubicado en `frontend/src/features/sponsor/`[cite: 1, 2].
  - Código de Administración ubicado en `frontend/src/features/administration/`[cite: 1, 2].
  - Componentes transversales en `frontend/src/shared/`[cite: 1].
- **Backend (pnpm + NestJS + TypeScript + Prisma + PostgreSQL):**
  - Arquitectura Hexagonal estricta: `domain/`, `application/`, `infrastructure/`[cite: 1].
  - Módulos a intervenir: `payments`, `verification`, `campaigns` (para revisión) y soporte/disputas[cite: 1, 2].
  - Entidades de dominio puras, puertos para repositorios y adaptadores de Prisma confinados a infraestructura[cite: 1].

---

## 3. ESPECIFICACIÓN DE PANTALLAS: BLOQUE PATROCINADOR (6 VISTAS)

### 01. Panel del Patrocinador (Dashboard)
- **Ruta:** `features/sponsor/dashboard` (o home de patrocinador).
- **Contenido:** Resumen de aportes hechos, proyectos seguidos, últimas actualizaciones recibidas, accesos rápidos a explorar y a "Mis aportes"[cite: 2].
- **Estados:** Normal y Estado Vacío (sin aportes aún, con CTA para explorar)[cite: 2].

### 02. Mis Aportes (Historial)
- **Contenido:** Tabla/tarjetas con proyecto apoyado, monto, fecha, estado de la operación, comprobante y filtros por fecha/estado[cite: 2].
- **Estados de la operación:** `CONFIRMED`, `PENDING`, `REJECTED`, `REFUNDED`[cite: 2].
- **Navegación:** Conecta con el Seguimiento del Proyecto[cite: 2].

### 03. Seleccionar Aporte
- **Contenido:** Modos de apoyo (donación con monto libre, selección de recompensa por niveles/cupos, preventa) y resumen de lo que recibe el usuario[cite: 2].
- **Casos borde:** Recompensa agotada/sin stock y validación de monto inferior al mínimo requerido[cite: 2].
- **Navegación:** Viene de Detalle de Proyecto -> lleva a Checkout[cite: 2].

### 04. Checkout
- **Contenido:** Resumen claro previo al pago, desglose del monto total, recompensa asociada, términos y condiciones, formulario de datos de contacto/envío y botón de confirmación explícita[cite: 2].
- **Navegación:** Conecta directamente con la pantalla de Pago[cite: 2].

### 05. Pago (Simulación de Pasarela)
- **Nota:** No usar pasarela real (Stripe/PayPal); diseñar interfaz simulada y procesamiento de estados[cite: 2].
- **Contenido:** Selector de método, monto a pagar, spinner/loader de procesamiento y vista de resultado final[cite: 2].
- **Estados obligatorios del pago:** `CONFIRMED`, `PENDING`, `REJECTED`, `EXPIRED`[cite: 2].

### 06. Seguimiento del Proyecto
- **Contenido:** Actualizaciones y comunicados del creador, barra de avance frente a metas prometidas, tracking de entrega de la recompensa física/digital y botón de "Reportar un problema"[cite: 2].
- **Estados:** Con actualizaciones publicadas vs. Estado vacío[cite: 2].
- **Navegación:** El reporte conecta con el módulo de Disputas y Soporte[cite: 2].

---

## 4. ESPECIFICACIÓN DE PANTALLAS: BLOQUE ADMINISTRACIÓN (5 VISTAS)

### 07. Panel Administrativo (Dashboard Operativo)
- **Criterio:** Prioridad a urgencias y criticidad sobre métricas vanidosas[cite: 2].
- **Contenido:** Métricas clave de plataforma, cola de tareas urgentes pendientes, alertas críticas y accesos a Revisión, Verificación, Finanzas y Disputas[cite: 2].

### 08. Revisión de Campañas (Rol: Reviewer)
- **Contenido:** Listado de campañas pendientes ordenadas por antigüedad (FIFO)[cite: 2]; vista detallada con la ficha técnica y documentación enviada por el creador[cite: 2]; historial de revisiones previas[cite: 2].
- **Acciones del revisor:** Aprobar, Rechazar (requiere motivo) o Solicitar Cambios (requiere notas por sección)[cite: 2].
- **Estados de revisión:** `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`[cite: 2].

### 09. Verificación y Compliance (KYC / KYB)
- **Contenido:** Colas separadas para personas naturales (KYC) y empresas/cooperativas (KYB)[cite: 2]; visor embebido de documentos de identidad cargados[cite: 2]; registro de auditoría (usuario interno y timestamp de resolución)[cite: 2].
- **Acciones:** Aprobar o Rechazar con motivo[cite: 2].
- **Estados:** `PENDING`, `VERIFIED`, `REJECTED`, `REQUIRES_DOCS`[cite: 2].

### 10. Finanzas y Tesorería
- **Contenido:** Listado de transacciones recibidas, conciliación de saldos, panel de órdenes de desembolso hacia creadores, reembolsos ejecutados a patrocinadores, filtros avanzados y botón para exportar reportes[cite: 2].
- **Estados financieros:** `PENDING`, `COMPLETED`, `FAILED`[cite: 2].

### 11. Disputas y Soporte
- **Contenido:** Bandeja de casos clasificada por severidad y tipología (pago no reconocido, solicitud de devolución, incumplimiento de proyecto)[cite: 2]; visor de chat/hilo de mensajes[cite: 2]; enlace directo con la transacción y el proyecto en cuestión[cite: 2].
- **Acciones:** Resolver caso o Escalar[cite: 2].
- **Estados:** `OPEN`, `IN_REVIEW`, `RESOLVED`[cite: 2].