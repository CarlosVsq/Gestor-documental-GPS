import { useState, useEffect } from 'react';
import type { CreateSubtipoDto } from '../api/subtipos';
import type { Categoria } from '../api/categorias';

interface SubtiposFormProps {
    onSubmit: (data: CreateSubtipoDto) => void;
    initialData?: CreateSubtipoDto;
    isEditing?: boolean;
    onCancel?: () => void;
    categorias: Categoria[];
}

export default function SubtiposForm({ onSubmit, initialData, isEditing, onCancel, categorias }: SubtiposFormProps) {
    const [formData, setFormData] = useState<CreateSubtipoDto>({
        nombre: '',
        descripcion: '',
        categoriaId: 0,
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
        if (!formData.categoriaId || formData.categoriaId === 0) {
            newErrors.categoriaId = 'Debe seleccionar una categoría';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            if (!isEditing) setFormData({ nombre: '', descripcion: '', categoriaId: 0 });
        }
    };

    const handleChange = (field: keyof CreateSubtipoDto, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-header">
                <h2>{isEditing ? 'Editar Subtipo' : 'Nuevo Subtipo'}</h2>
                <p>{isEditing ? 'Modifica los datos del subtipo' : 'Crea un nuevo subtipo para clasificar documentos'}</p>
            </div>

            <div className="form-fields">
                <div className={`field-group ${errors.nombre ? 'has-error' : ''}`}>
                    <label htmlFor="sub-nombre">Nombre <span className="required">*</span></label>
                    <input
                        id="sub-nombre"
                        type="text"
                        placeholder="Ej: Inducción Hombre Nuevo"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                    />
                    {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                </div>

                <div className="field-group">
                    <label htmlFor="sub-desc">Descripción</label>
                    <input
                        id="sub-desc"
                        type="text"
                        placeholder="Opcional"
                        value={formData.descripcion || ''}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                    />
                </div>

                <div className={`field-group ${errors.categoriaId ? 'has-error' : ''}`}>
                    <label htmlFor="sub-categoria">Categoría <span className="required">*</span></label>
                    <select
                        id="sub-categoria"
                        className="field-select"
                        value={formData.categoriaId || ''}
                        onChange={(e) => handleChange('categoriaId', Number(e.target.value))}
                    >
                        <option value="">Seleccionar categoría...</option>
                        {categorias.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                    {errors.categoriaId && <span className="field-error">{errors.categoriaId}</span>}
                </div>
            </div>

            <div className="modal-form-actions">
                {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Guardar Cambios' : 'Crear Subtipo'}
                </button>
            </div>
        </form>
    );
}
