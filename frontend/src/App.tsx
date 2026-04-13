import { useState, useEffect, useCallback } from 'react';
import ContratistaForm from './components/ContratistaForm';
import ContratistasTable from './components/ContratistasTable';
import { contratistasApi } from './api/contratistas';
import type { Contratista, CreateContratistaDto, ContratistaStats } from './api/contratistas';

export type ActivePage = 'dashboard' | 'contratistas' | 'areas' | 'proyectos' | 'requerimientos' | 'documentos' | 'reportes' | 'usuarios';

function App() {
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ContratistaStats>({ total: 0, activos: 0, inactivos: 0 });
  const [loading, setLoading] = useState(true);
  const [editingContratista, setEditingContratista] = useState<Contratista | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este contratista?')) return;
    try {
      await contratistasApi.delete(id);
      showNotification('Contratista eliminado correctamente', 'success');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar', 'error');
    }
  };

  const handleEdit = (contratista: Contratista) => {
    setEditingContratista(contratista);
    setShowForm(true);
  };

  const handleNewContratista = () => {
    setEditingContratista(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingContratista(null);
    setShowForm(false);
  };

  return (
    <div className="app-container">
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

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Contratistas</h1>
          <p className="page-description">Gestiona los contratistas registrados en el sistema</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewContratista}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Contratista
        </button>
      </div>

      {/* Stats Bar */}
      <div className="mini-stats-bar">
        <div className="mini-stat">
          <span className="mini-stat-value">{stats.total}</span>
          <span className="mini-stat-label">Total</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-value active-val">{stats.activos}</span>
          <span className="mini-stat-label">Activos</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-value inactive-val">{stats.inactivos}</span>
          <span className="mini-stat-label">Inactivos</span>
        </div>
      </div>

      {/* Table */}
      <ContratistasTable
        contratistas={contratistas}
        total={total}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancelForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ContratistaForm
              onSubmit={editingContratista ? handleUpdate : handleCreate}
              initialData={editingContratista ? {
                nombre: editingContratista.nombre,
                rut: editingContratista.rut,
                email: editingContratista.email,
                telefono: editingContratista.telefono,
              } : undefined}
              isEditing={!!editingContratista}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
