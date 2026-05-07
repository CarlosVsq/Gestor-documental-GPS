import { useState, useEffect, useCallback } from 'react';
import { requerimientosApi } from '../api/requerimientos';
import type { Requerimiento, CreateRequerimientoDto, EstadoRequerimiento } from '../api/requerimientos';
import { contratistasApi } from '../api/contratistas';
import { areasApi } from '../api/areas';
import { proyectosApi } from '../api/proyectos';
import { categoriasApi } from '../api/categorias';
import { subtiposApi } from '../api/subtipos';
import RequerimientosTable from '../components/RequerimientosTable';
import RequerimientoForm from '../components/RequerimientoForm';

export default function RequerimientosPage({ onNotify }: { onNotify: (msg: string, type: 'success' | 'error') => void }) {
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Data for Form Selects
  const [contratistas, setContratistas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [subtipos, setSubtipos] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requerimientosApi.findAll(1, 50);
      setRequerimientos(response.data);
      setTotal(response.total);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar requerimientos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  const loadFormData = useCallback(async () => {
    try {
      const [resCont, resArea, resProy, resCat, resSub] = await Promise.all([
        contratistasApi.getAll(1, 100),
        areasApi.getAll(1, 100),
        proyectosApi.getAll(1, 100),
        categoriasApi.findAll(1, 100),
        subtiposApi.findAll(1, 100),
      ]);
      setContratistas(resCont.data.filter((x: any) => x.activo));
      setAreas(resArea.data.filter((x: any) => x.activo));
      setProyectos(resProy.data.filter((x: any) => x.activo));
      setCategorias(resCat.data.filter((x: any) => x.activo));
      setSubtipos(resSub.data.filter((x: any) => x.activo));
    } catch (err) {
      console.error('Error cargando dependencias del formulario', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadFormData();
  }, [loadData, loadFormData]);

  const handleCreate = async (data: CreateRequerimientoDto) => {
    try {
      await requerimientosApi.create(data);
      onNotify('Requerimiento creado exitosamente', 'success');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al crear', 'error');
    }
  };

  const handleChangeState = async (id: number, estado: EstadoRequerimiento) => {
    try {
      await requerimientosApi.updateState(id, estado);
      onNotify('Estado actualizado', 'success');
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar estado', 'error');
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
          Nuevo Requerimiento
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <RequerimientosTable
          data={requerimientos}
          onChangeState={handleChangeState}
        />
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <RequerimientoForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              contratistas={contratistas}
              areas={areas}
              proyectos={proyectos}
              categorias={categorias}
              subtipos={subtipos}
            />
          </div>
        </div>
      )}
    </div>
  );
}
