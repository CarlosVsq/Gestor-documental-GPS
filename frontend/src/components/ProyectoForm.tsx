import { useState, useEffect } from 'react';
import type { CreateProyectoDto } from '../api/proyectos';
import type { Area } from '../api/areas';

interface ProyectoFormProps {
    onSubmit: (data: CreateProyectoDto) => void;
    initialData?: CreateProyectoDto;
    isEditing?: boolean;
    onCancel?: () => void;
    areas: Area[];
}

export default function ProyectoForm({ onSubmit, initialData, isEditing, onCancel, areas }: ProyectoFormProps) {
    const [formData, setFormData] = useState<CreateProyectoDto>({
        nombre: '',
        fechaInicio: '',
        fechaFin: '',
        areaId: 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre || formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }
        if (!formData.fechaInicio) {
            newErrors.fechaInicio = 'La fecha de inicio es requerida';
        }
        if (!formData.fechaFin) {
            newErrors.fechaFin = 'La fecha de fin es requerida';
        }
        if (formData.fechaInicio && formData.fechaFin && new Date(formData.fechaFin) <= new Date(formData.fechaInicio)) {
            newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        if (!formData.areaId || formData.areaId === 0) {
            newErrors.areaId = 'Debe seleccionar un área';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            if (!isEditing) setFormData({ nombre: '', fechaInicio: '', fechaFin: '', areaId: 0 });
        }
    };

    const handleChange = (field: keyof CreateProyectoDto, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Agrupar áreas por contratista para mejor UX
    const areasByContratista: Record<string, Area[]> = {};
    areas.forEach(a => {
        const key = a.contratista?.nombre || 'Sin Contratista';
        if (!areasByContratista[key]) areasByContratista[key] = [];
        areasByContratista[key].push(a);
    });

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-header">
                <h2>{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
                <p>{isEditing ? 'Modifica los datos del proyecto seleccionado' : 'Completa los datos para registrar un nuevo proyecto'}</p>
            </div>

            <div className="form-fields">
                <div className={`field-group ${errors.nombre ? 'has-error' : ''}`}>
                    <label htmlFor="proyecto-nombre">Nombre del Proyecto <span className="required">*</span></label>
                    <input
                        id="proyecto-nombre"
                        type="text"
                        placeholder="Ej: Proyecto Puente Norte"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                    />
                    {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                </div>

                <div className={`field-group ${errors.areaId ? 'has-error' : ''}`}>
                    <label htmlFor="proyecto-area">Área <span className="required">*</span></label>
                    <select
                        id="proyecto-area"
                        className="field-select"
                        value={formData.areaId || ''}
                        onChange={(e) => handleChange('areaId', Number(e.target.value))}
                    >
                        <option value="">Seleccionar área...</option>
                        {Object.entries(areasByContratista).map(([contratistaName, areasGroup]) => (
                            <optgroup key={contratistaName} label={contratistaName}>
                                {areasGroup.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nombre}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {errors.areaId && <span className="field-error">{errors.areaId}</span>}
                </div>

                <div className={`field-group ${errors.fechaInicio ? 'has-error' : ''}`}>
                    <label htmlFor="proyecto-fecha-inicio">Fecha de Inicio <span className="required">*</span></label>
                    <input
                        id="proyecto-fecha-inicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) => handleChange('fechaInicio', e.target.value)}
                    />
                    {errors.fechaInicio && <span className="field-error">{errors.fechaInicio}</span>}
                </div>

                <div className={`field-group ${errors.fechaFin ? 'has-error' : ''}`}>
                    <label htmlFor="proyecto-fecha-fin">Fecha de Fin <span className="required">*</span></label>
                    <input
                        id="proyecto-fecha-fin"
                        type="date"
                        value={formData.fechaFin}
                        onChange={(e) => handleChange('fechaFin', e.target.value)}
                    />
                    {errors.fechaFin && <span className="field-error">{errors.fechaFin}</span>}
                </div>
            </div>

            <div className="modal-form-actions">
                {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
            </div>
        </form>
    );
}
