# Guía de Arquitectura y Flujo de Trabajo: Sistema de Gestión Documental (SGD)

Este documento sirve como hoja de ruta técnica para el equipo de desarrollo. Define la estructura de microservicios, el flujo de datos y la integración con la infraestructura de SharePoint Online.

---

## 1. Resumen del Flujo de Trabajo (The Golden Path)

El sistema opera bajo un modelo de **"Requerimiento-Primero"**. Nada se carga de forma aislada.

1.  **Apertura:** Un usuario crea un **Requerimiento** (Ticket) seleccionando la jerarquía (Proyecto > Área > Contratista) y la taxonomía (Categoría > Subtipo).
2.  **Infraestructura:** El sistema, vía API, instruye a SharePoint para crear un **Document Set** único para ese requerimiento.
3.  **Ejecución:** El técnico/contratista carga evidencias o llena formularios. Estos archivos caen dentro del Document Set y "heredan" automáticamente los metadatos del requerimiento padre.
4.  **Validación:** Se firman digitalmente los documentos. El sistema valida que la documentación esté completa según las reglas de negocio.
5.  **Cierre:** El Requerimiento pasa a estado "Cerrado" y la data se sincroniza con **Power BI** para analítica en tiempo real.

---

## 2. Arquitectura de Microservicios Sugerida

Se recomienda una arquitectura basada en **NestJS** con **Clean Architecture** para asegurar escalabilidad y facilidad de pruebas.

### A. Auth & Identity Service
*Gestión de acceso y seguridad.*
- **Características:**
    - Autenticación JWT y validación de tokens.
    - RBAC (Role-Based Access Control): Admin, Colaborador, Auditor, Contratista.
    - Control de sesiones y cierres por inactividad.

### B. Core Mantenedores Service
*El cerebro de la estructura organizacional.*
- **Características:**
    - CRUD de la jerarquía: Contratistas (con validación de RUT), Áreas, Proyectos.
    - CRUD de Taxonomía: Gestión de la lista de **Categorías y Subtipos**.
    - Lógica de validación: Impedir borrados accidentales de entidades con registros asociados.

### C. Workflow Service (Requerimientos)
*Gestor del ciclo de vida del "Ticket".*
- **Características:**
    - Motor de estados: Abierto, En Progreso, Cerrado.
    - Formulario dinámico de creación de Requerimientos.
    - Asignación de responsables y niveles de prioridad.
    - Reglas de negocio: Bloqueo de cierre si no hay documentos o firmas presentes.

### D. SharePoint Integration Service (Storage & Docs)
*Capa de abstracción para la infraestructura de Microsoft.*
- **Características:**
    - **Automatización de Document Sets:** Creación de contenedores inteligentes en SharePoint Online vía Graph API.
    - **Gestor de Metadatos:** Inyección de campos de sitio (Categoría/Subtipo) en archivos.
    - **Uploader:** Manejo de subidas individuales y masivas dentro del contexto de un requerimiento.
    - **PDF Generator:** Motor para convertir formularios y firmas a documentos PDF inmutables.

### E. Reporting & Analytics Service
*Puente de datos para la toma de decisiones.*
- **Características:**
    - Sincronización de datos con **Power BI**.
    - Registro de Auditoría (Log): Trazabilidad de quién subió qué, cuándo y en qué proyecto.
    - Exportación de reportes personalizados para auditorías externas.

---

## 3. Stack Tecnológico

* **Frontend:** React + SPFx (SharePoint Framework).
* **Backend:** NestJS (Node.js v18).
* **Base de Datos:** PostgreSQL (para estados y metadatos rápidos).
* **Almacenamiento:** SharePoint Online (Estructura de Document Sets).
* **Contenedores:** Docker para estandarizar el entorno de desarrollo.
