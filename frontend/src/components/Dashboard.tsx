import { useState, useEffect } from 'react';
import type { ActivePage } from '../App';
import type { ContratistaStats } from '../api/contratistas';

interface DashboardProps {
  stats: ContratistaStats;
  totalContratistas: number;
  areasTotal: number;
  proyectosTotal: number;
  onNavigate: (page: ActivePage) => void;
}

export default function Dashboard({ stats, totalContratistas, areasTotal, proyectosTotal, onNavigate }: DashboardProps) {
  const [totalUsuarios, setTotalUsuarios] = useState(0);

  useEffect(() => {
    // Obtenemos los usuarios reales (ignoramos el error si no hay token o algo falla)
    fetch('http://localhost:3000/auth/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTotalUsuarios(data.length);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="page-content">

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate('usuarios')}>
          <div className="kpi-icon-wrap" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalUsuarios}</span>
            <span className="kpi-label">Usuarios</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('contratistas')}>
          <div className="kpi-icon-wrap" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalContratistas}</span>
            <span className="kpi-label">Contratistas</span>
          </div>
        </div>

        <div className="kpi-card kpi-orange" onClick={() => onNavigate('proyectos')}>
          <div className="kpi-icon-wrap">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{proyectosTotal}</span>
            <span className="kpi-label">Proyectos</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple" onClick={() => onNavigate('areas')}>
          <div className="kpi-icon-wrap">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{areasTotal}</span>
            <span className="kpi-label">Áreas</span>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Acciones Rápidas</h3>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => onNavigate('contratistas')}>
              <div className="qa-icon qa-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              </div>
              <span>Nuevo Contratista</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('requerimientos')}>
              <div className="qa-icon qa-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              </div>
              <span>Crear Requerimiento</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('documentos')}>
              <div className="qa-icon qa-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <span>Subir Documento</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('usuarios')}>
              <div className="qa-icon" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              </div>
              <span>Crear Usuario</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('areas')}>
              <div className="qa-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
              </div>
              <span>Nueva Área</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('proyectos')}>
              <div className="qa-icon" style={{ background: 'var(--orange-50)', color: 'var(--orange-500)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              </div>
              <span>Nuevo Proyecto</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('reportes')}>
              <div className="qa-icon qa-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <span>Ver Reportes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
