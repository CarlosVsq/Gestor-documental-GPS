import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { requerimientosApi, type RequerimientosStats } from '../api/requerimientos';
import type { ActivePage } from '../App';

interface RequerimientosKpisProps {
  onNavigate: (page: ActivePage) => void;
}

const REFRESH_MS = 30000;

/**
 * HU-23: Panel de KPIs de estados de requerimientos en (casi) tiempo real.
 * Conteos por estado + alerta de estancados (>7 días sin cerrar) + tendencia
 * semanal (creados vs cerrados). Se refresca por polling cada 30 s.
 */
export default function RequerimientosKpis({ onNavigate }: RequerimientosKpisProps) {
  const [stats, setStats] = useState<RequerimientosStats | null>(null);

  const cargar = useCallback(async () => {
    try {
      setStats(await requerimientosApi.getStats());
    } catch {
      // Silencioso: no debe romper el dashboard si el endpoint falla.
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, REFRESH_MS);
    return () => clearInterval(interval);
  }, [cargar]);

  if (!stats) return null;

  return (
    <div className="dashboard-card full-width">
      <div className="card-header">
        <h3>Estado de Requerimientos</h3>
      </div>

      {stats.estancados > 0 && (
        <div className="kpi-alert">
          ⚠️ {stats.estancados} requerimiento(s) estancado(s) — más de 7 días sin cerrar.
        </div>
      )}

      <div className="req-kpi-grid">
        <div className="req-kpi req-kpi-abierto" onClick={() => onNavigate('requerimientos')}>
          <span className="req-kpi-value">{stats.abiertos}</span>
          <span className="req-kpi-label">Abiertos</span>
        </div>
        <div className="req-kpi req-kpi-progreso" onClick={() => onNavigate('requerimientos')}>
          <span className="req-kpi-value">{stats.enProgreso}</span>
          <span className="req-kpi-label">En Progreso</span>
        </div>
        <div className="req-kpi req-kpi-cerrado" onClick={() => onNavigate('requerimientos')}>
          <span className="req-kpi-value">{stats.cerrados}</span>
          <span className="req-kpi-label">Cerrados</span>
        </div>
        <div className="req-kpi req-kpi-estancado" onClick={() => onNavigate('requerimientos')}>
          <span className="req-kpi-value">{stats.estancados}</span>
          <span className="req-kpi-label">Estancados</span>
        </div>
      </div>

      <div className="req-trend-chart">
        <h4 className="req-trend-title">Tendencia — últimas 8 semanas</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.tendencia} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="semana" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="creados" name="Creados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
