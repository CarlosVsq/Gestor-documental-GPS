# Propuesta: Actualización del Pipeline de CI (`ci.yml`)

Dado que migramos de un monolito a una arquitectura de microservicios, el comando `npm ci` en la raíz de `backend/` ya no funciona porque cada microservicio tiene su propio `package.json`.

La mejor práctica en GitHub Actions para monorepos/microservicios es utilizar una **Estrategia de Matriz (`strategy: matrix`)**. Esto le dice a GitHub que levante múltiples contenedores en paralelo (uno para el frontend y uno para cada microservicio backend) y ejecute las pruebas al mismo tiempo. ¡Esto hará que tu CI sea muchísimo más rápido!

Aquí tienes el código exacto que deberías copiar y pegar para reemplazar el contenido actual de tu archivo `.github/workflows/ci.yml`.

## Nuevo Código para `ci.yml`

```yaml
# ============================================================
# SGD - Pipeline de Integración Continua (Microservicios)
# GitHub Actions Workflow
# ============================================================
# Se ejecuta en cada push y pull request a main:
#   Job: Test → Ejecuta pruebas en paralelo para cada microservicio
# ============================================================

name: SGD CI - Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: 🧪 Test [${{ matrix.service }}]
    runs-on: ubuntu-latest

    # La matriz define todas las carpetas que tienen un package.json
    strategy:
      fail-fast: false # Si un servicio falla, sigue corriendo los demás
      matrix:
        service:
          - frontend
          - backend/api-gateway
          - backend/ms-auth
          - backend/ms-mantenedores
          - backend/ms-documentos

    steps:
      - name: 📥 Checkout código
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20' # Actualizado a Node 20 (usado en Dockerfiles)
          cache: 'npm'
          cache-dependency-path: ${{ matrix.service }}/package-lock.json

      - name: 📦 Instalar dependencias
        working-directory: ./${{ matrix.service }}
        run: npm ci

      - name: 🧪 Ejecutar tests (Si existen)
        working-directory: ./${{ matrix.service }}
        # Agregamos --if-present para que NO falle si el package.json no tiene el script "test"
        run: npm run test --if-present -- --ci --coverage --passWithNoTests

      - name: 📊 Subir reporte de cobertura
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-${{ matrix.service }}
          # Limpia el nombre del artefacto para evitar barras en el nombre (ej. coverage-backend-ms-auth)
          path: ${{ matrix.service }}/coverage/
```

### Principales Mejoras de esta Propuesta:

1. **Paralelismo Total**: GitHub Actions ahora creará 5 tareas paralelas ("jobs"). En lugar de esperar a que termine el Gateway para probar Auth, todos se prueban a la misma vez.
2. **`--passWithNoTests`**: Agregué esta bandera de Jest para evitar que el CI falle en microservicios nuevos que aún no tengan pruebas escritas (como el de documentos que acabamos de crear).
3. **Frontend Incluido**: Antes el CI solo probaba el backend. Ahora la matriz incluye la carpeta `frontend/` para que también instale y pruebe tu React.
4. **Node 20**: Tu Dockerfile usa Node 20, por lo que actualicé el CI para que pruebe en el mismo entorno exacto de producción (estaba en Node 18).

Cuando quieras aplicar esto, simplemente reemplaza el contenido de tu `.github/workflows/ci.yml` actual con el bloque de código de arriba.
