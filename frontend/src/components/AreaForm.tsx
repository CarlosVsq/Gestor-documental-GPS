import { useState, useEffect } from 'react';
import type { CreateAreaDto } from '../api/areas';
import { contratistasApi, Contratista } from '../api/contratistas';

interface Props {
    initialData?: CreateAreaDto;
    isEditing: boolean;
    onSubmit: (data: CreateAreaDto) => Promise<void>;
    onCancel: () => void;
}

export default function AreaForm({ initialData, isEditing, onSubmit, onCancel }: Props) {
    const [formData, setFormData] = useState<CreateAreaDto>({
        nombre: initialData?.nombre || '',
        descripcion: initialData?.descripcion || '',
        contratista_id: initialData?.contratista_id || 0,
    });
    const [contratistas, setContratistas] = useState<Contratista[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        contratistasApi.getAll(1, 100).then(res => setContratistas(res.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre || !formData.contratista_id) {
            alert("Nombre y Contratista son obligatorios.");
            return;
        }
        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <div className="form-container scale-in">
            <div className="form-header">
                <h2>{isEditing ? 'Editar Área' : 'Nueva Área'}</h2>
                <button type="button" className="btn-icon" onClick={onCancel}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="form-body">
                <div className="form-group">
                    <label htmlFor="nombre">Nombre del Área <span className="text-danger">*</span></label>
                    <input
                        id="nombre"
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Recursos Humanos"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea
                        id="descripcion"
                        className="form-control"
                        rows={3}
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripción detallada del área"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="contratista_id">Contratista <span className="text-danger">*</span></label>
                    <select
                        id="contratista_id"
                        className="form-control"
                        value={formData.contratista_id || ''}
                        onChange={(e) => setFormData({ ...formData, contratista_id: Number(e.target.value) })}
                        required
                    >
                        <option value="" disabled>Seleccione un contratista</option>
                        {contratistas.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} (RUT: {c.rut})</option>
                        ))}
                    </select>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar Área' : 'Crear Área')}
                        {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                </div>
            </form>
        </div>
    );
}
