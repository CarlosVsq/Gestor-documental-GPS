import type { ActivePage } from '../App';
import type { ContratistaStats } from '../api/contratistas';

interface DashboardProps {
  stats: ContratistaStats;
  totalContratistas: number;
  onNavigate: (page: ActivePage) => void;
}

export default function Dashboard({ stats, totalContratistas, onNavigate }: DashboardProps) {
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p className="page-description">Vista general del Sistema de Gestión Documental</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue" onClick={() => onNavigate('contratistas')}>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalContratistas}</span>
            <span className="kpi-label">Contratistas</span>
          </div>
          <div className="kpi-trend up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{stats.activos}</span>
            <span className="kpi-label">Activos</span>
          </div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">0</span>
            <span className="kpi-label">Req. Abiertos</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-value">0</span>
            <span className="kpi-label">Documentos</span>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Acciones Rápidas</h3>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => onNavigate('contratistas')}>
              <div className="qa-icon qa-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              </div>
              <span>Nuevo Contratista</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('requerimientos')}>
              <div className="qa-icon qa-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </div>
              <span>Crear Requerimiento</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('documentos')}>
              <div className="qa-icon qa-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <span>Subir Documento</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('reportes')}>
              <div className="qa-icon qa-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <span>Ver Reportes</span>
            </button>
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Pipeline CI/CD</h3>
            <span className="badge badge-success-light">Operativo</span>
          </div>
          <div className="pipeline-list">
            {[
              { label: 'GitHub Issue (HU-01)', status: 'done' },
              { label: 'Branch feature/hu-01', status: 'done' },
              { label: 'Jest Tests (7/7)', status: 'done' },
              { label: 'Pull Request → main', status: 'done' },
              { label: 'GitHub Actions CI', status: 'done' },
              { label: 'Docker Build & Push', status: 'active' },
              { label: 'Deploy Servidor UBB', status: 'pending' },
            ].map((step, i) => (
              <div key={i} className={`pipeline-item pipeline-${step.status}`}>
                <div className="pipeline-dot" />
                <span className="pipeline-label">{step.label}</span>
                <span className={`pipeline-badge-${step.status}`}>
                  {step.status === 'done' ? '✓' : step.status === 'active' ? '⏳' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Stack Tecnológico</h3>
            <span className="badge badge-info-light">8 tecnologías</span>
          </div>
          <div className="tech-stack-grid">
            {[
              { name: 'React', desc: 'Frontend UI', color: '#61dafb', icon: '⚛️' },
              { name: 'NestJS', desc: 'Backend API', color: '#e0234e', icon: '🏗️' },
              { name: 'PostgreSQL', desc: 'Base de Datos', color: '#336791', icon: '🐘' },
              { name: 'Redis', desc: 'Caché', color: '#dc382d', icon: '🔴' },
              { name: 'TypeORM', desc: 'ORM', color: '#f37626', icon: '🔗' },
              { name: 'Docker', desc: 'Contenedores', color: '#2496ed', icon: '🐳' },
              { name: 'GitHub Actions', desc: 'CI/CD', color: '#2088ff', icon: '🔄' },
              { name: 'Swagger', desc: 'API Docs', color: '#85ea2d', icon: '📖' },
            ].map((tech) => (
              <div key={tech.name} className="tech-item">
                <span className="tech-icon">{tech.icon}</span>
                <div className="tech-info">
                  <span className="tech-name">{tech.name}</span>
                  <span className="tech-desc">{tech.desc}</span>
                </div>
                <div className="tech-bar" style={{ backgroundColor: tech.color + '30' }}>
                  <div className="tech-bar-fill" style={{ backgroundColor: tech.color, width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
