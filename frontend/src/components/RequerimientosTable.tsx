import { Requerimiento, EstadoRequerimiento, PrioridadRequerimiento } from '../api/requerimientos';

interface RequerimientosTableProps {
    requerimientos: Requerimiento[];
    total: number;
    loading: boolean;
    onUpdateState: (id: number, estado: EstadoRequerimiento) => void;
    proyectos: Record<number, string>;
    contratistas: Record<number, string>;
}

export default function RequerimientosTable({ requerimientos, total, loading, onUpdateState, proyectos, contratistas }: RequerimientosTableProps) {
    if (loading) {
        return <div className="table-loading"><div className="spinner"></div><p>Cargando requerimientos...</p></div>;
    }

    if (!requerimientos.length) {
        return (
            <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3>No hay requerimientos</h3>
                <p>Comienza creando el primer ticket de requerimiento documental.</p>
            </div>
        );
    }

    const getPriorityBadge = (prioridad: PrioridadRequerimiento) => {
        const styles = {
            [PrioridadRequerimiento.BAJA]: 'badge-info',
            [PrioridadRequerimiento.MEDIA]: 'badge-warning',
            [PrioridadRequerimiento.ALTA]: 'badge-danger',
            [PrioridadRequerimiento.CRITICA]: 'badge-error',
        };
        return <span className={`badge ${styles[prioridad] || 'badge-gray'}`}>{prioridad}</span>;
    };

    const getEstadoBadge = (estado: EstadoRequerimiento) => {
        const styles = {
            [EstadoRequerimiento.ABIERTO]: 'badge-success',
            [EstadoRequerimiento.EN_PROGRESO]: 'badge-warning',
            [EstadoRequerimiento.CERRADO]: 'badge-gray',
        };
        return <span className={`badge ${styles[estado] || 'badge-gray'}`}>{estado}</span>;
    };

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Ticket</th>
                        <th>Título</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Contratista</th>
                        <th>Proyecto</th>
                        <th>Vencimiento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {requerimientos.map(req => (
                        <tr key={req.id}>
                            <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{req.codigoTicket || `REQ-${req.id}`}</td>
                            <td>
                                <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{req.titulo}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>{req.descripcion?.substring(0, 50) || 'Sin descripción'}...</div>
                            </td>
                            <td>{getPriorityBadge(req.prioridad)}</td>
                            <td>{getEstadoBadge(req.estado)}</td>
                            <td>{contratistas[req.contratistaId] || `ID: ${req.contratistaId}`}</td>
                            <td>{proyectos[req.proyectoId] || `ID: ${req.proyectoId}`}</td>
                            <td style={{ color: req.fechaVencimiento && new Date(req.fechaVencimiento) < new Date() ? 'var(--error)' : 'inherit' }}>
                                {req.fechaVencimiento ? new Date(req.fechaVencimiento).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    {req.estado === EstadoRequerimiento.ABIERTO && (
                                        <button className="btn-icon btn-icon-warning" title="Pasar a En Progreso" onClick={() => onUpdateState(req.id, EstadoRequerimiento.EN_PROGRESO)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        </button>
                                    )}
                                    {req.estado === EstadoRequerimiento.EN_PROGRESO && (
                                        <button className="btn-icon btn-icon-success" title="Cerrar Requerimiento" onClick={() => onUpdateState(req.id, EstadoRequerimiento.CERRADO)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </button>
                                    )}
                                    {req.estado === EstadoRequerimiento.CERRADO && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Finalizado</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="table-footer">
                <span>Mostrando {requerimientos.length} de {total} requerimientos</span>
            </div>
        </div>
    );
}
