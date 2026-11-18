# Contrato de Recompensas (campañas)

> **Estado: implementado en código; requiere SQL del DB Master antes de desplegar.**
> Endpoints, repositorio Prisma, wizard, revisión admin, detalle público e
> integración con Aportes están implementados. La tabla `campaign_rewards` y la FK
> `contributions.reward_id` **no existen todavía en la BD compartida**: mientras no
> se apliquen los scripts de `backend/prisma/sql/campaign_rewards/`, las rutas
> responden `503` con el nombre de la tabla o permiso faltante (nunca una lista
> vacía simulada). Actualizar `schema.prisma` y generar el cliente no modifica la BD.

## 1. Recurso `CampaignReward`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string` (UUID) | Lo puede enviar el cliente al crear (reintento idempotente); si no, lo genera el servidor. Editar conserva el id. |
| `campaignId` | `string` (UUID) | Campaña dueña. No cambia. |
| `title` | `string` | Obligatorio, 1–120 caracteres tras `trim` (columna `varchar(200)`). |
| `description` | `string` | Obligatoria, 1–500 caracteres tras `trim`. |
| `minimumContribution` | `number` | Mayor a 0, máximo 2 decimales (`decimal(12,2)`). |
| `currency` | `string` | Copiada de la campaña al crear. Mientras haya recompensas no se puede cambiar la moneda ni el tipo de la campaña. |
| `quantityTotal` | `number \| null` | Cupo total. Entero > 0, o `null` = ilimitado. **No es la disponibilidad restante.** |
| `quantityClaimed` | `number` | Cupos adjudicados por aportes **confirmados**. |
| `quantityRemaining` | `number \| null` | `quantityTotal - quantityClaimed`; `null` si es ilimitada. |
| `isSoldOut` | `boolean` | Derivado de los cupos. Agotarse no desactiva `isActive`. |
| `isActive` | `boolean` | Habilitada para nuevos aportes. Se cambia solo con `PATCH .../active`. Agotarse no lo modifica. |
| `estimatedDeliveryOn` | `string` (`YYYY-MM-DD`) | Fecha sin hora (`DATE`). Al crear o cambiarla no puede ser anterior a hoy en `America/La_Paz`. |
| `createdAt`, `updatedAt` | `string` (ISO-8601) | Timestamps del servidor. |

## 2. Operaciones

Base: `/campaigns/:campaignId/rewards`. Errores comunes:
`400` entrada inválida · `403` sin permiso · `404` campaña o recompensa inexistente
(o recompensa de otra campaña) · `409` estado incompatible · `503` tabla o permisos
de BD faltantes.

### Listar — `GET /campaigns/:campaignId/rewards`

- Autenticación opcional. Campaña `published`: lectura pública. Otros estados: solo
  dueño o admin.
- Respuesta `200`: `CampaignReward[]`, ordenadas por creación.

### Crear — `POST /campaigns/:campaignId/rewards`

- Rol `creator`, dueño, campaña editable (`draft`/`changes_requested`) y de tipo `reward`.
- `id` opcional (UUID): si ya existe en la misma campaña se devuelve la guardada
  (reintento sin duplicar); si pertenece a otra campaña, `409`.

```json
{
  "id": "7d0c4a52-3f0e-4f8e-9a51-0b7f3f1c2d11",
  "title": "Kit de semillas",
  "description": "Semillas nativas para iniciar un huerto en casa.",
  "minimumContribution": 50,
  "quantityTotal": null,
  "estimatedDeliveryOn": "2026-12-15"
}
```

### Editar — `PATCH /campaigns/:campaignId/rewards/:rewardId`

- Mismos requisitos que crear. Campos omitidos se conservan; el `id` no cambia.
- `estimatedDeliveryOn` solo se valida contra hoy si cambia.
- `409` si la recompensa ya tiene aportes asociados (cualquier estado).
- Este PATCH no acepta `isActive` ni `quantityClaimed`.

### Activar o desactivar — `PATCH /campaigns/:campaignId/rewards/:rewardId/active`

- Rol `creator` y dueño de la campaña. También cuando la campaña ya no es editable.
- No exige que la recompensa esté libre de aportes. No cambia `quantityClaimed` ni los aportes confirmados.
- Una recompensa agotada sigue agotada si se reactiva: el cupo no aumenta.
- `quantityTotal: null` sigue siendo ilimitada.

```json
{ "isActive": false }
```

- Respuesta `200`: el mismo `CampaignReward`. `403` si la campaña es de otro usuario. `404` si no existe.

### Quitar — `DELETE /campaigns/:campaignId/rewards/:rewardId`

- Dueño, campaña editable y recompensa de esa campaña (no exige tipo `reward`).
- `409` si tiene aportes asociados. La FK `fk_contributions_reward_id` también lo impide.
- Respuesta `204`.

### Reglas en Campañas

- Cambiar tipo o moneda de la campaña con recompensas guardadas: `409`. No se borran solas.
- Enviar a revisión una campaña `reward` exige al menos una recompensa válida guardada.
- Tras publicar no se edita (la campaña deja de ser editable).
- La revisión admin admite la nota por sección `rewards` ("Recompensas").

## 3. Integración con Aportes

- `POST /contributions` con `contributionType: "reward"` exige `rewardId`. Se valida
  pertenencia a la campaña, `isActive`, moneda, monto ≥ `minimumContribution` (aunque
  sea < 10) y cupo, con la fila de la recompensa bloqueada (`FOR SHARE`).
  Sin recompensa rige el mínimo de 10 BOB. `rewardId` en donación o preventa: `400`.
- Un aporte pendiente no reserva ni consume cupo.
- `POST /contributions/:id/pay` revisa la disponibilidad antes de cobrar. La
  confirmación es una sola transacción: `pending → confirmed` condicional (idempotente),
  `quantity_claimed + 1` solo si queda cupo y `current_amount += monto bruto`. Si no
  hay cupo no se aplica nada y responde `409`; dos solicitudes por el último cupo no
  pueden confirmar ambas, y una doble confirmación no duplica cupos ni recaudación.
- El aporte devuelve `rewardTitle` y `rewardEstimatedDeliveryOn` (checkout y "Mis aportes").
- Sin reservas, expiraciones, colas, reembolsos ni liberación de cupos.

## 4. Despliegue (orden)

1. Comprobaciones previas (consultas de diagnóstico al final de `02_link_contributions_reward.sql`).
2. `backend/prisma/sql/campaign_rewards/01_create_campaign_rewards.sql` — propietario de `campaigns`.
3. `backend/prisma/sql/campaign_rewards/02_link_contributions_reward.sql` — propietario de `contributions`.
4. `backend/prisma/sql/campaign_rewards/03_contributions_app_grants.sql` — permisos acordados sobre `contributions`.
5. `prisma generate` con `backend/prisma/schema.prisma` y desplegar la aplicación.

Si `campaign_rewards` ya existe, el script 01 no altera sus `CHECK`. `04_ensure_quantity_claimed_check.sql` agrega `chk_campaign_rewards_quantity_claimed` solo cuando falta. Ese script está versionado y no se ejecutó en esta revisión.

## 5. Pendiente

- Preventa: sin productos ni condiciones definidas; el checkout la registra sin producto.
- Entrega de recompensas (`reward_fulfillments`), reembolsos y liberación de cupos.
- Si una recompensa se agota entre el cobro simulado y la confirmación, el aporte
  queda pendiente sin confirmar; no hay política de reembolso.
