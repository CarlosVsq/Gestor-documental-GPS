import { useState, useEffect } from 'react';
import type { CreateAreaDto } from '../api/areas';
import type { Contratista } from '../api/contratistas';

interface AreaFormProps {
    onSubmit: (data: CreateAreaDto) => void;
    initialData?: CreateAreaDto;
    isEditing?: boolean;
    onCancel?: () => void;
    contratistas: Contratista[];
}

export default function AreaForm({ onSubmit, initialData, isEditing, onCancel, contratistas }: AreaFormProps) {
    const [formData, setFormData] = useState<CreateAreaDto>({
        nombre: '',
        codigoArea: '',
        descripcion: '',
        contratistaId: 0,
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
        if (!formData.codigoArea || formData.codigoArea.length < 1 || formData.codigoArea.length > 10) {
            newErrors.codigoArea = 'El código es requerido y debe tener entre 1 y 10 caracteres';
        } else if (!/^[A-Z0-9]+$/.test(formData.codigoArea)) {
            newErrors.codigoArea = 'El código debe ser alfanumérico en mayúsculas';
        }
        if (!formData.contratistaId || formData.contratistaId === 0) {
            newErrors.contratistaId = 'Debe seleccionar un contratista';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            if (!isEditing) setFormData({ nombre: '', codigoArea: '', descripcion: '', contratistaId: 0 });
        }
    };

    const handleChange = (field: keyof CreateAreaDto, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-header">
                <h2>{isEditing ? 'Editar Área' : 'Nueva Área'}</h2>
                <p>{isEditing ? 'Modifica los datos del área seleccionada' : 'Completa los datos para registrar una nueva área'}</p>
            </div>

            <div className="form-fields">
                <div className={`field-group ${errors.nombre ? 'has-error' : ''}`}>
                    <label htmlFor="area-nombre">Nombre del Área <span className="required">*</span></label>
                    <input
                        id="area-nombre"
                        type="text"
                        placeholder="Ej: Área de Ingeniería"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                    />
                    {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                </div>

                <div className={`field-group ${errors.codigoArea ? 'has-error' : ''}`}>
                    <label htmlFor="area-codigo">Código de Área <span className="required">*</span></label>
                    <input
                        id="area-codigo"
                        type="text"
                        placeholder="Ej: CIVIL"
                        value={formData.codigoArea}
                        onChange={(e) => handleChange('codigoArea', e.target.value.toUpperCase())}
                    />
                    {errors.codigoArea && <span className="field-error">{errors.codigoArea}</span>}
                </div>

                <div className="field-group">
                    <label htmlFor="area-descripcion">Descripción <span className="optional">(opcional)</span></label>
                    <input
                        id="area-descripcion"
                        type="text"
                        placeholder="Ej: Área encargada de los proyectos de ingeniería"
                        value={formData.descripcion || ''}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                    />
                </div>

                <div className={`field-group ${errors.contratistaId ? 'has-error' : ''}`}>
                    <label htmlFor="area-contratista">Contratista <span className="required">*</span></label>
                    <select
                        id="area-contratista"
                        className="field-select"
                        value={formData.contratistaId || ''}
                        onChange={(e) => handleChange('contratistaId', Number(e.target.value))}
                    >
                        <option value="">Seleccionar contratista...</option>
                        {contratistas.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre} ({c.rut})
                            </option>
                        ))}
                    </select>
                    {errors.contratistaId && <span className="field-error">{errors.contratistaId}</span>}
                </div>
            </div>

            <div className="modal-form-actions">
                {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Guardar Cambios' : 'Crear Área'}
                </button>
            </div>
        </form>
    );
}
