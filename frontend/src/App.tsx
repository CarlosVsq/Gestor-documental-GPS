import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContratistaForm from './components/ContratistaForm';
import ContratistasTable from './components/ContratistasTable';
import AreasTable from './components/AreasTable';
import AreaForm from './components/AreaForm';
import ProyectosTable from './components/ProyectosTable';
import ProyectoForm from './components/ProyectoForm';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import CategoriasPage from './pages/CategoriasPage';
import SubtiposPage from './pages/SubtiposPage';
import RequerimientosPage from './pages/RequerimientosPage';
import AlmacenamientoPage, { type PrefilledRequerimiento } from './pages/almacenamiento/AlmacenamientoPage';
import { requerimientosApi, type Requerimiento } from './api/requerimientos';
import { useAuth } from './context/AuthContext';
import { contratistasApi } from './api/contratistas';
import type { Contratista, CreateContratistaDto, ContratistaStats } from './api/contratistas';
import { areasApi } from './api/areas';
import type { Area, CreateAreaDto, AreaStats } from './api/areas';
import { proyectosApi } from './api/proyectos';
import type { Proyecto, CreateProyectoDto, ProyectoStats } from './api/proyectos';
import { Permission } from './common/permissions';
import { useIdleTimer } from './hooks/useIdleTimer';
import IdleWarningModal from './components/IdleWarningModal';
import NotificationBell from './components/NotificationBell';
import NotificationPanel from './components/NotificationPanel';
import { notificacionesApi, type Notificacion } from './api/notificaciones';

export type ActivePage = 'dashboard' | 'contratistas' | 'areas' | 'proyectos' | 'categorias' | 'subtipos' | 'requerimientos' | 'almacenamiento' | 'reportes' | 'usuarios';

// ============================================================
// Helpers reutilizables
// ============================================================
const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const getRoleLabel = (rol: string) => {
  const roles: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', colaborador: 'Colaborador', auditor: 'Auditor', gerente: 'Gerente', contratista: 'Contratista' };
  return roles[rol] || rol;
};

// ============================================================
// Layout principal con Sidebar
// ============================================================
const getPageHeaderInfo = (page: ActivePage) => {
  switch (page) {
    case 'dashboard': return { title: 'Dashboard', desc: 'Vista general del Sistema de Gestión Documental' };
    case 'contratistas': return { title: 'Contratistas', desc: 'Gestiona los contratistas registrados en el sistema' };
    case 'areas': return { title: 'Áreas', desc: 'Gestiona las áreas registradas en el sistema' };
    case 'proyectos': return { title: 'Proyectos', desc: 'Gestiona los proyectos vinculados a áreas y contratistas' };
    case 'categorias': return { title: 'Categorías', desc: 'Gestiona la taxonomía documental principal' };
    case 'subtipos': return { title: 'Subtipos', desc: 'Gestiona los subtipos documentales por categoría' };
    case 'usuarios': return { title: 'Administración de Usuarios', desc: 'Gestión de accesos y roles del Sistema de Gestión Documental' };
    case 'almacenamiento': return { title: 'Gestión de Documentos', desc: 'Expedientes digitales, carga de archivos y firma digital' };
    default: return { title: page.charAt(0).toUpperCase() + page.slice(1), desc: 'Esta sección estará disponible próximamente' };
  }
};

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sincronizar URL -> activePage al cargar o cambiar de ruta en el navegador
  useEffect(() => {
    const path = location.pathname.substring(1); // Remover la primera barra '/'
    const validPages: ActivePage[] = ['dashboard', 'contratistas', 'areas', 'proyectos', 'categorias', 'subtipos', 'requerimientos', 'almacenamiento', 'reportes', 'usuarios'];
    if (validPages.includes(path as ActivePage)) {
      setActivePage(path as ActivePage);
    } else if (location.pathname === '/') {
      setActivePage('dashboard');
    }
  }, [location.pathname]);

  // Sincronizar activePage -> URL al navegar
  const handleNavigate = useCallback((page: ActivePage) => {
    setActivePage(page);
    navigate(`/${page === 'dashboard' ? '' : page}`);
  }, [navigate]);

  // --- Inactividad (HU-27) ---
  const { showWarning, remainingTime, warningMessage, resetTimers } = useIdleTimer();

  // --- Notificaciones SSE (HU-34/35) ---
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  useEffect(() => {
    // Suscribirse al stream de notificaciones mediante SSE
    const unsubscribe = notificacionesApi.subscribeToStream((data) => {
      setNotificaciones(data.notificaciones);
      setUnreadCount(data.count);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificacionesApi.marcarLeida(id);
      setNotificaciones(prev =>
        prev.map(n => (n.id === id ? { ...n, leida: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificacionesApi.marcarTodasLeidas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Contratistas state (reutilizado en Dashboard y ContratistasPage) ---
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ContratistaStats>({ total: 0, activos: 0, inactivos: 0 });
  const [loading, setLoading] = useState(true);
  const [editingContratista, setEditingContratista] = useState<Contratista | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // --- Áreas state (HU-02) ---
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasTotal, setAreasTotal] = useState(0);
  const [areasStats, setAreasStats] = useState<AreaStats>({ total: 0, activas: 0, inactivas: 0 });
  const [areasLoading, setAreasLoading] = useState(true);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);

  // --- Proyectos state (HU-03) ---
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectosTotal, setProyectosTotal] = useState(0);
  const [proyectosStats, setProyectosStats] = useState<ProyectoStats>({ total: 0, activos: 0, inactivos: 0 });
  const [proyectosLoading, setProyectosLoading] = useState(true);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  const [showProyectoForm, setShowProyectoForm] = useState(false);

  // --- HU-N6: shortcut desde Requerimientos al document set ---
  const [prefilledReq, setPrefilledReq] = useState<PrefilledRequerimiento | null>(null);
  const handleNavigateToDocs = useCallback((req: Requerimiento) => {
    if (!req.storagePath) return;
    setPrefilledReq({ id: req.id, codigoTicket: req.codigoTicket, storagePath: req.storagePath });
    handleNavigate('almacenamiento');
  }, [handleNavigate]);

  // HU-34/HU-35 (Fix 3): al hacer click en una notificación, navegar a su recurso.
  // Reutiliza el patrón HU-N6: si el requerimiento tiene expediente, abre su
  // document set; si no, cae a la vista de Requerimientos.
  const handleNotificationNavigate = useCallback(async (notif: Notificacion) => {
    setShowNotificationPanel(false);
    if (!notif.requerimientoId) return;
    try {
      const req = await requerimientosApi.getById(notif.requerimientoId);
      if (req?.storagePath) {
        handleNavigateToDocs(req);
      } else {
        handleNavigate('requerimientos');
      }
    } catch (err) {
      console.error('No se pudo navegar desde la notificación:', err);
      handleNavigate('requerimientos');
    }
  }, [handleNavigateToDocs, handleNavigate]);

  // HU-33 (Fase 1): abre el expediente del requerimiento de un documento reciente.
  // Reutiliza el flujo HU-N6 (getById + prefilledReq).
  const handleOpenRequerimientoDocs = useCallback(async (requerimientoId: number) => {
    try {
      const req = await requerimientosApi.getById(requerimientoId);
      if (req?.storagePath) {
        handleNavigateToDocs(req);
      } else {
        handleNavigate('requerimientos');
      }
    } catch (err) {
      console.error('No se pudo abrir el requerimiento:', err);
      handleNavigate('requerimientos');
    }
  }, [handleNavigateToDocs, handleNavigate]);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [response, statsData] = await Promise.all([
        contratistasApi.getAll(1, 50),
        contratistasApi.getStats(),
      ]);
      setContratistas(response.data);
      setTotal(response.total);
      setStats(statsData);
    } catch {
      showNotification('Error al cargar datos. ¿Está el backend corriendo en :3000?', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadAreasData = useCallback(async () => {
    try {
      setAreasLoading(true);
      const [response, statsData] = await Promise.all([
        areasApi.getAll(1, 50),
        areasApi.getStats(),
      ]);
      setAreas(response.data);
      setAreasTotal(response.total);
      setAreasStats(statsData);
    } catch {
      showNotification('Error al cargar áreas. ¿Está el backend corriendo en :3000?', 'error');
    } finally {
      setAreasLoading(false);
    }
  }, [showNotification]);

  const loadProyectosData = useCallback(async () => {
    try {
      setProyectosLoading(true);
      const [response, statsData] = await Promise.all([
        proyectosApi.getAll(1, 50),
        proyectosApi.getStats(),
      ]);
      setProyectos(response.data);
      setProyectosTotal(response.total);
      setProyectosStats(statsData);
    } catch {
      showNotification('Error al cargar proyectos. ¿Está el backend corriendo en :3000?', 'error');
    } finally {
      setProyectosLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { loadData(); loadAreasData(); loadProyectosData(); }, [loadData, loadAreasData, loadProyectosData]);

  // --- Contratistas handlers ---
  const handleCreate = async (data: CreateContratistaDto) => {
    try {
      await contratistasApi.create(data);
      showNotification('Contratista creado exitosamente', 'success');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear contratista', 'error');
    }
  };

  const handleUpdate = async (data: CreateContratistaDto) => {
    if (!editingContratista) return;
    try {
      await contratistasApi.update(editingContratista.id, data);
      showNotification('Contratista actualizado exitosamente', 'success');
      setEditingContratista(null);
      setShowForm(false);
      loadData();
      loadAreasData();
      loadProyectosData();
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar', 'error');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await contratistasApi.toggle(id);
      showNotification('Estado del contratista actualizado', 'success');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error al cambiar estado', 'error');
    }
  };

  // --- Áreas handlers (HU-02) ---
  const handleCreateArea = async (data: CreateAreaDto) => {
    try {
      await areasApi.create(data);
      showNotification('Área creada exitosamente', 'success');
      setShowAreaForm(false);
      loadAreasData();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear área', 'error');
    }
  };

  const handleUpdateArea = async (data: CreateAreaDto) => {
    if (!editingArea) return;
    try {
      await areasApi.update(editingArea.id, data);
      showNotification('Área actualizada exitosamente', 'success');
      setEditingArea(null);
      setShowAreaForm(false);
      loadAreasData();
      loadProyectosData();
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar área', 'error');
    }
  };

  const handleToggleArea = async (id: number) => {
    try {
      await areasApi.toggle(id);
      showNotification('Estado del área actualizado', 'success');
      loadAreasData();
    } catch (err: any) {
      showNotification(err.message || 'Error al cambiar estado del área', 'error');
    }
  };

  // --- Proyectos handlers (HU-03) ---
  const handleCreateProyecto = async (data: CreateProyectoDto) => {
    try {
      await proyectosApi.create(data);
      showNotification('Proyecto creado exitosamente', 'success');
      setShowProyectoForm(false);
      loadProyectosData();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear proyecto', 'error');
    }
  };

  const handleUpdateProyecto = async (data: CreateProyectoDto) => {
    if (!editingProyecto) return;
    try {
      await proyectosApi.update(editingProyecto.id, data);
      showNotification('Proyecto actualizado exitosamente', 'success');
      setEditingProyecto(null);
      setShowProyectoForm(false);
      loadProyectosData();
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar proyecto', 'error');
    }
  };

  const handleToggleProyecto = async (id: number) => {
    try {
      await proyectosApi.toggle(id);
      showNotification('Estado del proyecto actualizado', 'success');
      loadProyectosData();
    } catch (err: any) {
      showNotification(err.message || 'Error al cambiar estado del proyecto', 'error');
    }
  };

  // ============================================================
  // Render page content based on activePage
  // ============================================================
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard stats={stats} totalContratistas={total} areasTotal={areasTotal} proyectosTotal={proyectosTotal} onNavigate={handleNavigate} onOpenRequerimiento={handleOpenRequerimientoDocs} />;

      case 'contratistas':
        return (
          <ProtectedRoute requiredPermissions={[Permission.MANAGE_MANTENEDORES]}>
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
              <ContratistasTable contratistas={contratistas} total={total} onEdit={(c) => { setEditingContratista(c); setShowForm(true); }} onToggle={handleToggle} loading={loading} />
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
          </ProtectedRoute>
        );

      case 'areas':
        return (
          <ProtectedRoute requiredPermissions={[Permission.MANAGE_MANTENEDORES]}>
            <div className="page-content">
              <div style={{ marginBottom: '20px' }}>
                <button className="btn btn-primary" onClick={() => { setEditingArea(null); setShowAreaForm(true); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Nueva Área
                </button>
              </div>
              <div className="mini-stats-bar">
                <div className="mini-stat"><span className="mini-stat-value">{areasStats.total}</span><span className="mini-stat-label">Total</span></div>
                <div className="mini-stat"><span className="mini-stat-value active-val">{areasStats.activas}</span><span className="mini-stat-label">Activas</span></div>
                <div className="mini-stat"><span className="mini-stat-value inactive-val">{areasStats.inactivas}</span><span className="mini-stat-label">Inactivas</span></div>
              </div>
              <AreasTable areas={areas} total={areasTotal} onEdit={(a) => { setEditingArea(a); setShowAreaForm(true); }} onToggle={handleToggleArea} loading={areasLoading} />
              {showAreaForm && (
                <div className="modal-overlay" onClick={() => { setEditingArea(null); setShowAreaForm(false); }}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <AreaForm
                      onSubmit={editingArea ? handleUpdateArea : handleCreateArea}
                      initialData={editingArea ? { nombre: editingArea.nombre, codigoArea: editingArea.codigoArea, descripcion: editingArea.descripcion || '', contratistaId: editingArea.contratistaId } : undefined}
                      isEditing={!!editingArea}
                      onCancel={() => { setEditingArea(null); setShowAreaForm(false); }}
                      contratistas={contratistas}
                    />
                  </div>
                </div>
              )}
            </div>
          </ProtectedRoute>
        );

      case 'proyectos':
        return (
          <ProtectedRoute requiredPermissions={[Permission.MANAGE_MANTENEDORES]}>
            <div className="page-content">
              <div style={{ marginBottom: '20px' }}>
                <button className="btn btn-primary" onClick={() => { setEditingProyecto(null); setShowProyectoForm(true); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Nuevo Proyecto
                </button>
              </div>
              <div className="mini-stats-bar">
                <div className="mini-stat"><span className="mini-stat-value">{proyectosStats.total}</span><span className="mini-stat-label">Total</span></div>
                <div className="mini-stat"><span className="mini-stat-value active-val">{proyectosStats.activos}</span><span className="mini-stat-label">Activos</span></div>
                <div className="mini-stat"><span className="mini-stat-value inactive-val">{proyectosStats.inactivos}</span><span className="mini-stat-label">Inactivos</span></div>
              </div>
              <ProyectosTable proyectos={proyectos} total={proyectosTotal} onEdit={(p) => { setEditingProyecto(p); setShowProyectoForm(true); }} onToggle={handleToggleProyecto} loading={proyectosLoading} />
              {showProyectoForm && (
                <div className="modal-overlay" onClick={() => { setEditingProyecto(null); setShowProyectoForm(false); }}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <ProyectoForm
                      onSubmit={editingProyecto ? handleUpdateProyecto : handleCreateProyecto}
                      initialData={editingProyecto ? { nombre: editingProyecto.nombre, fechaInicio: editingProyecto.fechaInicio?.split('T')[0] || editingProyecto.fechaInicio, fechaFin: editingProyecto.fechaFin?.split('T')[0] || editingProyecto.fechaFin, areaId: editingProyecto.areaId, ubicacion: editingProyecto.ubicacion, presupuestoEstimado: editingProyecto.presupuestoEstimado, horasHombre: editingProyecto.horasHombre, estadoProyecto: editingProyecto.estadoProyecto } : undefined}
                      isEditing={!!editingProyecto}
                      onCancel={() => { setEditingProyecto(null); setShowProyectoForm(false); }}
                      areas={areas}
                    />
                  </div>
                </div>
              )}
            </div>
          </ProtectedRoute>
        );

      case 'usuarios':
        return (
          <ProtectedRoute requiredPermissions={[Permission.MANAGE_USERS]}>
            <UsersPage onNotify={showNotification} />
          </ProtectedRoute>
        );

      case 'categorias':
        return (
          <ProtectedRoute requiredPermissions={[Permission.MANAGE_MANTENEDORES]}>
            <CategoriasPage onNotify={showNotification} />
          </ProtectedRoute>
        );

      case 'subtipos':
        return (
          <ProtectedRoute requiredPermissions={[Permission.MANAGE_MANTENEDORES]}>
            <SubtiposPage onNotify={showNotification} />
          </ProtectedRoute>
        );

      case 'requerimientos':
        return (
          <ProtectedRoute requiredPermissions={[Permission.READ_ALL_REQUERIMIENTOS, Permission.CREATE_REQUERIMIENTO]}>
            <RequerimientosPage onNotify={showNotification} onNavigateToDocs={handleNavigateToDocs} />
          </ProtectedRoute>
        );

      case 'almacenamiento':
        return (
          <ProtectedRoute requiredPermissions={[Permission.UPLOAD_DOCUMENT, Permission.DOWNLOAD_DOCUMENT]}>
            <AlmacenamientoPage
              onNotify={showNotification}
              prefilledRequerimiento={prefilledReq}
              onPrefillConsumed={() => setPrefilledReq(null)}
            />
          </ProtectedRoute>
        );

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
        onNavigate={handleNavigate}
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
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Bell Icon for Notifications */}
            <NotificationBell
              count={unreadCount}
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              panelOpen={showNotificationPanel}
            />

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

      {/* Warning modal for idle timeout */}
      {showWarning && (
        <IdleWarningModal
          remainingTime={remainingTime}
          message={warningMessage}
          onContinue={resetTimers}
          onLogout={logout}
        />
      )}

      {/* Notification drawer panel */}
      <NotificationPanel
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
        notificaciones={notificaciones}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNavigate={handleNotificationNavigate}
      />
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
