import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { almacenamientoApi, type AlmacenamientoStats } from '../api/almacenamiento';
import { categoriasApi, type Categoria } from '../api/categorias';
import { subtiposApi, type Subtipo } from '../api/subtipos';
import { proyectosApi, type Proyecto } from '../api/proyectos';
import { requerimientosApi } from '../api/requerimientos';
import { contratistasApi, type Contratista } from '../api/contratistas';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#ef4444'];

/**
 * HU-21: Distribución de documentos por categoría (con drill-down a subtipo).
 * Filtros: proyecto y rango de fechas. Los nombres de categoría/subtipo se
 * resuelven en el cliente a partir de los mantenedores.
 */
export default function ReportesPage() {
  const [stats, setStats] = useState<AlmacenamientoStats | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subtipos, setSubtipos] = useState<Subtipo[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [proyectoId, setProyectoId] = useState<string>('');
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  // Drill-down
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);

  // HU-22
  const [volumen, setVolumen] = useState<{
    byContratista: Array<{ contratistaId: number; total: number; abiertos: number; enProgreso: number; cerrados: number }>;
    mensual: Array<{ mes: string; creados: number }>;
  } | null>(null);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [volumenLoading, setVolumenLoading] = useState(true);
  const [volumenDesde, setVolumenDesde] = useState<string>('');
  const [volumenHasta, setVolumenHasta] = useState<string>('');
  const [exportandoStats, setExportandoStats] = useState(false);
  const [exportandoVolumen, setExportandoVolumen] = useState(false);

  // Catálogos (una vez)
  useEffect(() => {
    Promise.all([
      categoriasApi.findAll(1, 1000),
      subtiposApi.findAll(1, 1000),
      proyectosApi.getAll(1, 1000),
    ])
      .then(([cats, subs, proys]) => {
        setCategorias(cats.data || []);
        setSubtipos(subs.data || []);
        setProyectos(proys.data || []);
      })
      .catch(() => {});
  }, []);

  const cargarStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await almacenamientoApi.getStats({
        proyectoId: proyectoId ? Number(proyectoId) : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [proyectoId, desde, hasta]);

  useEffect(() => {
    cargarStats();
  }, [cargarStats]);

  const cargarVolumen = useCallback(async () => {
    setVolumenLoading(true);
    try {
      const data = await requerimientosApi.getVolumen({
        desde: volumenDesde || undefined,
        hasta: volumenHasta || undefined,
      });
      setVolumen(data);
    } catch {
      setVolumen(null);
    } finally {
      setVolumenLoading(false);
    }
  }, [volumenDesde, volumenHasta]);

  useEffect(() => {
    cargarVolumen();
  }, [cargarVolumen]);

  useEffect(() => {
    contratistasApi.getAll(1, 1000)
      .then(res => setContratistas(res.data || []))
      .catch(() => {});
  }, []);

  const categoriaMap = useMemo(
    () => new Map(categorias.map((c) => [c.id, c.nombre])),
    [categorias],
  );
  const subtipoMap = useMemo(
    () => new Map(subtipos.map((s) => [s.id, s])),
    [subtipos],
  );

  const catData = useMemo(
    () =>
      (stats?.byCategoria || []).map((c) => ({
        categoriaId: c.categoriaId,
        nombre: categoriaMap.get(c.categoriaId) || `Categoría ${c.categoriaId}`,
        count: c.count,
      })),
    [stats, categoriaMap],
  );

  const subData = useMemo(() => {
    if (selectedCategoriaId == null || !stats) return [];
    return stats.bySubtipo
      .map((s) => ({ count: s.count, info: subtipoMap.get(s.subtipoId) }))
      .filter((s) => s.info && s.info.categoriaId === selectedCategoriaId)
      .map((s) => ({ nombre: s.info!.nombre, count: s.count }));
  }, [selectedCategoriaId, stats, subtipoMap]);

  const contratistaMap = useMemo(
    () => new Map(contratistas.map((c) => [c.id, c.nombre])),
    [contratistas],
  );

  const handleExportStats = async () => {
    setExportandoStats(true);
    try {
      await almacenamientoApi.exportStats({
        proyectoId: proyectoId ? Number(proyectoId) : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
    } catch (e: any) {
      console.error('Error exportando stats:', e.message);
    } finally {
      setExportandoStats(false);
    }
  };

  const handleExportVolumen = async () => {
    setExportandoVolumen(true);
    try {
      await requerimientosApi.exportVolumen({
        desde: volumenDesde || undefined,
        hasta: volumenHasta || undefined,
      });
    } catch (e: any) {
      console.error('Error exportando volumen:', e.message);
    } finally {
      setExportandoVolumen(false);
    }
  };

  const limpiarFiltros = () => {
    setProyectoId('');
    setDesde('');
    setHasta('');
    setSelectedCategoriaId(null);
  };

  return (
    <div className="page-content">
      {/* Filtros */}
      <div className="dashboard-card full-width">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Distribución de documentos por categoría</h3>
          <button
            className="btn btn-secondary"
            onClick={handleExportStats}
            disabled={exportandoStats}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            {exportandoStats ? (
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Exportar a Excel
          </button>
        </div>
        <div className="reportes-filtros">
          <label>
            Proyecto
            <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
              <option value="">Todos</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button className="btn btn-secondary" onClick={limpiarFiltros}>Limpiar</button>
          <span className="reportes-total">Total documentos: <strong>{stats?.total ?? 0}</strong></span>
        </div>
      </div>

      {/* Gráfico por categoría */}
      <div className="dashboard-card full-width">
        <div className="card-header">
          <h4 className="req-trend-title" style={{ margin: 0 }}>Por categoría (clic en una barra para ver sus subtipos)</h4>
        </div>
        {loading ? (
          <p className="recent-activity-empty">Cargando…</p>
        ) : catData.length === 0 ? (
          <p className="recent-activity-empty">No hay documentos para los filtros seleccionados.</p>
        ) : (
          <div style={{ padding: '0 8px 16px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Documentos"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d: any) => setSelectedCategoriaId(d?.categoriaId ?? null)}
                >
                  {catData.map((entry, i) => (
                    <Cell
                      key={entry.categoriaId}
                      fill={COLORS[i % COLORS.length]}
                      opacity={selectedCategoriaId == null || selectedCategoriaId === entry.categoriaId ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Drill-down: subtipos de la categoría seleccionada */}
      {selectedCategoriaId != null && (
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h4 className="req-trend-title" style={{ margin: 0 }}>
              Subtipos de «{categoriaMap.get(selectedCategoriaId) || selectedCategoriaId}»
            </h4>
            <button className="btn-text-action" onClick={() => setSelectedCategoriaId(null)}>Cerrar</button>
          </div>
          {subData.length === 0 ? (
            <p className="recent-activity-empty">Sin subtipos con documentos en esta categoría.</p>
          ) : (
            <div style={{ padding: '0 8px 16px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nombre" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Documentos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* HU-22: Volumen de requerimientos por contratista */}
      <div className="dashboard-card full-width">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Volumen de requerimientos por contratista</h3>
          <button
            className="btn btn-secondary"
            onClick={handleExportVolumen}
            disabled={exportandoVolumen}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            {exportandoVolumen ? (
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Exportar a Excel
          </button>
        </div>

        <div className="reportes-filtros">
          <label>
            Desde
            <input type="date" value={volumenDesde} onChange={(e) => setVolumenDesde(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={volumenHasta} onChange={(e) => setVolumenHasta(e.target.value)} />
          </label>
          <button className="btn btn-secondary" onClick={() => { setVolumenDesde(''); setVolumenHasta(''); }}>
            Limpiar
          </button>
        </div>

        {volumenLoading ? (
          <p className="recent-activity-empty">Cargando…</p>
        ) : !volumen || volumen.byContratista.length === 0 ? (
          <p className="recent-activity-empty">No hay datos para los filtros seleccionados.</p>
        ) : (
          <div style={{ overflowX: 'auto', padding: '0 8px 12px' }}>
            <table className="data-table" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Contratista</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Abiertos</th>
                  <th style={{ textAlign: 'center' }}>En Progreso</th>
                  <th style={{ textAlign: 'center' }}>Cerrados</th>
                </tr>
              </thead>
              <tbody>
                {volumen.byContratista.map((row) => (
                  <tr key={row.contratistaId}>
                    <td>{contratistaMap.get(row.contratistaId) || `Contratista #${row.contratistaId}`}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.total}</td>
                    <td style={{ textAlign: 'center', color: 'var(--info)' }}>{row.abiertos}</td>
                    <td style={{ textAlign: 'center', color: 'var(--warning)' }}>{row.enProgreso}</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{row.cerrados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {volumen && volumen.mensual.length > 0 && (
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h4 className="req-trend-title" style={{ margin: 0 }}>
              Requerimientos creados por mes — últimos 6 meses
            </h4>
          </div>
          <div style={{ padding: '0 8px 16px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={volumen.mensual} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="creados" name="Creados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
