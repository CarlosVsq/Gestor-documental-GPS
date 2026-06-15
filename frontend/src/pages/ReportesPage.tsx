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
        <div className="card-header">
          <h3>Distribución de documentos por categoría</h3>
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
    </div>
  );
}
