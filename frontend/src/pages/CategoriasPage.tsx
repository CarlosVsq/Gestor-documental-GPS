import { useState, useEffect, useCallback } from 'react';
import { categoriasApi } from '../api/categorias';
import type { Categoria, CreateCategoriaDto } from '../api/categorias';
import CategoriasTable from '../components/CategoriasTable';
import CategoriasForm from '../components/CategoriasForm';

export default function CategoriasPage({ onNotify }: { onNotify: (msg: string, type: 'success' | 'error') => void }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoriasApi.findAll(1, 50);
      setCategorias(response.data);
      setTotal(response.total);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: CreateCategoriaDto) => {
    try {
      await categoriasApi.create(data);
      onNotify('Categoría creada exitosamente', 'success');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al crear', 'error');
    }
  };

  const handleUpdate = async (data: CreateCategoriaDto) => {
    if (!editingCategoria) return;
    try {
      await categoriasApi.update(editingCategoria.id, data);
      onNotify('Categoría actualizada', 'success');
      setEditingCategoria(null);
      setShowForm(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar', 'error');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await categoriasApi.toggle(id);
      onNotify('Estado actualizado', 'success');
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al cambiar estado', 'error');
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setEditingCategoria(null); setShowForm(true); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nueva Categoría
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <CategoriasTable
          data={categorias}
          onEdit={(c) => { setEditingCategoria(c); setShowForm(true); }}
          onToggleStatus={handleToggle}
        />
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setEditingCategoria(null); setShowForm(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <CategoriasForm
              onSubmit={editingCategoria ? handleUpdate : handleCreate}
              initialData={editingCategoria ? { nombre: editingCategoria.nombre, descripcion: editingCategoria.descripcion } : undefined}
              isEditing={!!editingCategoria}
              onCancel={() => { setEditingCategoria(null); setShowForm(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
