import type { Requerimiento, EstadoRequerimiento } from '../api/requerimientos';

interface RequerimientosTableProps {
    data: Requerimiento[];
    onChangeState: (id: number, newState: EstadoRequerimiento) => void;
}

export default function RequerimientosTable({ data, onChangeState }: RequerimientosTableProps) {
    if (!data || data.length === 0) {
        return <div className="empty-state"><p>No hay requerimientos registrados.</p></div>;
    }

    const getStateBadge = (estado: string) => {
        switch (estado) {
            case 'Abierto': return <span className="badge badge-warning">Abierto</span>;
            case 'En Progreso': return <span className="badge badge-primary" style={{background: 'var(--blue-50)', color: 'var(--blue-600)'}}>En Progreso</span>;
            case 'Cerrado': return <span className="badge badge-success">Cerrado</span>;
            default: return <span className="badge">{estado}</span>;
        }
    };

    return (
        <div className="table-card">
            <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Estado</th>
                        <th>Fecha Creación</th>
                        <th className="actions-cell">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((req) => (
                        <tr key={req.id}>
                            <td>#{req.id}</td>
                            <td className="font-medium">{req.titulo}</td>
                            <td>{getStateBadge(req.estado)}</td>
                            <td>{new Date(req.creadoEn).toLocaleDateString()}</td>
                            <td className="actions-cell">
                                <select 
                                    className="field-select" 
                                    style={{padding: '4px', fontSize: '12px'}}
                                    value={req.estado}
                                    onChange={(e) => onChangeState(req.id, e.target.value as EstadoRequerimiento)}
                                    disabled={req.estado === 'Cerrado'}
                                >
                                    <option value="Abierto">Abierto</option>
                                    <option value="En Progreso">En Progreso</option>
                                    <option value="Cerrado">Cerrado</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    );
}
