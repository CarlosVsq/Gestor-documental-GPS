import { useState, useEffect, useCallback } from 'react';
import { subtiposApi } from '../api/subtipos';
import type { Subtipo, CreateSubtipoDto } from '../api/subtipos';
import { categoriasApi } from '../api/categorias';
import type { Categoria } from '../api/categorias';
import SubtiposTable from '../components/SubtiposTable';
import SubtiposForm from '../components/SubtiposForm';

export default function SubtiposPage({ onNotify }: { onNotify: (msg: string, type: 'success' | 'error') => void }) {
  const [subtipos, setSubtipos] = useState<Subtipo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingSubtipo, setEditingSubtipo] = useState<Subtipo | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, catRes] = await Promise.all([
        subtiposApi.findAll(1, 50),
        categoriasApi.findAll(1, 100),
      ]);
      setSubtipos(subRes.data);
      setTotal(subRes.total);
      setCategorias(catRes.data.filter((c: any) => c.activo)); // solo activas para el form
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: CreateSubtipoDto) => {
    try {
      await subtiposApi.create(data);
      onNotify('Subtipo creado exitosamente', 'success');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al crear', 'error');
    }
  };

  const handleUpdate = async (data: CreateSubtipoDto) => {
    if (!editingSubtipo) return;
    try {
      await subtiposApi.update(editingSubtipo.id, data);
      onNotify('Subtipo actualizado', 'success');
      setEditingSubtipo(null);
      setShowForm(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar', 'error');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await subtiposApi.toggle(id);
      onNotify('Estado actualizado', 'success');
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al cambiar estado', 'error');
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setEditingSubtipo(null); setShowForm(true); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Subtipo
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <SubtiposTable
          data={subtipos}
          onEdit={(s) => { setEditingSubtipo(s); setShowForm(true); }}
          onToggleStatus={handleToggle}
        />
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setEditingSubtipo(null); setShowForm(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <SubtiposForm
              onSubmit={editingSubtipo ? handleUpdate : handleCreate}
              initialData={editingSubtipo ? { nombre: editingSubtipo.nombre, descripcion: editingSubtipo.descripcion, categoriaId: editingSubtipo.categoriaId } : undefined}
              isEditing={!!editingSubtipo}
              onCancel={() => { setEditingSubtipo(null); setShowForm(false); }}
              categorias={categorias}
            />
          </div>
        </div>
      )}
    </div>
  );
}
