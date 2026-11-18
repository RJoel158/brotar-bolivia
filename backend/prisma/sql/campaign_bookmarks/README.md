# campaign_bookmarks

Favoritos / proyectos seguidos del patrocinador.

## Orden

1. `01_create_campaign_bookmarks.sql` (DB Master / dueño de `campaigns`)
2. `02_app_grants.sql` (mismos dueño; ajusta roles)

## API

- `GET /campaigns/me/bookmarks`
- `POST /campaigns/:id/bookmarks`
- `DELETE /campaigns/:id/bookmarks`
