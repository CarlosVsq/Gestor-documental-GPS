import type { Proyecto } from '../api/proyectos';

interface ProyectosTableProps {
    proyectos: Proyecto[];
    total: number;
    onEdit: (proyecto: Proyecto) => void;
    onToggle: (id: number, activo: boolean) => void;
    loading?: boolean;
}

export default function ProyectosTable({ proyectos, total, onEdit, onToggle, loading }: ProyectosTableProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="table-card">
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Cargando proyectos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-card">
            {/* Table Header */}
            <div className="table-toolbar">
                <div className="table-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input type="text" placeholder="Buscar proyecto..." className="search-input" />
                </div>
                <div className="table-filters">
                    <span className="results-count">{total} resultado{total !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {proyectos.length === 0 ? (
                <div className="empty-state">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <h3>No hay proyectos registrados</h3>
                    <p>Haz clic en "Nuevo Proyecto" para crear el primer registro</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Proyecto</th>
                                <th>Código</th>
                                <th>Área</th>
                                <th>Contratista</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Estado</th>
                                <th style={{ width: '100px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proyectos.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="cell-person">
                                            <div className="person-avatar" style={{ backgroundColor: `hsl(${(p.id * 137) % 360}, 55%, 60%)` }}>
                                                {p.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="person-name">{p.nombre}</span>
                                        </div>
                                    </td>
                                    <td><code className="rut-chip">{p.codigo}</code></td>
                                    <td>
                                        {p.area ? (
                                            <code className="rut-chip">{p.area.nombre}</code>
                                        ) : (
                                            <span className="cell-muted">—</span>
                                        )}
                                    </td>
                                    <td className="cell-muted">
                                        {p.area?.contratista ? p.area.contratista.nombre : '—'}
                                    </td>
                                    <td className="cell-muted cell-date">{formatDate(p.fechaInicio)}</td>
                                    <td className="cell-muted cell-date">{formatDate(p.fechaFin)}</td>
                                    <td>
                                        <span className={`status-badge ${p.activo ? 'status-active' : 'status-inactive'}`}>
                                            <span className="status-dot" />
                                            {p.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="action-btn action-edit" onClick={() => onEdit(p)} title="Editar">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button
                                                className={`action-btn ${p.activo ? 'action-delete' : 'action-edit'}`}
                                                onClick={() => onToggle(p.id, p.activo)}
                                                title={p.activo ? 'Desactivar proyecto' : 'Activar proyecto'}
                                            >
                                                {p.activo ? (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" /></svg>
                                                ) : (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
