/**
 * Constantes compartidas — ms-auth
 * Roles y patrones TCP de este servicio.
 */
export enum Role {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  GERENTE = 'gerente',
  COLABORADOR = 'colaborador',
  AUDITOR = 'auditor',
  CONTRATISTA = 'contratista',
}
/**
 * ROLES DEL SISTEMA
 * 
 * 1. Administrador (Control Total)
 * Es el usuario con el nivel más alto de acceso, encargado de la configuración base del sistema.
 *  Gestión de Usuarios: Puede crear, editar y aplicar soft delete a cualquier cuenta del sistema (HU-26).  
 *  Mantenedores: Es el único que puede gestionar la lista de Contratistas, Áreas, Proyectos, Categorías y Subtipos (HU-01 a HU-05).  
 *  Visibilidad Global: Tiene acceso a ver todos los requerimientos y documentos de todas las áreas y empresas.  \
 *  Configuración Técnica: Define los tiempos de inactividad y permisos a nivel de carpeta en SharePoint (HU-17, HU-27)
 * 
 * 2. Supervisor / Gerente (Gestión y Análisis)
 * Su rol está enfocado en la supervisión del cumplimiento y la toma de decisiones basada en datos.
 *  Seguimiento de Ciclo de Vida: Puede cambiar estados de requerimientos y supervisar la bandeja de tareas pendientes (HU-14, HU-15).  
 *  Validación de Cierre: Es responsable de asegurar que un requerimiento no se cierre sin las firmas y documentos necesarios (HU-19).  
 *  Analítica: Acceso total a los reportes de Power BI para ver métricas por usuario, categoría y desempeño de contratistas (HU-20 a HU-23).  
 *  Notificaciones: Recibe alertas en tiempo real cuando se sube nueva documentación técnica (HU-34).
 * 
 * 3. Colaborador (Operación y Carga)
 * Representa al personal operativo (interno o externo) que ejecuta las tareas diarias en el sistema.
 *  Gestión Documental: Puede subir documentos de forma individual o masiva y asociarlos a un proyecto (HU-07, HU-08).  
 *  Formularios y Captura: Encargado de llenar formularios de inspección, adjuntar fotos y trabajar en modo offline si es necesario (HU-10, HU-28, HU-30).  
 *  Firma Digital: Tiene permiso para estampar su firma digital en los formularios para generar el PDF final (HU-11, HU-29).  
 *  Visualización: Puede ver y buscar documentos mediante metadatos para realizar sus tareas (HU-09, HU-31).
 * 
 * 4. Contratista (Acceso Restringido por Empresa)
 * Este rol es una especialización del colaborador, pero con una restricción de visibilidad crítica para la privacidad.
 *  Filtro de Información: Solo puede ver los requerimientos, proyectos y documentos asociados estrictamente a su contratista_id (HU-N3).  
 *  Carga de Evidencias: Sube los documentos técnicos requeridos para que el supervisor los revise.  
 *  Sin Acceso a Mantenedores: No puede ver ni modificar la estructura de áreas, otros contratistas o la configuración del sistema. 
 * 
 * 5. Auditor (Solo Lectura)
 * Rol diseñado para revisiones externas o procesos de cumplimiento de normas como la ISO 30300.
 *  Acceso a Documentos: Puede visualizar y descargar archivos originales, pero no tiene permiso para subir o editar información (HU-09, HU-17).  
 *  Trazabilidad: Puede consultar el registro inmutable (log) de quién creó, modificó o firmó cada documento (HU-16).  
 *  Reportabilidad: Puede ver reportes históricos para garantizar que el proceso documental fue transparente.
 * 
 */

export const AUTH_PATTERNS = {
  LOGIN: 'auth.login',
  PROFILE: 'auth.profile',
  FIND_ALL_USERS: 'auth.users.findAll',
  FIND_ONE_USER: 'auth.users.findOne',
  CREATE_USER: 'auth.users.create',
  UPDATE_USER: 'auth.users.update',
  TOGGLE_USER: 'auth.users.toggle',
  SEED_ADMIN: 'auth.seedAdmin',
  VALIDATE_USER: 'auth.validateUser',
} as const;
