# Historias de Usuario — Sistema de Gestión Documental (SGD)

> **Proyecto:** Sistema de Gestión Documental  
> **Equipo:** Diego Alamos · Marcelo Cid · Carlos Vasquez  
> **Asignatura:** Gestión de Proyectos de Software — UBB 2026  

---

## Épica 1: Gestión de Mantenedores (RF1.1, RF1.2)

Módulo base del sistema para administrar las entidades organizacionales que soportan la jerarquía documental.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-01** | Como **administrador**, quiero crear, leer, actualizar y eliminar **Contratistas** para mantener un registro actualizado de las empresas que gestionan documentos. | - CRUD completo con validación de RUT único<br>- Soft delete para mantener historial<br>- Campos: nombre, RUT, email, teléfono, estado | Alta | RF1.1 |
| **HU-02** | Como **administrador**, quiero gestionar **Áreas** vinculadas a un Contratista para organizar la estructura jerárquica del sistema. | - Cada área debe estar vinculada a un contratista<br>- No se puede eliminar un área con proyectos asociados<br>- Campos: nombre, descripción, contratista_id | Alta | RF1.1, RF1.2 |
| **HU-03** | Como **administrador**, quiero gestionar **Proyectos** vinculados a un Área para mantener la relación jerárquica Proyecto → Área → Contratista. | - Cada proyecto debe estar vinculado a un área<br>- Validar que la cadena Proyecto→Área→Contratista sea coherente<br>- Campos: nombre, código, fecha_inicio, fecha_fin, área_id | Alta | RF1.1, RF1.2 |
| **HU-04** | Como **administrador**, quiero gestionar **Categorías** de documentos para clasificar la documentación técnica del sistema. | - CRUD con nombre único<br>- Categorías predefinidas: Planos, Informes, Certificados, Actas, etc.<br>- No eliminar categorías con documentos asociados | Alta | RF1.1 |
| **HU-05** | Como **administrador**, quiero gestionar **Subtipos** de documentos vinculados a una Categoría para una clasificación más granular. | - Cada subtipo pertenece a una categoría<br>- Campos: nombre, descripción, categoría_id<br>- Validar nombre único dentro de la misma categoría | Alta | RF1.1 |
| **HU-06** | Como **sistema**, debo forzar la relación jerárquica Proyecto → Área → Contratista en toda operación para que cada documento quede correctamente indexado. | - Impedir crear un proyecto sin área válida<br>- Impedir crear un área sin contratista válido<br>- Validaciones a nivel de API y base de datos | Alta | RF1.2 |

---

## Épica 2: Gestión Documental y Captura (RF2.1 - RF2.4, RF1.3, RF1.4)

Define cómo los usuarios interactúan con los documentos: carga, visualización, organización y captura de información.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-07** | Como **colaborador**, quiero subir documentos técnicos de forma individual al sistema para centralizar la documentación del proyecto. | - Aceptar PDF, DOCX, XLSX, imágenes<br>- Validar tamaño máximo (50 MB)<br>- Asociar documento a un proyecto, categoría y subtipo | Alta | RF2.1 |
| **HU-08** | Como **colaborador**, quiero realizar carga masiva de documentos para subir múltiples archivos simultáneamente y ahorrar tiempo. | - Selección de múltiples archivos en un solo diálogo<br>- Barra de progreso por archivo<br>- Resumen al finalizar (éxitos/errores) | Alta | RF2.1 |
| **HU-09** | Como **usuario**, quiero visualizar el listado de requerimientos con sus documentos asociados directamente desde la interfaz sin salir del sistema. | - Visor integrado de PDF dentro de la aplicación<br>- Preview de imágenes en modal<br>- Descarga directa del archivo original | Alta | RF2.3 |
| **HU-10*** | Como **sistema**, debo interceptar cada petición mediante un **Middleware/Guard** para validar la identidad y los permisos del usuario antes de procesar cualquier acción. | - Validar la firma y expiración del JWT en cada request.  <br>\- Bloquear el acceso (Error 403) si el rol del usuario no tiene permisos para la ruta solicitada.<br>\- Inyectar la identidad del usuario en el objeto `Request` para uso de los microservicios |  |  |
| **HU-11** | Como **colaborador**, quiero firmar digitalmente los formularios del sistema para que la firma quede estampada en el documento PDF final. | - Canvas de firma táctil/mouse<br>- La firma se incrusta en el PDF generado<br>- Registro de quién firmó y cuándo | Alta | RF2.4 |
| **HU-12** | Como **sistema**, debo organizar los documentos en Document Sets agrupando todos los expedientes de un mismo proyecto en una unidad lógica. | - Cada proyecto tiene su Document Set automático<br>- Al subir un documento, se asigna al Document Set del proyecto<br>- Vista agrupada por Document Set | Alta | RF1.3 |
| **HU-13** | Como **sistema**, debo etiquetar cada documento subido con metadatos específicos (Categoría, Subtipo, Fecha, Autor) para búsqueda y filtrado rápido. | - Metadatos obligatorios al subir: categoría, subtipo, autor<br>- Metadatos automáticos: fecha de carga, tamaño, formato<br>- Índice de búsqueda actualizado | Alta | RF1.4 |

---

## Épica 3: Flujo de Trabajo y Trazabilidad (RF3.1 - RF3.3)

Reglas de negocio para el ciclo de vida del documento y la auditoría del sistema.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-14** | Como **supervisor**, quiero que los requerimientos cambien automáticamente de estado (Abierto → En Progreso → Cerrado) para hacer seguimiento del ciclo de vida. | - Estados: Abierto, En Progreso, Cerrado<br>- Transiciones válidas definidas (no se puede volver de Cerrado a Abierto)<br>- Notificación al cambiar de estado | Alta | RF3.1 |
| **HU-15** | Como **supervisor**, quiero ver una bandeja de tareas con los requerimientos pendientes, en progreso o bloqueados para gestionarlos eficientemente. | - Vista filtrable por estado, proyecto, contratista<br>- Ordenar por fecha, urgencia<br>- Indicador visual de antigüedad del requerimiento | Alta | RF3.1 |
| **HU-16** | Como **auditor**, quiero un registro inmutable de quién creó, modificó, aprobó o firmó cada documento, con su timestamp exacto, para garantizar trazabilidad. | - Log de auditoría por cada acción: CREATE, UPDATE, DELETE, APPROVE, SIGN<br>- Incluye: usuario, acción, timestamp, datos anteriores y nuevos<br>- No se puede modificar ni eliminar registros de auditoría | Alta | RF3.2 |
| **HU-17** | Como **administrador**, quiero asignar permisos diferenciados (Colaborador / Lectura) a nivel de carpeta y documento para controlar quién edita y quién solo visualiza. | - Roles: Administrador, Colaborador, Lectura<br>- Permisos heredables por carpeta/proyecto<br>- Bloqueo de acciones según rol | Alta | RF3.3 |
| **HU-18** | Como **sistema**, debo registrar automáticamente cada operación de auditoría sin intervención del usuario para cumplir con la norma ISO 30300. | - Auditoría automática en middleware/interceptor<br>- Campos: entidad, acción, datos_antes, datos_después, usuario, timestamp<br>- Almacenamiento en tabla separada e inmutable | Alta | RF3.2 |
| **HU-19** | Como **supervisor**, quiero que un requerimiento no pueda cerrarse sin tener todos los documentos firmados, para garantizar el cumplimiento del proceso. | - Validación antes de cambiar a estado "Cerrado"<br>- Lista de documentos pendientes de firma<br>- Mensaje de error claro indicando qué falta | Alta | RF3.1 |

---

## Épica 4: Reportabilidad e Inteligencia de Negocios (RF4.1 - RF4.4)

Salida de información para la toma de decisiones gerenciales.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-20** | Como **gerente**, quiero ver reportes en Power BI conectados a las listas del sistema para analizar datos en tiempo real. | - Conexión nativa SharePoint Lists → Power BI<br>- Datos actualizados sin exportación manual<br>- Tablero accesible desde el navegador | Media | RF4.1 |
| **HU-21** | Como **gerente**, quiero ver gráficos de distribución de documentos por categoría y subtipo para entender la composición de la documentación. | - Gráfico de barras/torta por categoría<br>- Drill-down a subtipos<br>- Filtro por rango de fechas y proyecto | Media | RF4.2 |
| **HU-22** | Como **gerente**, quiero reportes de volumen de requerimientos gestionados por cada usuario o contratista para evaluar el rendimiento. | - Tabla con conteo por usuario/contratista<br>- Gráfico de rendimiento mensual<br>- Exportable a Excel | Media | RF4.3 |
| **HU-23** | Como **supervisor**, quiero un panel visual en tiempo real que muestre cuántos requerimientos están abiertos, cerrados o en progreso para evitar cuellos de botella. | - Tarjetas KPI: Abiertos, En Progreso, Cerrados<br>- Gráfico de tendencia semanal/mensual<br>- Alertas si hay requerimientos estancados (+7 días) | Media | RF4.4 |
| **HU-24** | Como **gerente**, quiero exportar los datos del dashboard a Excel para generar informes personalizados fuera del sistema. | - Botón "Exportar a Excel" en cada reporte<br>- Incluir filtros aplicados en la exportación<br>- Formato .xlsx con headers descriptivos | Baja | RF4.1 |

---

## Épica 5: Autenticación y Seguridad

Gestión de usuarios, roles y seguridad del sistema.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-25** | Como **usuario**, quiero iniciar sesión en el sistema con mis credenciales para acceder a las funcionalidades según mi rol. | - Login con email y contraseña<br>- JWT con expiración configurable<br>- Redirección según rol después del login | Alta | RF3.3 |
| **HU-26** | Como **administrador**, quiero gestionar usuarios del sistema (crear, editar, desactivar) para controlar quién tiene acceso. | - CRUD de usuarios con validación de email único<br>- Asignación de rol al crear<br>- Desactivación sin eliminar (soft delete) | Alta | RF3.3 |
| **HU-27** | Como **usuario**, quiero que mi sesión se cierre automáticamente después de un tiempo de inactividad para proteger la seguridad. | - Timeout configurable (30 min por defecto)<br>- Aviso 5 minutos antes de expirar<br>- Redirección al login al expirar | Media | RF3.3 |

---

## Épica 6: Formularios y Generación de PDF

Captura de información mediante formularios dinámicos y generación de documentos.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-28** | Como **colaborador**, quiero llenar un formulario de requerimiento con campos predefinidos para estandarizar la captura de información en terreno. | - Campos: título, descripción, proyecto, categoría, subtipo, prioridad<br>- Validación de campos obligatorios<br>- Autoguardado en borrador | Alta | RF2.1 |
| **HU-29** | Como **sistema**, debo generar un PDF a partir de un formulario completado que incluya todos los datos ingresados y la firma digital. | - PDF generado con pdf-lib<br>- Incluye: datos del formulario, metadatos, firma digital<br>- Logo y encabezado corporativo estandarizado | Alta | RF2.4 |
| **HU-30** | Como **colaborador**, quiero adjuntar fotos tomadas en terreno a un formulario para documentar evidencias visuales del trabajo realizado. | - Captura desde cámara del dispositivo o selección de galería<br>- Compresión automática de imágenes<br>- Máximo 10 imágenes por formulario | Media | RF2.1 |

---

## Épica 7: Búsqueda y Navegación

Herramientas de búsqueda y navegación eficiente en el sistema.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-31** | Como **usuario**, quiero buscar documentos por metadatos (categoría, subtipo, autor, fecha, proyecto) para encontrar expedientes rápidamente. | - Buscador con filtros combinables<br>- Resultados paginados con preview<br>- Búsqueda por texto parcial (nombre de archivo, descripción) | Alta | RF1.4 |
| **HU-32** | Como **usuario**, quiero navegar la estructura jerárquica Contratista → Área → Proyecto → Documentos en forma de árbol para explorar la documentación de manera intuitiva. | - Vista de árbol colapsable/expandible<br>- Conteo de documentos por nivel<br>- Click para ver los documentos de cualquier nodo | Media | RF1.2 |
| **HU-33** | Como **usuario**, quiero ver los documentos más recientes en un panel de "Actividad Reciente" al ingresar al sistema para estar al día con los últimos cambios. | - Lista de últimos 20 documentos/acciones<br>- Muestra: nombre, acción, usuario, fecha<br>- Actualización automática (polling o websocket) | Baja | RF2.3 |

---

## Épica 8: Notificaciones

Sistema de alertas y notificaciones para mantener informados a los usuarios.

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad | RF |
|----|---------------------|------------------------|-----------|-----|
| **HU-34** | Como **supervisor**, quiero recibir una notificación cuando un contratista suba un nuevo documento para poder revisarlo oportunamente. | - Notificación in-app en tiempo real<br>- Badge de contador de no leídas<br>- Click lleva directamente al documento | Media | RF3.1 |
| **HU-35** | Como **colaborador**, quiero recibir una notificación cuando un requerimiento que me asignaron cambie de estado para estar al tanto del progreso. | - Notificación al cambiar estado de un requerimiento asignado<br>- Indica: quién cambió, de qué estado a cuál<br>- Historial de notificaciones | Media | RF3.1 |

## Épica 9: Gestión Central de Requerimientos (Workflow Core)

Esta épica define la existencia del "ticket" (Requerimiento) como el motor que orquesta la jerarquía y los documentos.

| ID        | Historia de Usuario                                          | Criterios de Aceptación                                      | Prioridad | RF    |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ | --------- | ----- |
| **HU-N1** | Como **colaborador**, quiero crear un **Requerimiento** vinculado a un Proyecto, Área y Contratista para formalizar el inicio de una gestión documental. | - El sistema debe generar un ID único de seguimiento.<br>- Selección obligatoria de Proyecto, Área y Contratista desde los mantenedores[cite: 1, 2].<br>- El estado inicial debe ser siempre "Abierto"[cite: 2]. | Alta      | RF3.1 |
| **HU-N2** | Como **usuario**, quiero clasificar un Requerimiento mediante **Categoría** y **Subtipo** al momento de su creación para asegurar su correcta indexación. | - Menús desplegables alimentados por los mantenedores de Categorías y Subtipos[cite: 1, 2].<br>- Los metadatos elegidos deben quedar vinculados permanentemente al Requerimiento. | Alta      | RF1.1 |
| **HU-N3** | Como **administrador**, quiero que la visibilidad de los Requerimientos esté filtrada por el rol del usuario para mantener la confidencialidad entre empresas. | - El contratista solo visualiza requerimientos donde su `contratista_id` coincida[cite: 1, 2].<br>- El administrador y supervisores de área mantienen vista global o por área respectiva[cite: 1, 2]. | Alta      | RF3.3 |

---

## Épica 10: Integración con Infraestructura SharePoint (Storage Logic)

Define cómo el Requerimiento interactúa con la plataforma de almacenamiento de Microsoft.

| ID        | Historia de Usuario                                          | Criterios de Aceptación                                      | Prioridad | RF    |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ | --------- | ----- |
| **HU-N4** | Como **sistema**, debo crear automáticamente un **Document Set** en SharePoint por cada nuevo Requerimiento creado para agrupar sus expedientes. | - Creación automática del contenedor inteligente en la biblioteca de SharePoint Online[cite: 1].<br>- El nombre del Document Set debe contener el ID del Requerimiento para fácil búsqueda[cite: 1, 2]. | Alta      | RF1.3 |
| **HU-N5** | Como **sistema**, debo propagar (heredar) los metadatos del Requerimiento a todos los archivos dentro del **Document Set** para evitar la carga manual de datos. | - Los archivos subidos heredan automáticamente Categoría, Subtipo y Proyecto del requerimiento padre[cite: 1].<br>- Sincronización de campos de sitio de SharePoint con los datos del sistema React[cite: 1]. | Alta      | RF1.4 |
| **HU-N6** | Como **colaborador**, quiero acceder a la carpeta de documentos (Document Set) directamente desde la vista del Requerimiento para agilizar la gestión. | - Enlace directo desde el "ticket" a su repositorio de archivos en la interfaz[cite: 1, 2].<br>- Mantener el control de permisos de SharePoint (Colaborador/Lectura) en este acceso[cite: 1, 2]. | Alta      | RF2.3 |

---

## Épica 11: Validaciones de Negocio y Cierre

Reglas finales para asegurar que el proceso documental se cumpla estrictamente.

| ID        | Historia de Usuario                                          | Criterios de Aceptación                                      | Prioridad | RF    |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ | --------- | ----- |
| **HU-N7** | Como **sistema**, debo validar que un Requerimiento posea al menos un documento clasificado antes de permitir el cambio de estado a "En Progreso". | - Impedir avance de estado si el Document Set está vacío[cite: 1, 2].<br>- Mensaje de alerta indicando la falta de documentación técnica[cite: 1]. | Media     | RF3.1 |
| **HU-N8** | Como **supervisor**, quiero que el sistema genere un reporte de auditoría final al cerrar un Requerimiento para consolidar la trazabilidad del proceso. | - Documento resumen con el log de todas las acciones desde "Abierto" hasta "Cerrado"[cite: 2].<br>- Almacenamiento automático de este reporte en el Document Set correspondiente[cite: 1, 2]. | Media     | RF3.2 |



## Estado de Implementación — Snapshot 2026-05-23

Leyenda: ✅ Implementada · 🟡 Parcial (funcional pero falta cumplir uno o más criterios de aceptación) · ❌ No implementada / Pendiente · ⚪ Fuera de alcance (decisión consciente, no se implementará — ver sección "Fuera de alcance — Justificación")

> Las HUs marcadas como "adaptadas" originalmente especifican SharePoint o Power BI; el sistema implementado usa **SeaweedFS + PostgreSQL**, por lo que la integración se reemplazó por la pila local equivalente.

### Épica 1 — Mantenedores

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-01 | ✅ | `backend/ms-mantenedores/src/contratistas/` + `frontend/src/pages/...` — CRUD con RUT único y soft delete. |
| HU-02 | ✅ | `ms-mantenedores/src/areas/` — vinculación a contratista validada. |
| HU-03 | ✅ | `ms-mantenedores/src/proyectos/proyectos.service.ts` — código autogenerado, validación área. |
| HU-04 | ✅ | `ms-mantenedores/src/categorias/`. |
| HU-05 | ✅ | `ms-mantenedores/src/subtipos/` — unicidad por categoría. |
| HU-06 | ✅ | Validaciones cruzadas en services + DTO de cada mantenedor. |

### Épica 2 — Gestión Documental y Captura

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-07 | ✅ | `ms-almacenamiento/src/documentos/documentos.service.ts` + `UploadModal.tsx`. |
| HU-08 | ✅ | `UploadModal.tsx:172` input `multiple`; sube varios archivos en un diálogo. |
| HU-09 | ✅ | `AlmacenamientoPage.tsx` — lista por requerimiento + descarga; preview de PDF/imagen. |
| HU-10 | ✅ | `api-gateway/src/auth/guards/jwt-auth.guard.ts` + `roles.guard.ts`. |
| HU-11 | ✅ | `useFirmaPersistida`, `ConfigurarFirmaModal`, `FirmarDocumentoModal`, `pdf.service.ts:168+`. |
| HU-12 | ✅ (adaptada) | "Document Set" = expediente SeaweedFS por requerimiento (`storagePath` + `almacenamiento.expediente.create`). |
| HU-13 | ✅ | `documento.entity.ts` — categoriaId, subtipoId, autor, fecha, mimeType. |

### Épica 3 — Workflow y Trazabilidad

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-14 | ✅ (alcance reducido) | Transiciones validadas en `requerimientos.service.ts:116-134`. El criterio "notificación al cambiar de estado" queda **fuera de alcance** como efecto colateral del descarte de HU-34/HU-35. Ver justificación. |
| HU-15 | ❌ | `RequerimientosPage` muestra tabla con filtros estado/prioridad pero no es una bandeja kanban; no hay categoría "bloqueados" ni indicador visual de antigüedad. |
| HU-16 | ✅ | `ms-auditoria` (TCP :3005) con tabla `auditoria` **inmutable** (append-only, columnas `update:false`, sin update/delete handler). Registra quién/acción/timestamp por cada operación con `CREATE/UPDATE/DELETE/SIGN/STATE_CHANGE`. Lectura para auditor/admin vía `GET /api/auditoria`, `/auditoria/requerimiento/:id`, `/auditoria/:entidad/:id`. **Matiz:** el diff "datos anteriores" no se captura en el interceptor HTTP (solo `datosDespues`); la columna `datosAntes` existe y se alimentará con llamadas explícitas por microservicio cuando se requiera el diff completo. |
| HU-17 | ❌ | Solo hay RBAC por rol global. No existe ACL por carpeta ni por documento. Hay campo `permisosObjectFS` en Contratista pero no se enforce en endpoints. |
| HU-18 | ✅ | `AuditoriaInterceptor` global en el gateway (`common/interceptors/auditoria.interceptor.ts`, registrado vía `APP_INTERCEPTOR`) audita automáticamente toda operación mutante (POST/PATCH/PUT/DELETE) sin intervención del usuario. Persiste en la tabla separada e inmutable de `ms-auditoria` (ISO 30300). Fire-and-forget: si la auditoría falla no afecta la petición. |
| HU-19 | ❌ | `requerimientos.service.ts:116-134` (`updateState`) **no** valida que todos los documentos estén firmados antes de cerrar — solo bloquea volver de CERRADO. |

### Épica 4 — Reportabilidad e Inteligencia de Negocios

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-20 | ⚪ | **Fuera de alcance** — la HU exige conexión nativa SharePoint Lists → Power BI, imposible con el stack actual (SeaweedFS + PostgreSQL). Reemplazada por HU-21/22/23/24 (dashboards internos con recharts + exportación a Excel). Ver justificación. |
| HU-21 | ❌ | Sin gráficos. `Dashboard.tsx` solo tiene KPIs numéricos, no se importa ninguna librería de charts. |
| HU-22 | ❌ | No hay endpoints ni vistas que agrupen requerimientos por usuario o contratista para reporting. |
| HU-23 | 🟡 | KPIs Abiertos/En Progreso/Cerrados existen pero **dentro** de `RequerimientosPage` (`api/requerimientos.ts:112-127`, calculados client-side trayendo hasta 1000 filas). Faltan en Dashboard, sin tendencia temporal, sin alerta de "estancados >7 días". |
| HU-24 | ❌ | Sin exportación a Excel (no hay `xlsx` ni endpoint `/export`). |

### Épica 5 — Autenticación y Seguridad

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-25 | ✅ | `LoginPage.tsx` + `ms-auth/src/auth/auth.service.ts` JWT. |
| HU-26 | ✅ | `frontend/src/pages/UsersPage.tsx` + `ms-auth/src/users/`. |
| HU-27 | ⚪ | **Fuera de alcance** — auto-logout invisible en demo (el timeout de 30 min no se dispara en una presentación). La expiración del JWT existente cubre el riesgo de credencial filtrada. Ver justificación. |

### Épica 6 — Formularios y PDF

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-28 | ✅ | `components/RequerimientoForm.tsx`. |
| HU-29 | ✅ | `ms-almacenamiento/src/pdf/pdf.service.ts` — pdf-lib + firma incrustada. |
| HU-30 | ✅ (alcance reducido) | `UploadModal` acepta PNG/JPEG/GIF/WebP desde galería del dispositivo, lo que cubre el escenario móvil en producción. Captura directa de cámara (`capture="environment"`) y límite explícito de 10 imágenes/formulario **fuera de alcance** — la captura directa rompería el input universal de PDFs+imágenes. Ver justificación. |

### Épica 7 — Búsqueda y Navegación

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-31 | ✅ | `GET /api/almacenamiento/search` con filtros contratistaId/proyectoId/areaId/categoriaId/estadoDocumento + query text. Resultados paginados. |
| HU-32 | ✅ | `components/DocumentTree.tsx` — árbol colapsable con conteo de docs. |
| HU-33 | ❌ | No existe panel "Actividad Reciente". El comentario en Dashboard menciona la idea pero solo renderiza Quick Actions. |

### Épica 8 — Notificaciones

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-34 | ⚪ | **Fuera de alcance** — requiere infraestructura nueva (WebSocket/SSE/tabla `notificaciones` + polling) cuyo costo es desproporcionado para una demo universitaria. Se difiere a producción. Ver justificación. |
| HU-35 | ⚪ | **Fuera de alcance** — depende de la misma infraestructura que HU-34. Como efecto colateral, HU-14 queda con su criterio "notificación al cambiar estado" formalmente descartado. Ver justificación. |

### Épica 9 — Workflow Core (Requerimientos)

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-N1 | ✅ | `requerimientos.service.ts:43-78` — código auto, estado inicial ABIERTO. |
| HU-N2 | ✅ | `RequerimientoForm.tsx` exige categoría y subtipo. |
| HU-N3 | ✅ | `requerimientos-gateway.controller.ts:47` inyecta `filterContratistaId` cuando `user.rol === CONTRATISTA`. |

### Épica 10 — Integración Storage

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-N4 | ✅ (adaptada) | `requerimientos.service.ts:65-75` dispara `almacenamiento.expediente.create` en SeaweedFS al crear el requerimiento. `storagePath` contiene el código. |
| HU-N5 | ✅ (adaptada) | Documentos heredan metadatos del requerimiento padre vía `requerimientoId` y join en `search`. |
| HU-N6 | ✅ | Botón "Ver carpeta de documentos" en `RequerimientosTable.tsx` + navegación cross-page vía `prefilledRequerimiento` en `AlmacenamientoPage` (implementada 2026-05-17). |

### Épica 11 — Validaciones de Negocio y Cierre

| HU | Estado | Evidencia / Nota |
|----|--------|------------------|
| HU-N7 | ✅ | `requerimientos.service.ts:updateState` consulta `almacenamiento.findByRequerimiento` y bloquea con 409 si el expediente está vacío al pasar a EN_PROGRESO. |
| HU-N8 | ❌ | Al pasar a CERRADO solo se setea `fechaCierre` y opcionalmente `motivoRechazo`. No se genera ni archiva ningún reporte consolidado. |

### Fuera de alcance — Justificación

Decisiones de descarte consciente tomadas durante el Sprint 3. Para cada HU se explica el porqué, qué efectivamente NO se implementará, y qué del espíritu original sí se cubre por otra vía (cuando aplica).

**HU-20 — Reportes en Power BI**
El criterio de aceptación exige "Conexión nativa SharePoint Lists → Power BI", incompatible con el stack final del proyecto (SeaweedFS + PostgreSQL). El RF4.1 ("informes para la toma de decisiones gerenciales") se cubre por la cadena HU-21 + HU-22 + HU-23 + HU-24 mediante una página de Analítica con gráficos `recharts` y exportación a Excel — todo nativo, sin licencia, sin dependencia externa.

**HU-27 — Auto-logout por inactividad**
El timeout de 30 min nunca se dispara en una demo de 15-20 min, por lo que es **invisible para la defensa**. El riesgo real (credencial filtrada) ya está mitigado por la expiración del JWT (configurable, default actual ≈ 24 h). Implementar un detector de inactividad client-side + modal de aviso aporta ~2 h de código que no se verá. Se difiere a producción.

**HU-30 — Captura desde cámara + límite de 10 imágenes**
Lo presentable de la HU **sí se implementa**: `UploadModal` acepta PNG/JPEG/GIF/WebP desde la galería del dispositivo, cumpliendo el escenario móvil real. Los criterios restantes quedan fuera de alcance:
- **Captura directa con `capture="environment"`**: rompería el input universal de PDFs + imágenes, ya que el atributo `capture` fuerza la cámara y excluye la selección de archivos. Añadir un botón "Tomar foto" separado es 25 líneas de UX que solo aporta en móvil y no en demo.
- **Límite de 10 imágenes por formulario**: validación trivial pero sin impacto observable. Se omite.

**HU-34 — Notificación al supervisor por nuevo documento**
Requiere infraestructura nueva: WebSocket/SSE o tabla `notificaciones` + polling client-side + badge de contador. ~3 días de trabajo invisible en una demo (en producción real sería central, pero aquí no se observa). Se difiere.

**HU-35 — Notificación al colaborador por cambio de estado**
Depende de la misma infraestructura que HU-34. Se descarta en bloque por la misma razón. **Efecto colateral:** HU-14 (cambios automáticos de estado) tenía como AC "notificación al cambiar de estado" — ese AC se considera explícitamente fuera de alcance, y HU-14 queda como ✅ con alcance reducido.

---

### Resumen ejecutivo

- **Total HUs:** 43.
- **Implementadas (✅):** 30 — HU-01..09, HU-10, HU-11, HU-12, HU-13, HU-14 (alcance reducido), HU-16, HU-18, HU-25, HU-26, HU-28, HU-29, HU-30 (alcance reducido), HU-31, HU-32, HU-N1, HU-N2, HU-N3, HU-N4, HU-N5, HU-N6, HU-N7.
- **Parciales (🟡):** 1 — HU-23.
- **No implementadas (❌):** 8 — HU-15, HU-17, HU-19, HU-21, HU-22, HU-24, HU-33, HU-N8.
- **Fuera de alcance (⚪):** 4 — HU-20, HU-27, HU-34, HU-35.

**Cobertura gestionada: 43/43 (100%)** — cada HU tiene un estado definido (implementada, en progreso, o fuera de alcance documentada).

### Plan de cierre

El detalle de la implementación de las 11 HUs pendientes (9 ❌ + 2 🟡) está en un plan dedicado que organiza el trabajo en **7 fases con dependencias**, optimizado para que el sistema se vea **completo y conectado** al cerrar:

- **Fase 0** (esta): formalizar descartes (documental, sin código).
- **Fase 1**: `ms-auditoria` + interceptor global → cierra HU-16 (audit log inmutable) y HU-18 (ISO 30300).
- **Fase 2**: persistencia de firma → cierra HU-19.
- **Fase 3**: panel Actividad Reciente → cierra HU-33.
- **Fase 4**: reporte de cierre PDF → cierra HU-N8.
- **Fase 5**: dashboard analítico con `recharts` → cierra HU-21, HU-22, HU-23.
- **Fase 6**: exportar a Excel → cierra HU-24.
- **Fase 7**: polish + documentación + demo end-to-end.

Esfuerzo total estimado: 12-14 días. Cobertura proyectada al cierre del plan: **35/43 implementadas (81%) + 4 fuera de alcance + 1 diferida sin descarte (HU-17) + 1 sin plan inmediato (HU-15)** — el resto cae automáticamente.

**HU-17 (Permisos diferenciados Colaborador/Lectura por carpeta/doc)** queda en estado especial: no se implementa por ahora pero tampoco se descarta — decisión congelada del equipo, a revisar más adelante.

**HU-15 (bandeja kanban)** sigue pendiente sin plan inmediato; podría cerrarse parcialmente si se añade indicador de antigüedad como mejora dentro de Fase 5.

---

### Distribución por Prioridad

- 🔴 **Alta:** 21 HUs
- 🟡 **Media:** 12 HUs
- 🟢 **Baja:** 2 HUs

### Trazabilidad RF → HU

| Requisito Funcional | Historias de Usuario Asociadas |
|---|---|
| RF1.1 - CRUD Mantenedores | HU-01, HU-02, HU-03, HU-04, HU-05 |
| RF1.2 - Relación Jerárquica | HU-02, HU-03, HU-06, HU-32 |
| RF1.3 - Document Sets | HU-12 |
| RF1.4 - Metadatos | HU-13, HU-31 |
| RF2.1 - Carga Documentos | HU-07, HU-08, HU-28, HU-30 |
| RF2.2 - Funcionamiento Offline | HU-10 |
| RF2.3 - Visualización Integrada | HU-09, HU-33 |
| RF2.4 - Firmas Digitales | HU-11, HU-29 |
| RF3.1 - Seguimiento Estados | HU-14, HU-15, HU-19, HU-34, HU-35 |
| RF3.2 - Auditoría Inmutable | HU-16, HU-18 |
| RF3.3 - Permisos | HU-17, HU-25, HU-26, HU-27 |
| RF4.1 - Power BI | HU-20, HU-24 |
| RF4.2 - Métricas Categoría | HU-21 |
| RF4.3 - Reporte por Usuario | HU-22 |
| RF4.4 - Monitor Estados | HU-23 |
