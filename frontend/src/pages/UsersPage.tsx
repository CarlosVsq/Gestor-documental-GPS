import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/users';
import type { UserRecord, CreateUserDto, UpdateUserDto } from '../api/users';
import { contratistasApi } from '../api/contratistas';
import type { Contratista } from '../api/contratistas';

/**
 * UsersPage — HU-19
 * CRUD de usuarios. Reutiliza los mismos componentes CSS de
 * ContratistasTable (table-card, table-toolbar, table-search, etc.)
 * y ContratistaForm (modal-form, form-fields, field-group, etc.)
 */

interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  contratistaId?: number;
}

const EMPTY_FORM: UserFormData = { nombre: '', email: '', password: '', rol: 'admin' };

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'contratista', label: 'Contratista' },
];

const getRoleLabel = (rol: string) => {
  const map: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', colaborador: 'Colaborador', auditor: 'Auditor', gerente: 'Gerente', contratista: 'Contratista' };
  return map[rol] || rol;
};

interface UsersPageProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export default function UsersPage({ onNotify }: UsersPageProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);

  const loadUsersAndContratistas = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, contratistasData] = await Promise.all([
        usersApi.getAll(),
        contratistasApi.getAll(1, 100), // Asumimos max 100 por ahora
      ]);
      setUsers(usersData);
      setContratistas(contratistasData.data);
    } catch {
      onNotify('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => { loadUsersAndContratistas(); }, [loadUsersAndContratistas]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      onNotify('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  // Se reemplaza el viejo useEffect por el que carga ambos
  // useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const handleOpenEdit = (user: UserRecord) => { setEditing(user); setForm({ nombre: user.nombre, email: user.email, password: '', rol: user.rol, contratistaId: user.contratistaId }); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const dto: UpdateUserDto = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.rol === 'contratista') dto.contratistaId = form.contratistaId;
        if (form.password) dto.password = form.password;
        await usersApi.update(editing.id, dto);
        onNotify('Usuario actualizado exitosamente', 'success');
      } else {
        const dto: CreateUserDto = { nombre: form.nombre, email: form.email, password: form.password, rol: form.rol };
        if (form.rol === 'contratista') dto.contratistaId = form.contratistaId;
        await usersApi.create(dto);
        onNotify('Usuario creado exitosamente', 'success');
      }
      handleClose();
      loadUsers();
    } catch (err: any) {
      onNotify(err.message || 'Error al guardar', 'error');
    }
  };

  const handleToggle = async (user: UserRecord) => {
    try {
      await usersApi.toggleActive(user.id);
      onNotify(`Usuario ${user.activo ? 'desactivado' : 'activado'}`, 'success');
      loadUsers();
    } catch {
      onNotify('Error al cambiar estado', 'error');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Usuarios</span>
            <span className="kpi-value">{users.length}</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Usuarios Activos</span>
            <span className="kpi-value">{users.filter(u => u.activo).length}</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--gray-100)', color: 'var(--gray-500)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Usuarios Inactivos</span>
            <span className="kpi-value">{users.filter(u => !u.activo).length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Action Button */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="table-search" style={{ margin: 0, width: '320px', background: 'white' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Buscar por nombre, email o rol..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          Crear Usuario
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: 'none', paddingBottom: 0 }}>
          <div className="table-filters">
            <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Cargando usuarios...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <h3>No hay usuarios registrados</h3>
            <p>Haz clic en "Nuevo Usuario" para crear el primer usuario</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Contratista</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th style={{ width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-person">
                        <div className="person-avatar" style={{ backgroundColor: `hsl(${(user.id * 67) % 360}, 60%, 65%)` }}>
                          {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="person-info">
                          <span className="person-name">{user.nombre}</span>
                          <span className="cell-muted" style={{ fontSize: '0.8rem' }}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info-light">{getRoleLabel(user.rol)}</span></td>
                    <td>
                      {user.rol === 'contratista' ? (
                        <span className="cell-muted" style={{ fontSize: '0.85rem' }}>
                          {user.contratistaId 
                            ? contratistas.find(c => c.id === user.contratistaId)?.nombre || 'Desconocido'
                            : 'Sin asignar'}
                        </span>
                      ) : (
                        <span className="cell-muted" style={{ fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${user.activo ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot" />
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="cell-muted cell-date">{formatDate(user.creadoEn)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn action-edit" title="Editar" onClick={() => handleOpenEdit(user)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          className={`action-btn ${user.activo ? 'action-delete' : 'action-edit'}`}
                          title={user.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => handleToggle(user)}
                        >
                          {user.activo ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal — reutiliza las mismas clases de ContratistaForm:
          .modal-overlay, .modal-content, .modal-form, .modal-form-header,
          .form-fields, .field-group, .modal-form-actions */}
      {showForm && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-form-header">
                <h2>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <p>{editing ? 'Modifica los datos del usuario seleccionado' : 'Completa los datos para crear un nuevo usuario'}</p>
              </div>

              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="user-nombre">Nombre completo <span className="required">*</span></label>
                  <input id="user-nombre" type="text" placeholder="Ej: Juan Pérez" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                </div>

                <div className="field-group">
                  <label htmlFor="user-email">Email <span className="required">*</span></label>
                  <input id="user-email" type="email" placeholder="Ej: juan@sgd.cl" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>

                <div className="field-group">
                  <label htmlFor="user-password">{editing ? 'Nueva contraseña' : 'Contraseña'} {!editing && <span className="required">*</span>}{editing && <span className="optional">(dejar vacío para no cambiar)</span>}</label>
                  <input id="user-password" type="password" placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} />
                </div>

                <div className="field-group">
                  <label htmlFor="user-rol">Rol</label>
                  <select id="user-rol" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value, contratistaId: undefined })} className="field-select">
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {form.rol === 'contratista' && (
                  <div className="field-group">
                    <label htmlFor="user-contratistaId">Contratista <span className="required">*</span></label>
                    <select id="user-contratistaId" value={form.contratistaId || ''} onChange={e => setForm({ ...form, contratistaId: Number(e.target.value) })} className="field-select" required>
                      <option value="" disabled>Seleccione un contratista</option>
                      {contratistas.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-form-actions">
                <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar Cambios' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
