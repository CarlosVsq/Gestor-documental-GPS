# Implementación de Gestión Documental (Subida de Documentos por Editor)

Este plan describe la arquitectura y los pasos para implementar la funcionalidad de carga y gestión de documentos técnicos, manteniendo la lógica simple y sin restricciones initiales de archivos, tal como lo solicitó el usuario.

> [!NOTE]
> **Estrategia (Decoupled Storage)**: La base de datos guardará la metadata del archivo con un `storageId` que vinculará localmente al archivo físico. En el futuro, cambiar esa lógica a SharePoint no afectará la experiencia.

## Proposed Changes

### 1. Definición de Roles y Seguridad [Backend]

Cambiaremos el rol propuesto por `EDITOR`.

#### [MODIFY] `backend/src/auth/enums/role.enum.ts`
Agegar rol `EDITOR` a la enumeración. Un Editor podrá ingresar al sistema, y se le bloqueará mediante `RolesGuard` las áreas de configuración y usuarios.

### 2. Capa de Base de Datos [Backend]

La metadata de los documentos necesita un registro.

#### [NEW] `backend/src/documentos/entities/documento.entity.ts`
Crearemos la entidad `Documento`:
- `id` (autoincremento)
- `nombreOriginal` (string, nombre del fichero subido)
- `storageId` (string, nombre del archivo generado localmente)
- `mimeType` (string)
- `tamañoBytes` (number)
- `autorId` (Relación ManyToOne con `User`, guarda el registro de quién subió el documento)

### 3. Servicio de Almacenamiento Local (Storage Service) [Backend]

Para mantenerlo **lo más simple posible** hoy: La aplicación guardará archivos a disco usando `Multer`. Las subidas irán a la carpeta `/uploads` en la raíz del proyecto.

#### [NEW] `backend/src/documentos/documentos.service.ts`
- Lógica directa: Tomar los datos aportados por `Multer` tras la carga del usuario y crear la row en la DB PostgreSQL.

### 4. Controlador Core de Documentos [Backend]

Endpoint expuestos.

#### [NEW] `backend/src/documentos/documentos.controller.ts`
- **Endpoint POST `/api/documentos/upload`**: Recibe Multipart/Form-Data usando el interceptor `FileInterceptor` de NestJS. Guarda físicamente y registra en BD. Permisos: `ADMIN`, `EDITOR`.
- **Endpoint GET `/api/documentos`**: Lista histórica de todos los documentos con un join al autor (`User`). Permisos: `ADMIN`, `EDITOR`.
- **Endpoint GET `/api/documentos/:id/download`**: Retorna el Stream del archivo físico desde el servidor hacia el cliente para su descarga/visualización.

### 5. Interfaz Visual (Frontend) [React]

#### [NEW] `frontend/src/api/documentos.ts`
Cliente Axios que expone `.upload(file)` y `.getAll()`. 

#### [NEW] `frontend/src/pages/DocumentosPage.tsx`
- **Área principal**: Estructura limpia y simple. Incorpora tuerca `<input type="file" />` y un botón `btn-primary` que gatille la acción de seleccionar archivo local y subir de inmediato.
- **Tabla de Registros**: Mostrar los documentos subidos, autor, y fecha. Botón para abrir el documento usando el ID.

#### [MODIFY] `frontend/src/App.tsx`
Registrar formalmente el ruteo hacia `DocumentosPage`.

---

## Limitaciones y Próximos pasos Omitidos
Tal cual se requirió **no se impondrán limitantes de peso ni extensión**. La interfaz será funcional en su modo más puro y simple. Cualquier limitación adicional la contemplamos formalmente a futuro.
