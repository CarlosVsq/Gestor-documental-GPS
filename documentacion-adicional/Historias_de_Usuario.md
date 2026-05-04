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
| **HU-10** | Como **colaborador**, quiero llenar formularios de inspección y cargar documentos sin conexión a internet, y que se sincronicen automáticamente al recuperar señal. | - Almacenamiento en caché local (IndexedDB/localStorage)<br>- Indicador visual de modo offline<br>- Cola de sincronización con reintentos automáticos | Media | RF2.2 |
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

---

## Resumen

| Épica | Cantidad HU | Prioridad Principal |
|-------|-------------|---------------------|
| 1. Gestión de Mantenedores | 6 | Alta |
| 2. Gestión Documental y Captura | 7 | Alta |
| 3. Flujo de Trabajo y Trazabilidad | 6 | Alta |
| 4. Reportabilidad | 5 | Media |
| 5. Autenticación y Seguridad | 3 | Alta |
| 6. Formularios y Generación PDF | 3 | Alta - Media |
| 7. Búsqueda y Navegación | 3 | Alta - Media |
| 8. Notificaciones | 2 | Media |
| **Total** | **35** | |

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
