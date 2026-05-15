# ⚠️ SERVICIO DEPRECADO

Este microservicio (`ms-documentos`) ha sido **reemplazado** por `ms-almacenamiento`.

## Razón del cambio

- `ms-documentos` almacenaba archivos en disco local (`./uploads`) en el API Gateway.
- `ms-almacenamiento` integra **SeaweedFS** para almacenamiento distribuido escalable.
- La entidad `Documento` fue evolucionada con SHA-256, versionamiento, estados y JSONB audit.

## Qué hacer si necesitas este código

1. El código fuente se conserva intacto en esta carpeta.
2. La nueva lógica equivalente está en `backend/ms-almacenamiento/`.
3. Los endpoints HTTP están en `backend/api-gateway/src/almacenamiento/`.

## Nuevos endpoints (API Gateway)

| Antes | Ahora |
|-------|-------|
| `POST /api/documentos/upload` | `POST /api/almacenamiento/upload` |
| `GET /api/documentos` | `GET /api/almacenamiento/search` |
| `GET /api/documentos/:id/download` | `GET /api/almacenamiento/:id/download` |

## Estado

- **Puerto TCP 3003**: ahora lo usa `ms-almacenamiento`.
- **Docker Compose**: `ms-documentos` fue removido del compose.
- **Tabla `documentos`**: la nueva entidad es compatible con la anterior (agrega columnas).
