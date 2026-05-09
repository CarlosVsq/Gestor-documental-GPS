import { useState, useEffect, useCallback, useMemo } from 'react';
import { requerimientosApi } from '../api/requerimientos';
import type { Requerimiento, CreateRequerimientoDto, EstadoRequerimiento, PrioridadRequerimiento } from '../api/requerimientos';
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
  const [stats, setStats] = useState({ total: 0, abiertos: 0, enProgreso: 0, cerrados: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Filtros
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('');

  // Data for Form Selects & Lookups
  const [contratistasList, setContratistasList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [proyectosList, setProyectosList] = useState<any[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);
  const [subtiposList, setSubtiposList] = useState<any[]>([]);

  const contratistasMap = useMemo(() => {
    return contratistasList.reduce((acc, c) => ({ ...acc, [c.id]: c.nombre }), {});
  }, [contratistasList]);

  const proyectosMap = useMemo(() => {
    return proyectosList.reduce((acc, p) => ({ ...acc, [p.id]: p.nombre }), {});
  }, [proyectosList]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resReq, resStats] = await Promise.all([
        requerimientosApi.getAll(1, 50, { estado: filterEstado, prioridad: filterPrioridad }),
        requerimientosApi.getStats()
      ]);
      setRequerimientos(resReq.data);
      setTotal(resReq.total);
      setStats(resStats);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar requerimientos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify, filterEstado, filterPrioridad]);

  const loadFormData = useCallback(async () => {
    try {
      const [resCont, resArea, resProy, resCat, resSub] = await Promise.all([
        contratistasApi.getAll(1, 100),
        areasApi.getAll(1, 100),
        proyectosApi.getAll(1, 100),
        categoriasApi.findAll(1, 100),
        subtiposApi.findAll(1, 100),
      ]);
      setContratistasList(resCont.data.filter((x: any) => x.activo));
      setAreasList(resArea.data.filter((x: any) => x.activo));
      setProyectosList(resProy.data.filter((x: any) => x.activo));
      setCategoriasList(resCat.data.filter((x: any) => x.activo));
      setSubtiposList(resSub.data.filter((x: any) => x.activo));
    } catch (err) {
      console.error('Error cargando dependencias', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

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
      {/* Topbar Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="field-select" value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ width: '150px' }}>
            <option value="">Todos los Estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Cerrado">Cerrado</option>
          </select>

          <select className="field-select" value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)} style={{ width: '150px' }}>
            <option value="">Todas Prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
          Nuevo Requerimiento
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="mini-stats-bar" style={{ marginBottom: '20px' }}>
        <div className="mini-stat"><span className="mini-stat-value">{stats.total}</span><span className="mini-stat-label">Total Tickets</span></div>
        <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--info)' }}>{stats.abiertos}</span><span className="mini-stat-label">Abiertos</span></div>
        <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--warning)' }}>{stats.enProgreso}</span><span className="mini-stat-label">En Progreso</span></div>
        <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--gray-500)' }}>{stats.cerrados}</span><span className="mini-stat-label">Cerrados</span></div>
      </div>

      <RequerimientosTable
        requerimientos={requerimientos}
        total={total}
        loading={loading}
        onUpdateState={handleChangeState}
        proyectos={proyectosMap}
        contratistas={contratistasMap}
      />

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <RequerimientoForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              contratistas={contratistasList}
              areas={areasList}
              proyectos={proyectosList}
              categorias={categoriasList}
              subtipos={subtiposList}
            />
          </div>
        </div>
      )}
    </div>
  );
}
