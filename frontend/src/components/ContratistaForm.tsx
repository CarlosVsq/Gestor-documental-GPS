import { useState, useEffect } from 'react';
import type { CreateContratistaDto } from '../api/contratistas';

interface ContratistaFormProps {
  onSubmit: (data: CreateContratistaDto) => void;
  initialData?: CreateContratistaDto;
  isEditing?: boolean;
  onCancel?: () => void;
}

export default function ContratistaForm({ onSubmit, initialData, isEditing, onCancel }: ContratistaFormProps) {
  const [formData, setFormData] = useState<CreateContratistaDto>({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateRut = (rut: string) => /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(rut);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre || formData.nombre.length < 2) newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    if (!formData.rut || !validateRut(formData.rut)) newErrors.rut = 'Formato de RUT inválido (ej: 76.123.456-7)';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      if (!isEditing) setFormData({ nombre: '', rut: '', email: '', telefono: '' });
    }
  };

  // Auto-formatear RUT (agrega puntos y guión)
  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '');
    if (clean.length < 2) return clean;
    const dv = clean.slice(-1);
    let numbers = clean.slice(0, -1);
    numbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${numbers}-${dv}`;
  };

  const handleChange = (field: keyof CreateContratistaDto, value: string) => {
    const finalValue = field === 'rut' ? formatRut(value) : value;
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="modal-form-header">
        <h2>{isEditing ? 'Editar Contratista' : 'Nuevo Contratista'}</h2>
        <p>{isEditing ? 'Modifica los datos del contratista seleccionado' : 'Completa los datos para registrar un nuevo contratista'}</p>
      </div>

      <div className="form-fields">
        <div className={`field-group ${errors.nombre ? 'has-error' : ''}`}>
          <label htmlFor="nombre">Nombre / Razón Social <span className="required">*</span></label>
          <input id="nombre" type="text" placeholder="Ej: Constructora Sur SpA" value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
          {errors.nombre && <span className="field-error">{errors.nombre}</span>}
        </div>

        <div className={`field-group ${errors.rut ? 'has-error' : ''}`}>
          <label htmlFor="rut">RUT <span className="required">*</span></label>
          <input id="rut" type="text" placeholder="Ej: 76.123.456-7" value={formData.rut} onChange={(e) => handleChange('rut', e.target.value)} disabled={isEditing} />
          {errors.rut && <span className="field-error">{errors.rut}</span>}
        </div>

        <div className={`field-group ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input id="email" type="email" placeholder="Ej: contacto@empresa.cl" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="telefono">Teléfono <span className="optional">(opcional)</span></label>
          <input id="telefono" type="text" placeholder="Ej: +56912345678" value={formData.telefono || ''} onChange={(e) => handleChange('telefono', e.target.value)} />
        </div>
      </div>

      <div className="modal-form-actions">
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Guardar Cambios' : 'Crear Contratista'}
        </button>
      </div>
    </form>
  );
}
