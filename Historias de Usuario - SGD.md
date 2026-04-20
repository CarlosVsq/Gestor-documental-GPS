# Historias de Usuario - Sistema de Gestión Documental (SGD)

> [cite_start]**Proyecto:** Sistema de Gestión Documental (SaaS sobre SharePoint) [cite: 5, 8, 9]
> [cite_start]**Equipo:** Diego Alamos · Marcelo Cid · Carlos Vasquez [cite: 91, 92, 93]
> [cite_start]**Asignatura:** Gestión de Proyectos de Software — UBB 2026 [cite: 94, 96]

---

## Épica 1: Gestión de Mantenedores (Infraestructura de Datos)
[cite_start]*Justificación: Provee la estructura lógica necesaria para indexar toda la documentación técnica del sistema.* [cite: 12, 13, 20]

| ID        | Historia de Usuario                                        | Criterios de Aceptación                                      | Imp. | Urg. | Prioridad | Comentario / Justificación                                   |
| :-------- | :--------------------------------------------------------- | :----------------------------------------------------------- | :--- | :--- | :-------- | :----------------------------------------------------------- |
| **HU-01** | [cite_start]**Mantenedor de Contratistas**[cite: 21, 112]. | - [cite_start]CRUD completo con validación de RUT único. [cite: 112] <br>- Campos: nombre, contacto y estado. | 5    | 5    | **Alta**  | Bloqueante inicial; define quién genera la información.      |
| **HU-02** | [cite_start]**Gestión de Áreas**[cite: 22, 112].           | - [cite_start]Vinculación obligatoria a un Contratista. [cite: 22] <br>- Bloqueo de eliminación si tiene dependencias. | 5    | 5    | **Alta**  | Organiza la estructura jerárquica del cliente.               |
| **HU-03** | [cite_start]**Gestión de Proyectos**[cite: 23, 112].       | - [cite_start]Cada proyecto debe estar vinculado a un área. [cite: 23] [cite_start]<br>- Validación de cadena Proyecto -> Área. [cite: 23] | 5    | 5    | **Alta**  | [cite_start]Es el eje central de los Document Sets. [cite: 109, 134] |
| **HU-04** | [cite_start]**Categorías de Documentos**[cite: 24, 112].   | - [cite_start]CRUD con nombres únicos (ej. Planos, Informes). [cite: 24] | 4    | 4    | **Alta**  | [cite_start]Necesario para la organización por metadatos. [cite: 124, 175] |
| **HU-05** | [cite_start]**Subtipos de Documentos**[cite: 25, 112].     | - [cite_start]Cada subtipo pertenece a una categoría. [cite: 25] | 4    | 4    | **Alta**  | [cite_start]Permite el filtrado específico en reportes. [cite: 30, 140] |
| **HU-06** | **Integridad Jerárquica**.                                 | - Validación sistémica que impida orfandad de registros.     | 5    | 5    | **Alta**  | [cite_start]Garantiza que cada documento quede indexado correctamente. [cite: 109] |

---

## Épica 2: Gestión Documental y Captura
[cite_start]*Justificación: Resuelve el problema de descentralización y permite la captura en terreno.* [cite: 169, 170]

| ID        | Historia de Usuario                                       | Criterios de Aceptación                                      | Imp. | Urg. | Prioridad | Comentario / Justificación                                   |
| :-------- | :-------------------------------------------------------- | :----------------------------------------------------------- | :--- | :--- | :-------- | :----------------------------------------------------------- |
| **HU-07** | [cite_start]**Carga Individual de Docs**[cite: 107, 174]. | - [cite_start]Soporte PDF/Office; asociación a metadatos. [cite: 174] | 5    | 5    | **Alta**  | [cite_start]Función básica para centralizar archivos. [cite: 108] |
| **HU-10** | [cite_start]**Funcionamiento Offline**[cite: 174, 182].   | - [cite_start]Caché local y sincronización automática al recuperar red. [cite: 182] | 5    | 4    | **Alta**  | [cite_start]Crítico para la disponibilidad de datos en terreno. [cite: 182] |
| **HU-11** | [cite_start]**Captura de Firma Digital**[cite: 113, 179]. | - [cite_start]Firma táctil/mouse incrustada en el PDF final. [cite: 113] | 5    | 5    | **Alta**  | [cite_start]Requisito para validar inspecciones en terreno. [cite: 171] |
| **HU-12** | [cite_start]**Uso de Document Sets**[cite: 109, 175].     | - [cite_start]Agrupación automática de expedientes por proyecto. [cite: 109] | 5    | 5    | **Alta**  | [cite_start]Pilar de la organización estructurada en SharePoint. [cite: 16, 175] |
| **HU-13** | [cite_start]**Etiquetado con Metadatos**[cite: 124, 175]. | - [cite_start]Categoría, subtipo y autor obligatorios al subir. [cite: 124] | 5    | 5    | **Alta**  | [cite_start]Facilita la búsqueda y trazabilidad de archivos. [cite: 175] |

---

## Épica 3: Flujo de Trabajo y Trazabilidad (ISO 30300)
[cite_start]*Justificación: Asegura la auditabilidad e inmutabilidad de la información.* [cite: 171, 177, 185]

| ID        | Historia de Usuario                                     | Criterios de Aceptación                                      | Imp. | Urg. | Prioridad | Comentario / Justificación                                   |
| :-------- | :------------------------------------------------------ | :----------------------------------------------------------- | :--- | :--- | :-------- | :----------------------------------------------------------- |
| **HU-14** | [cite_start]**Seguimiento de Estados**[cite: 111, 176]. | - [cite_start]Flujo: Abierto -> En Progreso -> Cerrado. [cite: 111] | 5    | 5    | **Alta**  | [cite_start]Permite visualizar el avance real de cada proceso. [cite: 137] |
| **HU-16** | [cite_start]**Auditoría Inmutable**[cite: 177].         | - [cite_start]Log de acciones (crear, firmar) con timestamp exacto. [cite: 177, 178] | 5    | 4    | **Alta**  | [cite_start]Garantiza fiabilidad de los registros (ISO 30300). [cite: 185] |
| **HU-17** | [cite_start]**Permisos Azure AD**[cite: 110, 142].      | - [cite_start]Perfiles "Colaborador" y "Lectura" diferenciados. [cite: 110] | 5    | 5    | **Alta**  | [cite_start]Mitiga riesgos de acceso no autorizado. [cite: 130, 143] |
| **HU-36** | **Control de Versiones**.                               | - Historial de cambios por archivo sin sobrescritura.        | 4    | 3    | **Media** | Evita la pérdida accidental de información técnica.          |
| **HU-37** | **Verificación de Integridad**.                         | - Validación de que el PDF no fue alterado tras la firma.    | 5    | 2    | **Media** | [cite_start]Garantiza la autenticidad exigida por la norma. [cite: 185] |

---

## Épica 4: Reportabilidad e Inteligencia de Negocios
[cite_start]*Justificación: Transforma los datos operativos en métricas estratégicas.* [cite: 28, 138]

| ID        | Historia de Usuario                                       | Criterios de Aceptación                                      | Imp. | Urg. | Prioridad | Comentario / Justificación                                   |
| :-------- | :-------------------------------------------------------- | :----------------------------------------------------------- | :--- | :--- | :-------- | :----------------------------------------------------------- |
| **HU-20** | [cite_start]**Integración Power BI**[cite: 29, 139].      | - [cite_start]Conexión directa a listas de SharePoint Online. [cite: 139] | 4    | 3    | **Media** | Automatiza reportes sin exportación manual.                  |
| **HU-21** | [cite_start]**Reportes por Categoría**[cite: 30, 140].    | - [cite_start]Gráficos visuales segmentados por tipo de documento. [cite: 30] | 3    | 2    | **Media** | [cite_start]Facilita el análisis de volumen de documentación. [cite: 140] |
| **HU-23** | [cite_start]**Monitor de Estados KPI**[cite: 31, 32, 33]. | - [cite_start]Tarjetas visuales: Abiertos, En Progreso, Cerrados. [cite: 31, 32, 33] | 4    | 3    | **Media** | Identifica cuellos de botella operativos.                    |

---

## Cuadro de Priorización - Matriz de Eisenhower

| Cuadrante                       | Descripción                    | HUs Incluidas                             |
| :------------------------------ | :----------------------------- | :---------------------------------------- |
| **I. Importante y Urgente**     | Hacer de inmediato (Núcleo)    | HU-01 a HU-07, HU-11, HU-12, HU-14, HU-17 |
| **II. Importante, No Urgente**  | Planificar y Diseñar (Calidad) | HU-10, HU-13, HU-16, HU-37                |
| **III. Urgente, No Importante** | Agendar o Delegar (Gestión)    | HU-23, Notificaciones                     |
| **IV. Ni Imp. ni Urgente**      | Posponer (Mejoras)             | HU-24 (Excel), HU-30 (Fotos)              |

---
[cite_start]*Documento generado para la asignatura Gestión de Proyectos de Software — UBB 2026.* [cite: 94, 96]