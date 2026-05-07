import { useState, useEffect } from 'react';
import type { CreateRequerimientoDto } from '../api/requerimientos';

interface RequerimientoFormProps {
    onSubmit: (data: CreateRequerimientoDto) => void;
    onCancel?: () => void;
    proyectos: any[];
    areas: any[];
    contratistas: any[];
    categorias: any[];
    subtipos: any[];
}

export default function RequerimientoForm({ onSubmit, onCancel, proyectos, areas, contratistas, categorias, subtipos }: RequerimientoFormProps) {
    const [formData, setFormData] = useState<CreateRequerimientoDto>({
        titulo: '',
        descripcion: '',
        contratistaId: 0,
        areaId: 0,
        proyectoId: 0,
        categoriaId: 0,
        subtipoId: 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.titulo || formData.titulo.length < 5) newErrors.titulo = 'Mínimo 5 caracteres';
        if (!formData.contratistaId) newErrors.contratistaId = 'Requerido';
        if (!formData.areaId) newErrors.areaId = 'Requerido';
        if (!formData.proyectoId) newErrors.proyectoId = 'Requerido';
        if (!formData.categoriaId) newErrors.categoriaId = 'Requerido';
        if (!formData.subtipoId) newErrors.subtipoId = 'Requerido';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) onSubmit(formData);
    };

    const handleChange = (field: keyof CreateRequerimientoDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Filtros dinámicos
    const filteredAreas = formData.contratistaId ? areas.filter(a => a.contratistaId === formData.contratistaId) : areas;
    const filteredProyectos = formData.areaId ? proyectos.filter(p => p.areaId === formData.areaId) : proyectos;
    const filteredSubtipos = formData.categoriaId ? subtipos.filter(s => s.categoriaId === formData.categoriaId) : subtipos;

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-header">
                <h2>Nuevo Requerimiento</h2>
                <p>Crea un nuevo ticket de gestión documental</p>
            </div>

            <div className="form-fields">
                <div className={`field-group ${errors.titulo ? 'has-error' : ''}`}>
                    <label>Título del Requerimiento <span className="required">*</span></label>
                    <input type="text" value={formData.titulo} onChange={e => handleChange('titulo', e.target.value)} placeholder="Ej: Aprobación Planos" />
                    {errors.titulo && <span className="field-error">{errors.titulo}</span>}
                </div>

                <div className="field-group">
                    <label>Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => handleChange('descripcion', e.target.value)} rows={3} />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className={`field-group ${errors.contratistaId ? 'has-error' : ''}`}>
                        <label>Contratista <span className="required">*</span></label>
                        <select className="field-select" value={formData.contratistaId || ''} onChange={e => { handleChange('contratistaId', Number(e.target.value)); handleChange('areaId', 0); handleChange('proyectoId', 0); }}>
                            <option value="">Seleccionar...</option>
                            {contratistas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        {errors.contratistaId && <span className="field-error">{errors.contratistaId}</span>}
                    </div>

                    <div className={`field-group ${errors.areaId ? 'has-error' : ''}`}>
                        <label>Área <span className="required">*</span></label>
                        <select className="field-select" value={formData.areaId || ''} onChange={e => { handleChange('areaId', Number(e.target.value)); handleChange('proyectoId', 0); }} disabled={!formData.contratistaId}>
                            <option value="">Seleccionar...</option>
                            {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                        {errors.areaId && <span className="field-error">{errors.areaId}</span>}
                    </div>

                    <div className={`field-group ${errors.proyectoId ? 'has-error' : ''}`}>
                        <label>Proyecto <span className="required">*</span></label>
                        <select className="field-select" value={formData.proyectoId || ''} onChange={e => handleChange('proyectoId', Number(e.target.value))} disabled={!formData.areaId}>
                            <option value="">Seleccionar...</option>
                            {filteredProyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        {errors.proyectoId && <span className="field-error">{errors.proyectoId}</span>}
                    </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={`field-group ${errors.categoriaId ? 'has-error' : ''}`}>
                        <label>Categoría <span className="required">*</span></label>
                        <select className="field-select" value={formData.categoriaId || ''} onChange={e => { handleChange('categoriaId', Number(e.target.value)); handleChange('subtipoId', 0); }}>
                            <option value="">Seleccionar...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        {errors.categoriaId && <span className="field-error">{errors.categoriaId}</span>}
                    </div>

                    <div className={`field-group ${errors.subtipoId ? 'has-error' : ''}`}>
                        <label>Subtipo <span className="required">*</span></label>
                        <select className="field-select" value={formData.subtipoId || ''} onChange={e => handleChange('subtipoId', Number(e.target.value))} disabled={!formData.categoriaId}>
                            <option value="">Seleccionar...</option>
                            {filteredSubtipos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                        {errors.subtipoId && <span className="field-error">{errors.subtipoId}</span>}
                    </div>
                </div>
            </div>

            <div className="modal-form-actions">
                {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
                <button type="submit" className="btn btn-primary">Crear Requerimiento</button>
            </div>
        </form>
    );
}
