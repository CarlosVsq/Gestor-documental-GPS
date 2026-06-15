import { Requerimiento, EstadoRequerimiento, PrioridadRequerimiento } from '../api/requerimientos';

interface KanbanBandejaProps {
  requerimientos: Requerimiento[];
  orden: 'fecha' | 'urgencia';
  onUpdateState: (id: number, estado: EstadoRequerimiento) => void;
  onViewDocs?: (req: Requerimiento) => void;
  onGenerarReporte?: (req: Requerimiento) => void;
  reporteEnProgreso?: number | null;
  proyectos: Record<number, string>;
  contratistas: Record<number, string>;
}

const PRIORIDAD_ORDEN: Record<PrioridadRequerimiento, number> = {
  [PrioridadRequerimiento.CRITICA]: 0,
  [PrioridadRequerimiento.ALTA]: 1,
  [PrioridadRequerimiento.MEDIA]: 2,
  [PrioridadRequerimiento.BAJA]: 3,
};

const PRIORIDAD_COLOR: Record<PrioridadRequerimiento, string> = {
  [PrioridadRequerimiento.CRITICA]: 'var(--error)',
  [PrioridadRequerimiento.ALTA]: 'var(--danger)',
  [PrioridadRequerimiento.MEDIA]: 'var(--warning)',
  [PrioridadRequerimiento.BAJA]: 'var(--info)',
};

function getAntiguedad(creadoEn: string): { dias: number; color: string } {
  const dias = Math.floor((Date.now() - new Date(creadoEn).getTime()) / (1000 * 60 * 60 * 24));
  const color = dias <= 2 ? '#22c55e' : dias <= 7 ? '#f97316' : '#ef4444';
  return { dias, color };
}

interface ColumnaProps {
  titulo: string;
  color: string;
  items: Requerimiento[];
  orden: 'fecha' | 'urgencia';
  onUpdateState: (id: number, estado: EstadoRequerimiento) => void;
  onViewDocs?: (req: Requerimiento) => void;
  onGenerarReporte?: (req: Requerimiento) => void;
  reporteEnProgreso?: number | null;
  proyectos: Record<number, string>;
  contratistas: Record<number, string>;
}

function KanbanColumna({
  titulo, color, items, orden,
  onUpdateState, onViewDocs, onGenerarReporte, reporteEnProgreso,
  proyectos, contratistas,
}: ColumnaProps) {
  const sorted = [...items].sort((a, b) =>
    orden === 'urgencia'
      ? PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad]
      : new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
  );

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: 'var(--gray-50)',
      borderRadius: '10px',
      padding: '12px',
      border: '1px solid var(--gray-200)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)' }}>{titulo}</span>
        <span style={{
          marginLeft: 'auto',
          background: 'var(--gray-200)',
          color: 'var(--gray-600)',
          borderRadius: '9999px',
          padding: '1px 8px',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}>{sorted.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((req) => {
          const ant = getAntiguedad(req.creadoEn);
          return (
            <div key={req.id} style={{
              background: 'white',
              borderRadius: '8px',
              padding: '10px 12px',
              border: '1px solid var(--gray-200)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                  {req.codigoTicket || `REQ-${req.id}`}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: PRIORIDAD_COLOR[req.prioridad] + '22',
                  color: PRIORIDAD_COLOR[req.prioridad],
                }}>
                  {req.prioridad}
                </span>
              </div>

              <div style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--gray-900)', marginBottom: '6px', lineHeight: 1.3 }}>
                {req.titulo}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '8px' }}>
                {contratistas[req.contratistaId] || `C-${req.contratistaId}`}
                {proyectos[req.proyectoId] ? ` · ${proyectos[req.proyectoId]}` : ''}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: ant.color,
                  background: ant.color + '18',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                }}>
                  {ant.dias}d
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {onViewDocs && req.storagePath && (
                    <button className="btn-icon btn-icon-info" title="Ver documentos" onClick={() => onViewDocs(req)}
                      style={{ width: 26, height: 26 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  )}
                  {req.estado === EstadoRequerimiento.ABIERTO && (
                    <button className="btn-icon btn-icon-warning" title="Pasar a En Progreso"
                      style={{ width: 26, height: 26 }}
                      onClick={() => onUpdateState(req.id, EstadoRequerimiento.EN_PROGRESO)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                    </button>
                  )}
                  {req.estado === EstadoRequerimiento.EN_PROGRESO && (
                    <button className="btn-icon btn-icon-success" title="Cerrar Requerimiento"
                      style={{ width: 26, height: 26 }}
                      onClick={() => onUpdateState(req.id, EstadoRequerimiento.CERRADO)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </button>
                  )}
                  {req.estado === EstadoRequerimiento.CERRADO && onGenerarReporte && (
                    <button className="btn-icon btn-icon-info" title="Generar reporte de cierre"
                      style={{ width: 26, height: 26 }}
                      disabled={reporteEnProgreso === req.id}
                      onClick={() => onGenerarReporte(req)}>
                      {reporteEnProgreso === req.id
                        ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem', padding: '20px 0' }}>
            Sin requerimientos
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBandeja({
  requerimientos, orden,
  onUpdateState, onViewDocs, onGenerarReporte, reporteEnProgreso,
  proyectos, contratistas,
}: KanbanBandejaProps) {
  const abiertos = requerimientos.filter(r => r.estado === EstadoRequerimiento.ABIERTO);
  const enProgreso = requerimientos.filter(r => r.estado === EstadoRequerimiento.EN_PROGRESO);
  const cerrados = requerimientos.filter(r => r.estado === EstadoRequerimiento.CERRADO);

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px' }}>
      <KanbanColumna titulo="Pendientes" color="#3b82f6" items={abiertos} orden={orden}
        onUpdateState={onUpdateState} onViewDocs={onViewDocs}
        onGenerarReporte={onGenerarReporte} reporteEnProgreso={reporteEnProgreso}
        proyectos={proyectos} contratistas={contratistas} />
      <KanbanColumna titulo="En Progreso" color="#f97316" items={enProgreso} orden={orden}
        onUpdateState={onUpdateState} onViewDocs={onViewDocs}
        onGenerarReporte={onGenerarReporte} reporteEnProgreso={reporteEnProgreso}
        proyectos={proyectos} contratistas={contratistas} />
      <KanbanColumna titulo="Cerrado" color="#6b7280" items={cerrados} orden={orden}
        onUpdateState={onUpdateState} onViewDocs={onViewDocs}
        onGenerarReporte={onGenerarReporte} reporteEnProgreso={reporteEnProgreso}
        proyectos={proyectos} contratistas={contratistas} />
    </div>
  );
}
