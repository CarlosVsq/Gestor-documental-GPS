import { useState, useEffect, useCallback } from 'react';
import ContratistaForm from './components/ContratistaForm';
import ContratistasTable from './components/ContratistasTable';
import AreaForm from './components/AreaForm';
import AreasTable from './components/AreasTable';
import Sidebar from './components/Sidebar';
import { contratistasApi } from './api/contratistas';
import { areasApi } from './api/areas';
import type { Contratista, CreateContratistaDto, ContratistaStats } from './api/contratistas';
import type { Area, CreateAreaDto } from './api/areas';

export type ActivePage = 'dashboard' | 'contratistas' | 'areas' | 'proyectos' | 'requerimientos' | 'documentos' | 'reportes' | 'usuarios';

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('contratistas');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // States Contratistas
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

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
  }, [activePage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Contratistas Handlers
  const handleCreateC = async (data: CreateContratistaDto) => {
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
      </div>
    </div>
  );
}

export default App;
