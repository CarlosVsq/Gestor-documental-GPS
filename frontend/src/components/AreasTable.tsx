import { Area } from '../api/areas';

interface Props {
    areas: Area[];
    total: number;
    loading: boolean;
    onEdit: (a: Area) => void;
    onDelete: (id: number) => void;
}

export default function AreasTable({ areas, total, loading, onEdit, onDelete }: Props) {
    if (loading) return <div className="loading-state">Cargando áreas...</div>;

    return (
        <div className="table-container fade-in">
            <div className="table-header-info">
                <h2 className="table-title">Listado de Áreas</h2>
                <span className="badge badge-neutral">{total} áreas encontradas</span>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Contratista</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {areas.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="empty-state">
                                No hay áreas registradas.
                            </td>
                        </tr>
                    ) : (
                        areas.map((area) => (
                            <tr key={area.id}>
                                <td className="col-id">#{area.id}</td>
                                <td className="col-primary font-medium">{area.nombre}</td>
                                <td>{area.descripcion || <span className="text-muted">Sin descripción</span>}</td>
                                <td>
                                    {area.contratista ? (
                                        <div className="flex-center gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                                            {area.contratista.nombre}
                                        </div>
                                    ) : (
                                        <span className="badge badge-inactive">No Asignado</span>
                                    )}
                                </td>
                                <td className="col-actions">
                                    <button className="btn-icon btn-edit" onClick={() => onEdit(area)} title="Editar">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button className="btn-icon btn-delete" onClick={() => onDelete(area.id)} title="Eliminar">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
