import { useState, useEffect, useCallback, useMemo } from 'react';
import { requerimientosApi } from '../api/requerimientos';
import type { Requerimiento, CreateRequerimientoDto, EstadoRequerimiento } from '../api/requerimientos';
import { contratistasApi } from '../api/contratistas';
import { areasApi } from '../api/areas';
import { proyectosApi } from '../api/proyectos';
import { categoriasApi } from '../api/categorias';
import { subtiposApi } from '../api/subtipos';
import RequerimientosTable from '../components/RequerimientosTable';
import RequerimientoForm from '../components/RequerimientoForm';
import KanbanBandeja from '../components/KanbanBandeja';
import { almacenamientoApi } from '../api/almacenamiento';
import { useAuth } from '../context/AuthContext';

const ROLES_REPORTE = ['admin', 'supervisor', 'gerente'];

interface RequerimientosPageProps {
  onNotify: (msg: string, type: 'success' | 'error') => void;
  onNavigateToDocs?: (req: Requerimiento) => void;
}

export default function RequerimientosPage({ onNotify, onNavigateToDocs }: RequerimientosPageProps) {
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, abiertos: 0, enProgreso: 0, cerrados: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reporteEnProgreso, setReporteEnProgreso] = useState<number | null>(null);

  const { user } = useAuth();
  const puedeGenerarReporte = !!user && ROLES_REPORTE.includes(user.rol);

  // Filtros
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('');
  const [filterProyecto, setFilterProyecto] = useState<string>('');
  const [filterContratista, setFilterContratista] = useState<string>('');
  const [vistaMode, setVistaMode] = useState<'tabla' | 'bandeja'>('tabla');
  const [ordenBandeja, setOrdenBandeja] = useState<'fecha' | 'urgencia'>('fecha');

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
      const estadoParam = vistaMode === 'bandeja' ? '' : filterEstado;
      const [resReq, resStats] = await Promise.all([
        requerimientosApi.getAll(1, 200, {
          estado: estadoParam || undefined,
          prioridad: filterPrioridad || undefined,
          proyectoId: filterProyecto ? Number(filterProyecto) : undefined,
          contratistaId: filterContratista ? Number(filterContratista) : undefined,
        }),
        requerimientosApi.getStats(),
      ]);
      setRequerimientos(resReq.data);
      setTotal(resReq.total);
      setStats(resStats);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar requerimientos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify, filterEstado, filterPrioridad, filterProyecto, filterContratista, vistaMode]);

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

  const handleGenerarReporte = async (req: Requerimiento) => {
    setReporteEnProgreso(req.id);
    try {
      await almacenamientoApi.generarReporteCierre(req.id);
      onNotify('Reporte de auditoría generado y archivado en el expediente', 'success');
    } catch (err: any) {
      onNotify(err.message || 'Error al generar el reporte de cierre', 'error');
    } finally {
      setReporteEnProgreso(null);
    }
  };

  return (
    <div className="page-content">
      {/* Topbar Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {vistaMode === 'tabla' && (
            <select className="field-select" value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ width: '150px' }}>
              <option value="">Todos los Estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          )}
          <select className="field-select" value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)} style={{ width: '140px' }}>
            <option value="">Todas Prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
          <select className="field-select" value={filterProyecto} onChange={e => setFilterProyecto(e.target.value)} style={{ width: '160px' }}>
            <option value="">Todos los Proyectos</option>
            {proyectosList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          {user?.rol !== 'contratista' && (
            <select className="field-select" value={filterContratista} onChange={e => setFilterContratista(e.target.value)} style={{ width: '170px' }}>
              <option value="">Todos los Contratistas</option>
              {contratistasList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
          {vistaMode === 'bandeja' && (
            <select className="field-select" value={ordenBandeja} onChange={e => setOrdenBandeja(e.target.value as 'fecha' | 'urgencia')} style={{ width: '140px' }}>
              <option value="fecha">Ordenar: Fecha</option>
              <option value="urgencia">Ordenar: Urgencia</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--gray-300)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setVistaMode('tabla')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 500,
                background: vistaMode === 'tabla' ? 'var(--primary-600)' : 'white',
                color: vistaMode === 'tabla' ? 'white' : 'var(--gray-600)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Tabla
            </button>
            <button
              onClick={() => setVistaMode('bandeja')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 500,
                background: vistaMode === 'bandeja' ? 'var(--primary-600)' : 'white',
                color: vistaMode === 'bandeja' ? 'white' : 'var(--gray-600)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Bandeja
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Nuevo Requerimiento
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="mini-stats-bar" style={{ marginBottom: '20px' }}>
        <div className="mini-stat"><span className="mini-stat-value">{stats.total}</span><span className="mini-stat-label">Total Tickets</span></div>
        <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--info)' }}>{stats.abiertos}</span><span className="mini-stat-label">Abiertos</span></div>
        <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--warning)' }}>{stats.enProgreso}</span><span className="mini-stat-label">En Progreso</span></div>
        <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--gray-500)' }}>{stats.cerrados}</span><span className="mini-stat-label">Cerrados</span></div>
      </div>

      {vistaMode === 'tabla' ? (
        <RequerimientosTable
          requerimientos={requerimientos}
          total={total}
          loading={loading}
          onUpdateState={handleChangeState}
          onViewDocs={onNavigateToDocs}
          onGenerarReporte={puedeGenerarReporte ? handleGenerarReporte : undefined}
          reporteEnProgreso={reporteEnProgreso}
          proyectos={proyectosMap}
          contratistas={contratistasMap}
        />
      ) : loading ? (
        <div className="table-loading"><div className="spinner" /><p>Cargando requerimientos...</p></div>
      ) : (
        <KanbanBandeja
          requerimientos={requerimientos}
          orden={ordenBandeja}
          onUpdateState={handleChangeState}
          onViewDocs={onNavigateToDocs}
          onGenerarReporte={puedeGenerarReporte ? handleGenerarReporte : undefined}
          reporteEnProgreso={reporteEnProgreso}
          proyectos={proyectosMap}
          contratistas={contratistasMap}
        />
      )}

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
