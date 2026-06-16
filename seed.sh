#!/usr/bin/env bash
# ============================================================
# SGD — Seed de datos de demostración
# Uso: bash seed.sh
# Requisito: stack corriendo en localhost:8040
# ============================================================
set -e

BASE="http://localhost:8040/api"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "=== SGD Seed de datos ==="
echo ""

# ─── 1. Login ─────────────────────────────────────────────────────────────────
echo "→ Autenticando como admin..."
LOGIN=$(curl -sf -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sgd.cl","password":"admin123"}') || fail "No se pudo conectar al backend. ¿Está el stack corriendo?"

TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
[ -z "$TOKEN" ] && fail "No se obtuvo token JWT"
ok "Autenticado"
AUTH="Authorization: Bearer $TOKEN"

# ─── 2. Contratistas ──────────────────────────────────────────────────────────
echo ""
echo "→ Creando contratistas..."

C1=$(curl -sf -X POST "$BASE/contratistas" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"nombre":"Constructora Andes SpA","rut":"76543210-K","email":"contacto@andes.cl","telefono":"+56 2 2345 6789"}')
C1_ID=$(echo "$C1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Contratista 1: Constructora Andes SpA (id=$C1_ID)"

C2=$(curl -sf -X POST "$BASE/contratistas" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"nombre":"Ingeniería del Norte Ltda","rut":"77890123-4","email":"info@ingnorte.cl","telefono":"+56 2 2987 6543"}')
C2_ID=$(echo "$C2" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Contratista 2: Ingeniería del Norte Ltda (id=$C2_ID)"

C3=$(curl -sf -X POST "$BASE/contratistas" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"nombre":"Mantención Sur S.A.","rut":"78234567-8","email":"admin@mantsur.cl","telefono":"+56 9 8765 4321"}')
C3_ID=$(echo "$C3" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Contratista 3: Mantención Sur S.A. (id=$C3_ID)"

# ─── 3. Áreas ─────────────────────────────────────────────────────────────────
echo ""
echo "→ Creando áreas..."

A1=$(curl -sf -X POST "$BASE/areas" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Área Civil\",\"codigoArea\":\"CIV-01\",\"descripcion\":\"Obras civiles y estructurales\",\"contratistaId\":$C1_ID}")
A1_ID=$(echo "$A1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Área 1: Área Civil → Constructora Andes (id=$A1_ID)"

A2=$(curl -sf -X POST "$BASE/areas" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Área Eléctrica\",\"codigoArea\":\"ELE-01\",\"descripcion\":\"Instalaciones eléctricas de alta y baja tensión\",\"contratistaId\":$C2_ID}")
A2_ID=$(echo "$A2" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Área 2: Área Eléctrica → Ingeniería del Norte (id=$A2_ID)"

A3=$(curl -sf -X POST "$BASE/areas" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Área Mecánica\",\"codigoArea\":\"MEC-01\",\"descripcion\":\"Mantención de equipos mecánicos e industriales\",\"contratistaId\":$C3_ID}")
A3_ID=$(echo "$A3" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Área 3: Área Mecánica → Mantención Sur (id=$A3_ID)"

# ─── 4. Proyectos ─────────────────────────────────────────────────────────────
echo ""
echo "→ Creando proyectos..."

P1=$(curl -sf -X POST "$BASE/proyectos" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Edificio Corporativo Central\",\"areaId\":$A1_ID,\"fechaInicio\":\"2026-03-01\",\"fechaFin\":\"2026-12-31\",\"ubicacion\":\"Santiago Centro\",\"presupuestoEstimado\":850000000,\"estadoProyecto\":\"Ejecución\"}")
P1_ID=$(echo "$P1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Proyecto 1: Edificio Corporativo Central (id=$P1_ID)"

P2=$(curl -sf -X POST "$BASE/proyectos" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Subestación Eléctrica Norte\",\"areaId\":$A2_ID,\"fechaInicio\":\"2026-01-15\",\"fechaFin\":\"2026-08-30\",\"ubicacion\":\"Antofagasta\",\"presupuestoEstimado\":320000000,\"estadoProyecto\":\"Ejecución\"}")
P2_ID=$(echo "$P2" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Proyecto 2: Subestación Eléctrica Norte (id=$P2_ID)"

P3=$(curl -sf -X POST "$BASE/proyectos" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Planta Industrial Sector Sur\",\"areaId\":$A3_ID,\"fechaInicio\":\"2026-02-01\",\"fechaFin\":\"2026-11-15\",\"ubicacion\":\"Talcahuano\",\"presupuestoEstimado\":560000000,\"estadoProyecto\":\"En Licitación\"}")
P3_ID=$(echo "$P3" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Proyecto 3: Planta Industrial Sector Sur (id=$P3_ID)"

# ─── 5. Usuarios adicionales ──────────────────────────────────────────────────
echo ""
echo "→ Creando usuarios..."

curl -sf -X POST "$BASE/auth/users" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"nombre":"María González","email":"supervisor@sgd.cl","password":"Pass1234!","rol":"supervisor"}' > /dev/null
ok "Usuario: supervisor@sgd.cl / Pass1234! (supervisor)"

curl -sf -X POST "$BASE/auth/users" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"nombre":"Pedro Ramírez","email":"colaborador@sgd.cl","password":"Pass1234!","rol":"colaborador"}' > /dev/null
ok "Usuario: colaborador@sgd.cl / Pass1234! (colaborador)"

curl -sf -X POST "$BASE/auth/users" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"nombre\":\"Juan Pérez\",\"email\":\"contratista@sgd.cl\",\"password\":\"Pass1234!\",\"rol\":\"contratista\",\"contratistaId\":$C1_ID}" > /dev/null
ok "Usuario: contratista@sgd.cl / Pass1234! (contratista → Constructora Andes)"

curl -sf -X POST "$BASE/auth/users" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"nombre":"Ana Torres","email":"auditor@sgd.cl","password":"Pass1234!","rol":"auditor"}' > /dev/null
ok "Usuario: auditor@sgd.cl / Pass1234! (auditor)"

# ─── 6. Requerimientos ────────────────────────────────────────────────────────
echo ""
echo "→ Obteniendo categorías para requerimientos..."

CATS=$(curl -sf "$BASE/categorias?page=1&limit=10" -H "$AUTH")
CAT1_ID=$(echo "$CATS" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
SUB1_ID=$(curl -sf "$BASE/subtipos?page=1&limit=5" -H "$AUTH" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

echo ""
echo "→ Creando requerimientos..."

REQ_BASE="{\"contratistaId\":$C1_ID,\"areaId\":$A1_ID,\"proyectoId\":$P1_ID,\"categoriaId\":$CAT1_ID,\"subtipoId\":$SUB1_ID"

R1=$(curl -sf -X POST "$BASE/requerimientos" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "$REQ_BASE,\"titulo\":\"Inspección estructura nivel 3\",\"descripcion\":\"Revisión y certificación de la estructura del nivel 3 del edificio según normativa NCh 433\",\"prioridad\":\"ALTA\",\"usuarioCreadorId\":1}")
R1_ID=$(echo "$R1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Requerimiento 1: Inspección estructura nivel 3 (id=$R1_ID)"

R2=$(curl -sf -X POST "$BASE/requerimientos" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"contratistaId\":$C2_ID,\"areaId\":$A2_ID,\"proyectoId\":$P2_ID,\"categoriaId\":$CAT1_ID,\"subtipoId\":$SUB1_ID,\"titulo\":\"Protocolo pruebas eléctricas transformador\",\"descripcion\":\"Pruebas de aislación y puesta en marcha del transformador principal 13.8kV\",\"prioridad\":\"CRITICA\",\"usuarioCreadorId\":1}")
R2_ID=$(echo "$R2" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Requerimiento 2: Protocolo pruebas eléctricas (id=$R2_ID)"

R3=$(curl -sf -X POST "$BASE/requerimientos" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"contratistaId\":$C3_ID,\"areaId\":$A3_ID,\"proyectoId\":$P3_ID,\"categoriaId\":$CAT1_ID,\"subtipoId\":$SUB1_ID,\"titulo\":\"Mantención preventiva compresor 450HP\",\"descripcion\":\"Mantención semestral según manual de fabricante, incluye cambio de filtros y revisión válvulas\",\"prioridad\":\"MEDIA\",\"usuarioCreadorId\":1}")
R3_ID=$(echo "$R3" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
ok "Requerimiento 3: Mantención preventiva compresor (id=$R3_ID)"

# ─── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo "================================================="
echo -e "${GREEN}✓ Seed completado${NC}"
echo "================================================="
echo ""
echo "Acceso: http://localhost:8040"
echo ""
echo "Credenciales:"
echo "  admin@sgd.cl       / admin123   (admin)"
echo "  supervisor@sgd.cl  / Pass1234!  (supervisor)"
echo "  colaborador@sgd.cl / Pass1234!  (colaborador)"
echo "  contratista@sgd.cl / Pass1234!  (contratista - Constructora Andes)"
echo "  auditor@sgd.cl     / Pass1234!  (auditor)"
echo ""
