# Agentes y Roles del Proyecto Brotar

Este documento define el equipo de agentes de IA y especialistas configurados para el desarrollo de **Brotar (Plataforma de Crowdfunding Verde)**.

---

## Resumen del Equipo de Agentes

| Agente / Rol | Ámbito | Stack & Herramientas | Regla Asociada |
| :--- | :--- | :--- | :--- |
| **Lead Architect & Security Auditor** | Global / Contratos | SOLID, OWASP Top 10, REST Contracts | [lead-architect.md](file:///c:/Users/wiget/OneDrive/Desktop/Brotar/PR3B-Crowdunding-verde-GSILVAS/.agents/rules/lead-architect.md) |
| **Backend Specialist** | `backend/` | NestJS, TypeScript, PostgreSQL, Prisma, **pnpm** | [backend-specialist.md](file:///c:/Users/wiget/OneDrive/Desktop/Brotar/PR3B-Crowdunding-verde-GSILVAS/.agents/rules/backend-specialist.md) |
| **Frontend Specialist** | `frontend/` | React 19, TypeScript, Vite, CSS, **Bun** | [frontend-specialist.md](file:///c:/Users/wiget/OneDrive/Desktop/Brotar/PR3B-Crowdunding-verde-GSILVAS/.agents/rules/frontend-specialist.md) |

---

## Protocolo de Colaboración entre Agentes

1. **Fase 1 - Diseño y Contratos (Lead Architect)**:
   - Define los contratos REST (método, ruta, `RequestDTO`, `ResponseDTO`) y audita los requisitos de seguridad OWASP.
2. **Fase 2 - Implementación Backend (Backend Specialist)**:
   - Construye las entidades en `domain/`, casos de uso en `application/`, y controladores/persistencia en `infrastructure/` usando exclusivamente `pnpm`.
3. **Fase 3 - Implementación Frontend (Frontend Specialist)**:
   - Desarrolla las vistas y componentes en `features/` consumiendo los contratos tipados mediante `bun`.
