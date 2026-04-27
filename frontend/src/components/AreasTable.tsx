import type { Area } from '../api/areas';

interface AreasTableProps {
    areas: Area[];
    total: number;
    onEdit: (area: Area) => void;
    onDelete: (id: number) => void;
    loading?: boolean;
}

export default function AreasTable({ areas, total, onEdit, onDelete, loading }: AreasTableProps) {
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
                    <p>Cargando áreas...</p>
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
                    <input type="text" placeholder="Buscar área..." className="search-input" />
                </div>
                <div className="table-filters">
                    <span className="results-count">{total} resultado{total !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {areas.length === 0 ? (
                <div className="empty-state">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3>No hay áreas registradas</h3>
                    <p>Haz clic en "Nueva Área" para crear el primer registro</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Área</th>
                                <th>Descripción</th>
                                <th>Contratista</th>
                                <th>Estado</th>
                                <th>Registrado</th>
                                <th style={{ width: '100px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {areas.map((a) => (
                                <tr key={a.id}>
                                    <td>
                                        <div className="cell-person">
                                            <div className="person-avatar" style={{ backgroundColor: `hsl(${(a.id * 97) % 360}, 55%, 60%)` }}>
                                                {a.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="person-name">{a.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="cell-muted">{a.descripcion || '—'}</td>
                                    <td>
                                        {a.contratista ? (
                                            <code className="rut-chip">{a.contratista.nombre}</code>
                                        ) : (
                                            <span className="cell-muted">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${a.activo ? 'status-active' : 'status-inactive'}`}>
                                            <span className="status-dot" />
                                            {a.activo ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="cell-muted cell-date">{formatDate(a.creadoEn)}</td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="action-btn action-edit" onClick={() => onEdit(a)} title="Editar">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button className="action-btn action-delete" onClick={() => onDelete(a.id)} title="Eliminar">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
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
