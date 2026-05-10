import { useState, useEffect } from 'react';
import type { CreateCategoriaDto } from '../api/categorias';

interface CategoriasFormProps {
    onSubmit: (data: CreateCategoriaDto) => void;
    initialData?: CreateCategoriaDto;
    isEditing?: boolean;
    onCancel?: () => void;
}

export default function CategoriasForm({ onSubmit, initialData, isEditing, onCancel }: CategoriasFormProps) {
    const [formData, setFormData] = useState<CreateCategoriaDto>({
        nombre: '',
        descripcion: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({ nombre: initialData.nombre, descripcion: initialData.descripcion });
        }
    }, [initialData]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre || formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            if (!isEditing) setFormData({ nombre: '', descripcion: '' });
        }
    };

    const handleChange = (field: keyof CreateCategoriaDto, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-header">
                <h2>{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                <p>{isEditing ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de documentos'}</p>
            </div>

            <div className="form-fields">
                <div className={`field-group ${errors.nombre ? 'has-error' : ''}`}>
                    <label htmlFor="cat-nombre">Nombre <span className="required">*</span></label>
                    <input
                        id="cat-nombre"
                        type="text"
                        placeholder="Ej: Seguridad"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                    />
                    {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                </div>

                <div className="field-group">
                    <label htmlFor="cat-desc">Descripción</label>
                    <input
                        id="cat-desc"
                        type="text"
                        placeholder="Opcional"
                        value={formData.descripcion || ''}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                    />
                </div>
            </div>

            <div className="modal-form-actions">
                {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
            </div>
        </form>
    );
}
