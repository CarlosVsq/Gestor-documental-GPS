#!/usr/bin/env bash
# ============================================================
# Generador de tráfico para poblar métricas en Grafana
# Uso: ./generate-traffic.sh [segundos] [intervalo_ms]
#   segundos     → duración total        (default: 120)
#   intervalo_ms → pausa entre ráfagas   (default: 800)
# ============================================================

DURATION=${1:-120}
INTERVAL_MS=${2:-800}
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Detectar nombre real de la red (Compose puede prefijar con el nombre del proyecto)
NET=$(docker network ls --format '{{.Name}}' 2>/dev/null | grep -E 'sgd.network$' | head -1)
if [ -z "$NET" ]; then
  error "No se encontró red '*sgd*network'. ¿Está el stack levantado? (docker compose up)"
  exit 1
fi

info "Duración: ${DURATION}s | Intervalo: ${INTERVAL_MS}ms"
info "Los datos aparecerán en Grafana (~15-30 s después de iniciar)"

# ── script que corre dentro del contenedor Alpine ────────────
read -r -d '' INNER <<'INNER_SCRIPT'
#!/bin/sh
GW="http://api-gateway:3000"
DURATION="$1"
INTERVAL_MS="$2"
INTERVAL=$(awk "BEGIN{printf \"%.3f\", $INTERVAL_MS/1000}")

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

# ── Login ────────────────────────────────────────────────────
log "Autenticando..."
LOGIN=$(wget -qO- --post-data '{"email":"admin@sgd.cl","password":"admin123"}' \
  --header 'Content-Type: application/json' "$GW/auth/login" 2>/dev/null)
TOKEN=$(printf '%s' "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  printf 'ERROR: Login fallido. Respuesta: %s\n' "$LOGIN"
  exit 1
fi
log "Token obtenido OK"

# ── Helpers ──────────────────────────────────────────────────
AUTH="Authorization: Bearer $TOKEN"
GH() {
  wget -qO/dev/null --server-response --header "$AUTH" "$GW/$1" 2>&1 \
    | awk '/HTTP\//{print $2}' | tail -1
}
GH_NOAUTH() {
  wget -qO/dev/null --server-response "$GW/$1" 2>&1 \
    | awk '/HTTP\//{print $2}' | tail -1
}
PH() {
  wget -qO/dev/null --server-response \
    --post-data "$2" \
    --header 'Content-Type: application/json' \
    --header "$AUTH" \
    "$GW/$1" 2>&1 | awk '/HTTP\//{print $2}' | tail -1
}

# ── Loop ─────────────────────────────────────────────────────
START=$(date +%s)
ITER=0
while true; do
  ELAPSED=$(( $(date +%s) - START ))
  [ "$ELAPSED" -ge "$DURATION" ] && break
  ITER=$(( ITER + 1 ))

  # Rutas autenticadas → 200
  GH "auth/profile"
  GH "areas"
  GH "proyectos"
  GH "categorias"
  GH "subtipos"
  GH "contratistas"
  GH "documentos"
  GH "requerimientos"
  GH "auth/users"

  # IDs inexistentes → 404
  GH "areas/99999"
  GH "documentos/99999"
  GH "proyectos/99999"
  GH "requerimientos/99999"

  # Sin token → 401
  GH_NOAUTH "auth/profile"
  GH_NOAUTH "documentos"
  GH_NOAUTH "requerimientos"
  GH_NOAUTH "areas"

  # Token inválido → 401
  wget -qO/dev/null --server-response \
    --header "Authorization: Bearer token-falso-12345" \
    "$GW/proyectos" 2>/dev/null || true

  log "Iter $ITER | elapsed ${ELAPSED}s/${DURATION}s"
  sleep "$INTERVAL"
done

log "Completado: $ITER iteraciones"
INNER_SCRIPT

# ── Ejecutar en contenedor Alpine (tiene wget nativo) ────────
docker run --rm \
  --network "$NET" \
  --name sgd-traffic-gen \
  alpine:3.20 \
  sh -c "$INNER" -- "$DURATION" "$INTERVAL_MS" &

CID=$!
trap 'docker stop sgd-traffic-gen 2>/dev/null; wait "$CID" 2>/dev/null
      info "Generador detenido."; exit 0' INT TERM

wait "$CID"
info "Finalizado. Abre Grafana en http://localhost:3001"
