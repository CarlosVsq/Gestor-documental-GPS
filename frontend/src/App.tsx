import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContratistaForm from './components/ContratistaForm';
import ContratistasTable from './components/ContratistasTable';
import AreaForm from './components/AreaForm';
import AreasTable from './components/AreasTable';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import DocumentosPage from './pages/DocumentosPage';
import { useAuth } from './context/AuthContext';
import { contratistasApi } from './api/contratistas';
import { areasApi } from './api/areas';
import type { Contratista, CreateContratistaDto, ContratistaStats } from './api/contratistas';
import type { Area, CreateAreaDto } from './api/areas';

export type ActivePage = 'dashboard' | 'contratistas' | 'areas' | 'proyectos' | 'requerimientos' | 'documentos' | 'reportes' | 'usuarios';

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('contratistas');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // States Contratistas
// ============================================================
// Helpers reutilizables
// ============================================================
const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const getRoleLabel = (rol: string) => {
  const roles: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', colaborador: 'Colaborador', lectura: 'Solo Lectura' };
  return roles[rol] || rol;
};

// ============================================================
// Layout principal con Sidebar
// ============================================================
const getPageHeaderInfo = (page: ActivePage) => {
  switch (page) {
    case 'dashboard': return { title: 'Dashboard', desc: 'Vista general del Sistema de Gestión Documental' };
    case 'contratistas': return { title: 'Contratistas', desc: 'Gestiona los contratistas registrados en el sistema' };
    case 'usuarios': return { title: 'Usuarios', desc: 'Gestiona los usuarios con acceso al sistema' };
    case 'documentos': return { title: 'Documentos', desc: 'Sube y centraliza la documentación técnica de las obras' };
    default: return { title: page.charAt(0).toUpperCase() + page.slice(1), desc: 'Esta sección estará disponible próximamente' };
  }
};

function AppLayout() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- Contratistas state (reutilizado en Dashboard y ContratistasPage) ---
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [cTotal, setCTotal] = useState(0);
  const [cStats, setCStats] = useState<ContratistaStats>({ total: 0, activos: 0, inactivos: 0 });
  const [editingContratista, setEditingContratista] = useState<Contratista | null>(null);

  // States Areas
  const [areas, setAreas] = useState<Area[]>([]);
  const [aTotal, setATotal] = useState(0);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activePage === 'contratistas') {
        const [response, statsData] = await Promise.all([
          contratistasApi.getAll(1, 50),
          contratistasApi.getStats(),
        ]);
        setContratistas(response.data);
        setCTotal(response.total);
        setCStats(statsData);
      } else if (activePage === 'areas') {
        const response = await areasApi.getAll();
        setAreas(response);
        setATotal(response.length);
      }
    } catch {
      showNotification('Error al cargar datos. ¿Está el backend corriendo en :3000?', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Contratistas handlers ---
  const handleCreate = async (data: CreateContratistaDto) => {
    try {
      await contratistasApi.create(data);
      showNotification('Contratista creado', 'success');
      setShowForm(false);
      loadData();
    } catch (err: any) { showNotification(err.message, 'error') }
  };
  const handleUpdateC = async (data: CreateContratistaDto) => {
    if (!editingContratista) return;
    try {
      await contratistasApi.update(editingContratista.id, data);
      showNotification('Contratista actualizado', 'success');
      setEditingContratista(null); setShowForm(false); loadData();
    } catch (err: any) { showNotification(err.message, 'error') }
  };
  const handleDeleteC = async (id: number) => {
    if (!window.confirm('¿Seguro?')) return;
    try { await contratistasApi.delete(id); showNotification('Eliminado', 'success'); loadData(); }
    catch (err: any) { showNotification(err.message, 'error') }
  };

  // Areas Handlers
  const handleCreateA = async (data: CreateAreaDto) => {
    try {
      await areasApi.create(data);
      showNotification('Área creada exitosamente', 'success');
      setShowForm(false); loadData();
    } catch (err: any) { showNotification(err.message, 'error') }
  };
  const handleUpdateA = async (data: CreateAreaDto) => {
    if (!editingArea) return;
    try {
      await areasApi.update(editingArea.id, data);
      showNotification('Área actualizada', 'success');
      setEditingArea(null); setShowForm(false); loadData();
    } catch (err: any) { showNotification(err.message, 'error') }
  };
  const handleDeleteA = async (id: number) => {
    if (!window.confirm('¿Seguro de eliminar esta área?')) return;
    try { await areasApi.delete(id); showNotification('Área eliminada', 'success'); loadData(); }
    catch (err: any) { showNotification(err.message, 'error') }
  };

  const handleCancelForm = () => {
    setEditingContratista(null);
    setEditingArea(null);
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); setShowForm(false); }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="app-container" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {notification && (
          <div className={`toast toast-${notification.type}`}>
            <div className="toast-icon">
              {notification.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
            </div>
            <span>{notification.message}</span>
            <button className="toast-close" onClick={() => setNotification(null)}>×</button>
          </div>
        )}

        <div className="page-header">
          <div className="page-header-left">
            <h1>{activePage === 'contratistas' ? 'Gestión de Contratistas' : activePage === 'areas' ? 'Gestión de Áreas' : activePage}</h1>
            <p className="page-description">Administración de registros en el sistema</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingContratista(null); setEditingArea(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Nuevo {activePage === 'areas' ? 'Área' : 'Contratista'}
          </button>
        </div>

        {activePage === 'contratistas' && (
          <>
            <div className="mini-stats-bar" style={{ marginBottom: '20px' }}>
              <div className="mini-stat"><span className="mini-stat-value">{cStats.total}</span><span className="mini-stat-label">Total</span></div>
              <div className="mini-stat"><span className="mini-stat-value active-val">{cStats.activos}</span><span className="mini-stat-label">Activos</span></div>
              <div className="mini-stat"><span className="mini-stat-value inactive-val">{cStats.inactivos}</span><span className="mini-stat-label">Inactivos</span></div>
            </div>
            <ContratistasTable contratistas={contratistas} total={cTotal} loading={loading} onEdit={(c) => { setEditingContratista(c); setShowForm(true); }} onDelete={handleDeleteC} />
          </>
        )}

        {activePage === 'areas' && (
          <>
            <div className="mini-stats-bar" style={{ marginBottom: '20px' }}>
              <div className="mini-stat"><span className="mini-stat-value">{aTotal}</span><span className="mini-stat-label">Total Áreas</span></div>
            </div>
            <AreasTable areas={areas} total={aTotal} loading={loading} onEdit={(a) => { setEditingArea(a); setShowForm(true); }} onDelete={handleDeleteA} />
          </>
        )}

        {showForm && activePage === 'contratistas' && (
          <div className="modal-overlay" onClick={handleCancelForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <ContratistaForm onSubmit={editingContratista ? handleUpdateC : handleCreateC} initialData={editingContratista || undefined} isEditing={!!editingContratista} onCancel={handleCancelForm} />
            </div>
          </div>
        )}

        {showForm && activePage === 'areas' && (
          <div className="modal-overlay" onClick={handleCancelForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <AreaForm onSubmit={editingArea ? handleUpdateA : handleCreateA} initialData={editingArea || undefined} isEditing={!!editingArea} onCancel={handleCancelForm} />
            </div>
          </div>
        )}

  // ============================================================
  // Render page content based on activePage
  // ============================================================
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard stats={stats} totalContratistas={total} onNavigate={setActivePage} />;

      case 'contratistas':
        return (
          <div className="page-content">
            <div style={{ marginBottom: '20px' }}>
              <button className="btn btn-primary" onClick={() => { setEditingContratista(null); setShowForm(true); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nuevo Contratista
              </button>
            </div>
            <div className="mini-stats-bar">
              <div className="mini-stat"><span className="mini-stat-value">{stats.total}</span><span className="mini-stat-label">Total</span></div>
              <div className="mini-stat"><span className="mini-stat-value active-val">{stats.activos}</span><span className="mini-stat-label">Activos</span></div>
              <div className="mini-stat"><span className="mini-stat-value inactive-val">{stats.inactivos}</span><span className="mini-stat-label">Inactivos</span></div>
            </div>
            <ContratistasTable contratistas={contratistas} total={total} onEdit={(c) => { setEditingContratista(c); setShowForm(true); }} onDelete={handleDelete} loading={loading} />
            {showForm && (
              <div className="modal-overlay" onClick={() => { setEditingContratista(null); setShowForm(false); }}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <ContratistaForm
                    onSubmit={editingContratista ? handleUpdate : handleCreate}
                    initialData={editingContratista ? { nombre: editingContratista.nombre, rut: editingContratista.rut, email: editingContratista.email, telefono: editingContratista.telefono } : undefined}
                    isEditing={!!editingContratista}
                    onCancel={() => { setEditingContratista(null); setShowForm(false); }}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'usuarios':
        return <UsersPage onNotify={showNotification} />;

      case 'documentos':
        return <DocumentosPage onNotify={showNotification} />;

      default:
        return (
          <div className="page-content">

            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <h3>Próximamente</h3>
              <p>Esta funcionalidad se implementará en una futura iteración</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Notification Toast */}
        {notification && (
          <div className={`toast toast-${notification.type}`}>
            <div className="toast-icon">
              {notification.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
            </div>
            <span>{notification.message}</span>
            <button className="toast-close" onClick={() => setNotification(null)}>×</button>
          </div>
        )}

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="page-header-left">
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0, lineHeight: 1.2 }}>{getPageHeaderInfo(activePage).title}</h1>
              <p className="page-description" style={{ margin: 0, marginTop: '2px' }}>{getPageHeaderInfo(activePage).desc}</p>
            </div>
          </div>
          <div className="topbar-right">
            <div className="user-menu-container">
              <button className="user-menu-trigger" id="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar-sm">{user ? getInitials(user.nombre) : '?'}</div>
                <div className="user-info">
                  <span className="user-name">{user?.nombre || 'Usuario'}</span>
                  <span className="user-role">{user ? getRoleLabel(user.rol) : ''}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {showUserMenu && (
                <>
                  <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} />
                  <div className="user-menu-dropdown" id="user-menu-dropdown">
                    <div className="user-menu-header">
                      <div className="user-avatar-lg">{user ? getInitials(user.nombre) : '?'}</div>
                      <div>
                        <div className="user-menu-name">{user?.nombre}</div>
                        <div className="user-menu-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="user-menu-divider" />
                    <div className="user-menu-role-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <span>{user ? getRoleLabel(user.rol) : ''}</span>
                    </div>
                    <div className="user-menu-divider" />
                    <button className="user-menu-item user-menu-logout" id="logout-btn" onClick={logout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        {renderPage()}
      </div>
    </div>
  );
}

// ============================================================
// App con Routes
// ============================================================
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
